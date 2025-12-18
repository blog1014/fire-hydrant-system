// map.js - 增加错误处理和等待地图加载
const MapManager = {
    map: null,
    userMarker: null,
    currentPosition: null,
    selectedHydrant: null,
    hydrantMarkers: [],
    geolocation: null,
    isMapLoaded: false,

    closeDetailPanel() {
        document.getElementById('detailPanel').classList.remove('show');
        setTimeout(() => {
            document.getElementById('detailPanel').style.display = 'none';
        }, 300);
    },

    // 初始化地图
    async initMap() {
        try {
            console.log('🗺️ 开始初始化地图...');
            
            // 等待高德地图API加载完成
            await this.waitForAMap();
            
            console.log('✅ 高德地图API已加载:', typeof AMap);
            
            this.map = new AMap.Map('mapContainer', {
                zoom: 13,
                center: [113.389810, 22.531800], // 中山市默认位置
                resizeEnable: true,
                mapStyle: 'amap://styles/normal',
                viewMode: '2D',
            });

            // 先初始化工具栏
            this.initToolBar();
            
            // 初始化定位功能
            await this.initGeolocation();
            
            // 加载消防栓数据
            await this.loadHydrantMarkers();
            
            // 绑定定位按钮
            this.bindLocationButton();
            
            this.isMapLoaded = true;
            console.log('✅ 地图初始化完成');
            
        } catch (error) {
            console.error('地图初始化失败:', error);
            AuthManager.showResultToast('地图初始化失败，请刷新页面重试');
            
            // 尝试重新加载地图
            setTimeout(() => {
                this.retryInitMap();
            }, 3000);
        }
    },

    // 等待高德地图API加载
    waitForAMap() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 10;
            let attempts = 0;
            
            const checkAMap = () => {
                attempts++;
                
                if (typeof AMap !== 'undefined') {
                    resolve(true);
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    reject(new Error('高德地图API加载超时'));
                    return;
                }
                
                console.log(`等待高德地图API加载... (${attempts}/${maxAttempts})`);
                setTimeout(checkAMap, 500);
            };
            
            checkAMap();
        });
    },

    // 重试初始化地图
    retryInitMap() {
        console.log('🔄 重试初始化地图...');
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer) {
            mapContainer.innerHTML = '';
        }
        this.reset();
        this.initMap();
    },

    // 初始化定位功能
    async initGeolocation() {
        return new Promise((resolve, reject) => {
            if (typeof AMap === 'undefined') {
                reject(new Error('高德地图API未加载'));
                return;
            }
            
            AMap.plugin('AMap.Geolocation', () => {
                try {
                    this.geolocation = new AMap.Geolocation({
                        enableHighAccuracy: true,
                        timeout: 30000,
                        maximumAge: 0,
                        buttonPosition: 'RB',
                        buttonOffset: new AMap.Pixel(10, 20),
                        showMarker: true,
                        showCircle: false,
                        panToLocation: true,
                        zoomToAccuracy: false,
                        convert: true,
                        noIpLocate: 1,
                        GeoLocationFirst: false,
                        extensions: 'all'
                    });

                    this.map.addControl(this.geolocation);
                    
                    this.geolocation.on('complete', (result) => {
                        console.log('📍 定位完成:', {
                            位置: `${result.position.lng}, ${result.position.lat}`,
                            精度: result.accuracy,
                            定位类型: result.location_type || '未知',
                            来源: result.info || '未知'
                        });
                        
                        const isGPS = result.accuracy < 50;
                        console.log(isGPS ? '✅ GPS高精度定位' : '⚠️ 非GPS定位');
                        
                        this.handleLocationSuccess(result);
                        resolve(true);
                    });

                    this.geolocation.on('error', (error) => {
                        console.error('❌ 定位失败详情:', error);
                        this.handleLocationError(error);
                        reject(error);
                    });

                    // 立即尝试获取定位
                    this.getLocation();
                    
                } catch (error) {
                    console.error('定位插件初始化失败:', error);
                    reject(error);
                }
            });
        });
    },

    // 获取定位
    getLocation() {
        if (!this.geolocation) {
            console.error('定位功能未初始化');
            AuthManager.showResultToast('定位功能未就绪');
            return;
        }

        console.log('📍 开始获取高精度GPS定位...');
        AuthManager.showResultToast('正在获取GPS定位，请稍候...（可能需要10-30秒）');
        
        this.geolocation.getCurrentPosition((status, result) => {
            if (status === 'complete') {
                this.handleLocationSuccess(result);
            } else {
                this.handleLocationError(result);
            }
        });
    },

    // 处理定位成功
    async handleLocationSuccess(result) {
        try {
            console.log('定位成功数据:', result);
            
            const position = {
                lng: result.position.lng,
                lat: result.position.lat,
                accuracy: result.accuracy || 50
            };
            
            this.currentPosition = position;
            
            // 更新或创建用户标记
            this.updateUserMarker(position);
            
            // 显示定位精度
            const accuracyText = result.accuracy ? `(精度: ${Math.round(result.accuracy)}米)` : '';
            AuthManager.showResultToast(`定位成功 ${accuracyText}`);
            
            // 激活定位按钮
            document.getElementById('floatingLocateBtn').classList.add('active');
            
            console.log('✅ 定位处理完成:', position);
            
            // 调用逆地理编码获取地址
            await this.getAddressFromCoordinates(position.lng, position.lat);
            
        } catch (error) {
            console.error('处理定位数据失败:', error);
            AuthManager.showResultToast('定位数据处理失败');
        }
    },

    // 处理定位失败
    handleLocationError(error) {
        console.error('定位失败详情:', error);
        
        let errorMessage = '定位失败';
        if (error.info === 'PERMISSION_DENIED') {
            errorMessage = '定位权限被拒绝，请检查浏览器设置';
        } else if (error.info === 'TIMEOUT') {
            errorMessage = '定位超时，请检查网络连接';
        } else if (error.info === 'POSITION_UNAVAILABLE') {
            errorMessage = '位置信息不可用';
        }
        
        AuthManager.showResultToast(errorMessage);
        
        // 定位失败时，使用浏览器定位作为备选
        setTimeout(() => {
            this.useBrowserGeolocation();
        }, 1000);
    },

    // 使用浏览器原生定位（备选方案）
    useBrowserGeolocation() {
        if (!navigator.geolocation) {
            AuthManager.showResultToast('浏览器不支持定位功能');
            return;
        }

        AuthManager.showResultToast('正在尝试浏览器定位...');
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                
                console.log('浏览器定位成功:', { lat, lng, accuracy });
                
                // 将WGS84坐标转换为高德地图坐标
                const converted = this.wgs84ToGcj02(lng, lat);
                
                const browserPosition = {
                    lng: converted[0],
                    lat: converted[1],
                    accuracy: accuracy
                };
                
                this.currentPosition = browserPosition;
                this.updateUserMarker(browserPosition);
                
                AuthManager.showResultToast(`浏览器定位成功 (精度: ${Math.round(accuracy)}米)`);
                document.getElementById('floatingLocateBtn').classList.add('active');
                
                // 调用逆地理编码获取地址
                await this.getAddressFromCoordinates(browserPosition.lng, browserPosition.lat);
            },
            (error) => {
                console.error('浏览器定位失败:', error);
                AuthManager.showResultToast('所有定位方式都失败了，请手动选择位置');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    },

    // 通过后端API获取地址
    async getAddressFromCoordinates(lng, lat) {
        try {
            console.log('正在获取地址信息...', { lng, lat });
            
            const response = await AuthManager.apiCall(`/amap/regeocode?longitude=${lng}&latitude=${lat}`);
            
            console.log('地址接口响应:', response);
            
            if (response.success && response.data && response.data.regeocode) {
                const addressInfo = response.data.regeocode;
                
                let formattedAddress = addressInfo.formatted_address || '未知地址';
                
                if (formattedAddress === '未知地址' && addressInfo.addressComponent) {
                    const comp = addressInfo.addressComponent;
                    formattedAddress = `${comp.province || ''}${comp.city || ''}${comp.district || ''}${comp.township || ''}${comp.street || ''}`;
                }
                
                console.log('✅ 地址获取成功:', formattedAddress);
                
                this.updateAddressDisplay(formattedAddress, response.data);
                
                return formattedAddress;
            } else {
                console.warn('地址解析失败:', response.message || '未知错误');
                this.updateAddressDisplay('无法获取详细地址', null);
                return '无法获取详细地址';
            }
        } catch (error) {
            console.error('请求地址接口失败:', error);
            
            const errorMsg = `地址服务异常: ${error.message}`;
            this.updateAddressDisplay(errorMsg, null);
            return errorMsg;
        }
    },

    // 更新地址显示
    updateAddressDisplay(address, addressData) {
        console.log('📫 当前地址:', address);
        
        const addressElement = document.getElementById('currentAddress');
        if (addressElement) {
            addressElement.textContent = `当前位置: ${address}`;
        }
        
        this.currentAddress = {
            address: address,
            data: addressData
        };
    },

    // 坐标转换（WGS84转GCJ02）
    wgs84ToGcj02(lng, lat) {
        const PI = 3.1415926535897932384626;
        const a = 6378245.0;
        const ee = 0.00669342162296594323;
        
        let dlat = this.transformLat(lng - 105.0, lat - 35.0);
        let dlng = this.transformLng(lng - 105.0, lat - 35.0);
        const radlat = lat / 180.0 * PI;
        let magic = Math.sin(radlat);
        magic = 1 - ee * magic * magic;
        const sqrtmagic = Math.sqrt(magic);
        dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
        dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
        const mglat = lat + dlat;
        const mglng = lng + dlng;
        
        return [mglng, mglat];
    },

    transformLat(lng, lat) {
        let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    },

    transformLng(lng, lat) {
        let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
        return ret;
    },

    // 更新用户标记
    updateUserMarker(position) {
        try {
            const markerPosition = [position.lng, position.lat];
            
            // 移除旧标记
            if (this.userMarker) {
                this.userMarker.setMap(null);
                this.userMarker = null;
            }
            
            // 创建新标记
            this.userMarker = new AMap.Marker({
                position: markerPosition,
                icon: new AMap.Icon({
                    size: new AMap.Size(24, 24),
                    image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
                    imageSize: new AMap.Size(24, 24),
                }),
                anchor: 'center',
                zIndex: 100,
                extData: { isUser: true },
            });
            
            this.userMarker.setMap(this.map);
            
            // 移动地图中心到定位点
            this.map.setCenter(markerPosition);
            this.map.setZoom(16);
            
            console.log('✅ 用户标记更新:', markerPosition);
            
        } catch (error) {
            console.error('更新用户标记失败:', error);
        }
    },

    // 绑定定位按钮事件
    bindLocationButton() {
        const locateBtn = document.getElementById('floatingLocateBtn');
        if (locateBtn) {
            locateBtn.addEventListener('click', () => {
                this.getLocation();
            });
        }
    },

    // 初始化工具栏
    initToolBar() {
        AMap.plugin('AMap.ToolBar', () => {
            this.map.addControl(
                new AMap.ToolBar({
                    position: 'RB',
                    offset: new AMap.Pixel(15, 90),
                })
            );
        });
    },

    async loadHydrantMarkers(filters = {}) {
        try {
            // 清除现有标记
            this.clearHydrantMarkers();

            // 显示加载中
            if (typeof AuthManager.showLoading === 'function') {
                AuthManager.showLoading('正在加载消防栓...');
            }

            // 从服务器加载数据
            const hydrants = await DataManager.loadHydrantsFromServer(filters);
            
            console.log('加载到的消防栓数据:', hydrants);
            
            // 隐藏加载中
            if (typeof AuthManager.hideLoading === 'function') {
                AuthManager.hideLoading();
            }
            
            // 创建标记
            hydrants.forEach(hydrant => {
                this.createHydrantMarker(hydrant);
            });

            // 如果筛选了半径且有当前位置，定位到当前位置
            if (filters.radius && this.currentPosition) {
                this.map.setCenter([this.currentPosition.lng, this.currentPosition.lat]);
                
                // 根据半径调整缩放级别
                let zoomLevel;
                if (filters.radius === 0) {
                    zoomLevel = 13; // 全部范围
                } else if (filters.radius <= 1000) {
                    zoomLevel = 16; // 1公里
                } else if (filters.radius <= 5000) {
                    zoomLevel = 15; // 5公里
                } else {
                    zoomLevel = 14; // 10公里
                }
                this.map.setZoom(zoomLevel);
            }

            // 使用 AuthManager 的 showResultToast
            if (typeof AuthManager.showResultToast === 'function') {
                AuthManager.showResultToast(`已加载 ${hydrants.length} 个消防栓`);
            }
        } catch (error) {
            if (typeof AuthManager.hideLoading === 'function') {
                AuthManager.hideLoading();
            }
            console.error('加载消防栓标记失败:', error);
            if (typeof AuthManager.showResultToast === 'function') {
                AuthManager.showResultToast('加载失败: ' + error.message);
            }
        }
    },

    clearHydrantMarkers() {
        this.hydrantMarkers.forEach(marker => {
            marker.setMap(null);
        });
        this.hydrantMarkers = [];
    },


    // 创建消防栓标记
    createHydrantMarker(hydrant) {
        console.log('创建消防栓标记:', hydrant);
        
        // 确保坐标存在
        if (!hydrant.longitude || !hydrant.latitude) {
            console.error('消防栓坐标缺失:', hydrant);
            return;
        }
        
        const iconContent = this.createHydrantIcon(hydrant.status, hydrant.type);
        const marker = new AMap.Marker({
            position: [hydrant.longitude, hydrant.latitude],
            title: hydrant.name || hydrant.hydrant_id,
            content: iconContent,
            offset: new AMap.Pixel(-15, -40),
            anchor: 'bottom-center',
            extData: hydrant,
        });

        marker.on('click', () => {
            this.showHydrantDetail(hydrant);
            this.map.setCenter([hydrant.longitude, hydrant.latitude]);
        });

        marker.setMap(this.map);
        this.hydrantMarkers.push(marker);
        
        console.log('标记创建成功');
    },

    createHydrantIcon(status, type) {
        const container = document.createElement('div');
        container.className = 'hydrant-marker';

        const icon = document.createElement('div');
        icon.className = 'hydrant-icon';

        if (status === '正常') {
            icon.className += ' hydrant-normal';
            icon.innerHTML = '✓';
        } else if (status === '损坏') {
            icon.className += ' hydrant-damage';
            icon.innerHTML = '!';
        } else if (status === '废弃') {
            icon.className += ' hydrant-abandon';
            icon.innerHTML = '×';
        }

        const stem = document.createElement('div');
        stem.className = 'hydrant-stem';

        if (status === '正常') {
            stem.style.background = '#52c41a';
        } else if (status === '损坏') {
            stem.style.background = '#faad14';
        } else if (status === '废弃') {
            stem.style.background = '#ff4d4f';
        }

        container.appendChild(icon);
        container.appendChild(stem);

        return container;
    },

    showHydrantDetail(hydrant) {
        this.selectedHydrant = hydrant;
        
        // 确保 hydrant 有 position 属性
        if (!hydrant.position && hydrant.longitude && hydrant.latitude) {
            hydrant.position = [hydrant.longitude, hydrant.latitude];
        }
        
        // 更新详情面板内容
        document.getElementById('detailName').textContent = hydrant.name || hydrant.hydrant_id;
        document.getElementById('detailId').textContent = hydrant.hydrant_id;
        document.getElementById('detailAddress').textContent = hydrant.address;
        document.getElementById('detailType').textContent = hydrant.type;
        document.getElementById('detailStatusText').textContent = hydrant.status;
        document.getElementById('detailStatus').textContent = hydrant.status;

        // 设置状态样式
        let statusClass = '';
        if (hydrant.status === '正常') statusClass = 'status status-normal';
        if (hydrant.status === '损坏') statusClass = 'status status-damage';
        if (hydrant.status === '废弃') statusClass = 'status status-abandon';
        document.getElementById('detailStatus').className = statusClass;

        document.getElementById('detailPressure').textContent = hydrant.pressure ? `${hydrant.pressure}MPa` : '-';
        document.getElementById('detailCheck').textContent = 
            `${hydrant.last_check || hydrant.lastCheck || '未知'}（${hydrant.update_user_name || hydrant.update_user || '未知'}）`;

        // 根据用户角色显示采集按钮
        if (AuthManager.currentUser && AuthManager.currentUser.role === 'collector') {
            document.getElementById('collectBtn').style.display = 'block';
        } else {
            document.getElementById('collectBtn').style.display = 'none';
        }

        // 显示详情面板
        document.getElementById('detailPanel').style.display = 'block';
        document.getElementById('detailPanel').classList.add('show');
        
        // 如果有地图，定位到该消防栓
        if (this.map && hydrant.longitude && hydrant.latitude) {
            this.map.setCenter([hydrant.longitude, hydrant.latitude]);
            this.map.setZoom(17);
        }
    },

    reset() {
        if (this.map) {
            this.map.destroy();
            this.map = null;
        }
        this.userMarker = null;
        this.currentPosition = null;
        this.selectedHydrant = null;
        this.hydrantMarkers = [];
        this.geolocation = null;
        this.isMapLoaded = false;
    }
};