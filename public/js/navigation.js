// navigation.js - 修复版
const NavigationManager = {
    navMap: null,
    driving: null,
    currentRoute: null,
    navigationLogged: false,

    // 开始导航
    startNavigation() {
        console.log('开始导航，当前选择的消防栓:', MapManager.selectedHydrant);
        console.log('当前位置:', MapManager.currentPosition);
        
        if (!MapManager.selectedHydrant) {
            this.showResultToast('请先在地图上选择一个消防栓');
            return;
        }

        if (!MapManager.currentPosition) {
            this.showResultToast('正在获取您的位置，请稍候...');
            MapManager.getLocation();
            
            setTimeout(() => {
                if (MapManager.currentPosition) {
                    this.executeDrivingNavigation();
                } else {
                    this.showNavError('无法获取您的位置，请检查定位权限或手动选择位置');
                }
            }, 3000);
            return;
        }

        this.executeDrivingNavigation();
    },

    // 执行驾车导航规划
    executeDrivingNavigation: async function() {
        console.log('开始执行驾车导航规划');
        
        try {
            // 显示导航面板
            this.showNavigationPanel();

            // 记录导航操作 - 只记录一次
            // 检查是否已经记录过这次导航，避免重复记录
            if (MapManager.selectedHydrant && AuthManager.currentUser && !this.navigationLogged) {
            const hydrantId = MapManager.selectedHydrant.hydrant_id || MapManager.selectedHydrant.id;
            const hydrantName = MapManager.selectedHydrant.name || '未知消防栓';
            this.logNavigation(hydrantId, hydrantName);
            this.navigationLogged = true; // 标记已记录
            }

            // 初始化导航地图
            this.initNavMap();

            // 清除之前的路线
            if (this.driving) {
            this.driving.clear();
            this.driving = null;
            }

            // 获取当前选择的策略
            const policyBtn = document.querySelector('.policy-btn.active');
            const policy = policyBtn ? parseInt(policyBtn.dataset.policy) : 0;
            
            // 显示策略名称
            const policyNames = {
            0: '最快捷',
            2: '最短距离',
            1: '避开高速'
            };
            console.log('导航策略:', policyNames[policy] || '最快捷');

            // 获取起点和终点坐标
            const startLngLat = new AMap.LngLat(
            MapManager.currentPosition.lng,
            MapManager.currentPosition.lat
            );
            
            let hydrantLng, hydrantLat;
            if (MapManager.selectedHydrant.longitude && MapManager.selectedHydrant.latitude) {
            hydrantLng = MapManager.selectedHydrant.longitude;
            hydrantLat = MapManager.selectedHydrant.latitude;
            } else if (MapManager.selectedHydrant.position) {
            hydrantLng = MapManager.selectedHydrant.position[0];
            hydrantLat = MapManager.selectedHydrant.position[1];
            } else {
            throw new Error('消防栓坐标信息不完整');
            }
            
            const endLngLat = new AMap.LngLat(hydrantLng, hydrantLat);
            
            console.log('起点坐标:', startLngLat);
            console.log('终点坐标:', endLngLat);

            // 检查高德地图API是否可用
            if (typeof AMap === 'undefined') {
            throw new Error('高德地图API未加载');
            }

            // 初始化驾车导航插件
            AMap.plugin('AMap.Driving', () => {
            console.log('AMap.Driving插件加载完成');
            
            try {
                this.driving = new AMap.Driving({
                map: this.navMap,
                panel: 'navSteps',
                policy: policy,
                hideMarkers: false,
                showTraffic: true,
                isOutline: true,
                outlineColor: '#ffeeee',
                autoFitView: true,
                });

                // 执行路线搜索
                this.driving.search(startLngLat, endLngLat, (status, result) => {
                console.log('路线规划结果状态:', status);
                
                // 安全地更新UI元素
                this.safeUpdateElement('navLoading', 'none');
                this.safeUpdateElement('navError', 'none');

                if (status === 'complete') {
                    if (result.routes && result.routes.length > 0) {
                    const route = result.routes[0];
                    this.currentRoute = route;
                    this.showDrivingRouteInfo(route);
                    
                    this.safeUpdateElement('navStatus', 'flex');
                    this.safeUpdateElement('navRouteInfo', 'block');
                    
                    const distanceKm = (route.distance / 1000).toFixed(1);
                    const policyText = policyNames[policy] || '最快捷';
                    this.safeUpdateText('navTitle', `${policyText} - ${distanceKm}公里`);
                    
                    this.showResultToast('驾车路线规划完成');
                    
                    this.updateRouteSteps(result);
                    } else {
                    this.showNavError('未找到可行驾车路线');
                    }
                } else {
                    let errorMsg = '驾车路线规划失败';
                    let errorInfo = result?.info || '';
                    
                    if (status === 'no_data') {
                    errorMsg = '该区域暂无驾车路线数据';
                    } else if (status === 'error') {
                    if (errorInfo.includes('INVALID_USER_SCODE')) {
                        errorMsg = '地图服务配置错误，请联系管理员';
                    } else if (errorInfo.includes('INVALID_USER_KEY')) {
                        errorMsg = '地图服务密钥无效';
                    } else if (errorInfo.includes('OVER_QUOTA')) {
                        errorMsg = '地图服务请求超限';
                    }
                    }
                    
                    console.error('路线规划错误:', status, errorInfo);
                    this.showNavError(`${errorMsg} (${errorInfo})`);
                }
                });
            } catch (initError) {
                console.error('导航插件初始化错误:', initError);
                this.showNavError(`导航初始化失败: ${initError.message}`);
            }
            }, (error) => {
            console.error('AMap.Driving插件加载失败:', error);
            this.showNavError('导航功能加载失败，请刷新页面重试');
            });

        } catch (error) {
            console.error('导航执行错误:', error);
            this.showNavError(`导航失败: ${error.message}`);
        }
    },


    // 安全地更新元素显示
    safeUpdateElement(elementId, displayValue) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = displayValue;
        }
    },

    // 安全地更新文本
    safeUpdateText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    },

    // 显示导航面板
    showNavigationPanel() {
        console.log('显示导航面板...');
        
        const navPanel = document.getElementById('navPanel');
        if (!navPanel) {
            console.error('导航面板元素未找到！');
            this.showNavError('导航界面加载失败');
            return;
        }
        
        // 显示导航面板
        navPanel.style.display = 'flex';
        
        // 安全地设置各个部分的显示状态
        this.safeUpdateElement('navLoading', 'flex');
        this.safeUpdateElement('navError', 'none');
        this.safeUpdateElement('navStatus', 'none');
        this.safeUpdateElement('navRouteInfo', 'none');
        
        // 设置导航标题
        if (MapManager.selectedHydrant) {
            const hydrantName = MapManager.selectedHydrant.name || MapManager.selectedHydrant.hydrant_id;
            this.safeUpdateText('navTitle', `导航到 ${hydrantName}`);
        }
        
        console.log('导航面板显示完成');
    },

    // 显示驾车路线信息
    showDrivingRouteInfo(route) {
        const distance = (route.distance / 1000).toFixed(2);
        const time = Math.ceil(route.time / 60);
        const policyBtn = document.querySelector('.policy-btn.active');
        const policyText = policyBtn ? policyBtn.textContent : '最快捷';

        // 更新顶部信息
        this.safeUpdateText('navDistance', `${distance}公里`);
        this.safeUpdateText('navTime', `约${time}分钟`);
        
        // 更新路线信息面板
        this.safeUpdateText('routeDistance', `${distance}公里`);
        this.safeUpdateText('routeTime', `约${time}分钟`);
        this.safeUpdateText('routePolicy', policyText);
    },

    // 在地图上标记路线关键点
    markRoutePoints(route) {
        if (!this.navMap) return;
        
        // 清除现有标记
        this.clearRouteMarkers();
        
        // 标记起点（用户位置）
        if (MapManager.currentPosition) {
            const startMarker = new AMap.Marker({
                position: [MapManager.currentPosition.lng, MapManager.currentPosition.lat],
                title: '起点（您的位置）',
                icon: new AMap.Icon({
                    size: new AMap.Size(30, 30),
                    image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
                    imageSize: new AMap.Size(30, 30),
                }),
                zIndex: 100,
            });
            startMarker.setMap(this.navMap);
            this.routeMarkers = this.routeMarkers || [];
            this.routeMarkers.push(startMarker);
        }
        
        // 标记终点（消防栓位置）
        if (MapManager.selectedHydrant) {
            const endLng = MapManager.selectedHydrant.longitude || MapManager.selectedHydrant.position[0];
            const endLat = MapManager.selectedHydrant.latitude || MapManager.selectedHydrant.position[1];
            
            const endMarker = new AMap.Marker({
                position: [endLng, endLat],
                title: '终点（消防栓）',
                icon: new AMap.Icon({
                    size: new AMap.Size(30, 30),
                    image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
                    imageSize: new AMap.Size(30, 30),
                }),
                zIndex: 100,
            });
            endMarker.setMap(this.navMap);
            this.routeMarkers = this.routeMarkers || [];
            this.routeMarkers.push(endMarker);
        }
    },

    // 清除路线标记
    clearRouteMarkers() {
        if (this.routeMarkers && this.routeMarkers.length > 0) {
            this.routeMarkers.forEach(marker => {
                if (marker && marker.setMap) {
                    marker.setMap(null);
                }
            });
            this.routeMarkers = [];
        }
    },

    // 更新路线步骤
    updateRouteSteps(result) {
        const navStepsContainer = document.getElementById('navSteps');
        if (!navStepsContainer) return;
        
        if (result.routes && result.routes[0].steps) {
            // 隐藏加载和错误状态
            this.safeUpdateElement('navLoading', 'none');
            this.safeUpdateElement('navError', 'none');
            
            // 显示步骤列表
            const steps = result.routes[0].steps;
            let stepsHTML = '';
            
            steps.forEach((step, index) => {
                const instruction = step.instruction.replace(/<[^>]*>/g, ''); // 移除HTML标签
                const distance = (step.distance / 1000).toFixed(2);
                
                stepsHTML += `
                    <div class="step-item">
                        <div class="step-dot">${index + 1}</div>
                        <div class="step-text">
                            <div>${instruction}</div>
                            <div style="color: #666; font-size: 12px; margin-top: 4px;">
                                距离：${distance}公里 | 时间：${Math.ceil(step.time / 60)}分钟
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // 创建一个新的步骤容器
            const stepsContainer = document.createElement('div');
            stepsContainer.className = 'route-steps-container';
            stepsContainer.innerHTML = stepsHTML;
            
            // 清除旧内容并添加新内容
            navStepsContainer.innerHTML = '';
            navStepsContainer.appendChild(stepsContainer);
        }
    },

    // 显示导航错误
    showNavError(message) {
        this.safeUpdateElement('navLoading', 'none');
        this.safeUpdateElement('navError', 'flex');
        this.safeUpdateText('navErrorMsg', message);
    },

    // 初始化导航地图
    initNavMap() {
        console.log('初始化导航地图');
        
        // 如果导航地图已存在，先销毁
        if (this.navMap) {
            this.navMap.destroy();
            this.navMap = null;
        }

        // 创建新的导航地图容器
        const navMapContainer = document.getElementById('navMapContainer');
        if (!navMapContainer) {
            console.error('导航地图容器未找到！');
            return;
        }
        
        navMapContainer.innerHTML = ''; // 清空容器

        // 计算合适的地图中心和缩放级别
        let center = [113.3802, 22.5281]; // 默认中山市中心
        let zoom = 13;
        
        if (MapManager.currentPosition && MapManager.selectedHydrant) {
            // 计算中点
            const startLng = MapManager.currentPosition.lng;
            const startLat = MapManager.currentPosition.lat;
            const endLng = MapManager.selectedHydrant.longitude || MapManager.selectedHydrant.position[0];
            const endLat = MapManager.selectedHydrant.latitude || MapManager.selectedHydrant.position[1];
            
            center = [
                (startLng + endLng) / 2,
                (startLat + endLat) / 2
            ];
            
            // 根据距离调整缩放级别
            const distance = this.calculateDistance(startLat, startLng, endLat, endLng);
            if (distance < 1000) zoom = 16;
            else if (distance < 5000) zoom = 14;
            else zoom = 12;
        }

        // 创建新的导航地图
        this.navMap = new AMap.Map('navMapContainer', {
            zoom: zoom,
            center: center,
            resizeEnable: true,
            mapStyle: 'amap://styles/normal',
            viewMode: '2D',
        });

        // 添加缩放控件
        this.navMap.addControl(new AMap.ToolBar({
            position: 'RB',
            offset: new AMap.Pixel(15, 15),
        }));
        
        console.log('导航地图初始化完成');
    },

    // 计算两点间距离（米）
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // 地球半径（米）
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    // 关闭导航面板
    closeNavigation: function() {
        console.log('关闭导航面板');
        
        if (this.driving) {
            this.driving.clear();
            this.driving = null;
        }
        
        this.clearRouteMarkers();
        
        if (this.navMap) {
            this.navMap.destroy();
            this.navMap = null;
        }
        
        this.safeUpdateElement('navPanel', 'none');
        this.currentRoute = null;
        this.navigationLogged = false; // 重置标记
    },

    // 切换导航策略
    switchNavigationPolicy(policy) {
        console.log('切换导航策略:', policy);
        
        if (this.driving && MapManager.selectedHydrant && MapManager.currentPosition) {
            // 先清除当前路线
            this.driving.clear();
            this.clearRouteMarkers();
            
            // 重新规划路线
            this.executeDrivingNavigation();
        }
    },

    // 显示提示信息
    showResultToast(message) {
        const toast = document.getElementById('resultToast');
        if (toast) {
            toast.textContent = message;
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 2000);
        }
    },


    logNavigation: async function(hydrantId, hydrantName) {
        try {
            if (!AuthManager.currentUser || !AuthManager.currentToken) {
            console.log('用户未登录，跳过导航记录');
            return;
            }
            
            // 计算距离
            let distance = 0;
            if (MapManager.currentPosition && MapManager.selectedHydrant) {
            distance = this.calculateDistance(
                MapManager.currentPosition.lat,
                MapManager.currentPosition.lng,
                MapManager.selectedHydrant.latitude,
                MapManager.selectedHydrant.longitude
            );
            }
            
            const response = await fetch(`${AuthManager.API_BASE}/log/navigation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthManager.currentToken}`
            },
            body: JSON.stringify({
                hydrantId: hydrantId,
                hydrantName: hydrantName,
                distance: Math.round(distance)
            })
            });
            
            if (response.ok) {
            console.log('导航记录已保存');
            } else {
            console.warn('导航记录保存失败，状态码:', response.status);
            }
        } catch (error) {
            console.error('记录导航失败:', error);
        }
    },




};