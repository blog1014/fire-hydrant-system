// 应用主模块
const AppManager = {
    // 初始化应用
    init() {
        console.log('AppManager 初始化开始...');
        
        this.bindEvents();
        AuthManager.initLogin();
        this.initCollectFunction();
        this.checkElements();
        
        // 检查操作记录相关元素
        this.checkHistoryElements();
        
        // 初始化筛选面板 - 确保先初始化CSS状态
        this.initFilterPanel();
        
        console.log('AppManager 初始化完成');
    },

    // 新增：初始化筛选面板
    initFilterPanel() {
        const filterPanel = document.getElementById('filterPanel');
        if (filterPanel) {
            // 确保有filter-panel类
            if (!filterPanel.classList.contains('filter-panel')) {
                filterPanel.classList.add('filter-panel');
            }
            
            // 确保初始状态是隐藏的 
            filterPanel.style.position = 'fixed';
            filterPanel.style.left = '0';
            filterPanel.style.right = '0';
            filterPanel.style.bottom = '0';
            filterPanel.style.transform = 'translateY(100%)';
            filterPanel.style.zIndex = '10000';
            filterPanel.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            filterPanel.style.display = 'flex';
            filterPanel.style.flexDirection = 'column';
            filterPanel.style.maxHeight = '70vh';
            filterPanel.style.overflowY = 'auto';
            filterPanel.style.background = 'white';
            filterPanel.style.borderRadius = '20px 20px 0 0';
            filterPanel.style.padding = '25px 20px 30px';
            filterPanel.style.boxShadow = '0 -8px 40px rgba(0,0,0,0.2)';
            
            // 移除 show 类
            filterPanel.classList.remove('show');
            
            // 确保有错误提示元素
            this.ensureValidationElements();
            
            // 为复选框添加点击事件，检查是否至少一个被选中
            const statusCheckboxes = [
                'statusNormal', 'statusDamage', 'statusAbandon'
            ];
            
            const typeCheckboxes = [
                'typeGround', 'typeUnderground'
            ];
            
            // 状态复选框事件
            statusCheckboxes.forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    // 移除可能存在的旧事件监听器
                    checkbox.removeEventListener('change', this.handleCheckboxChange);
                    // 添加新的事件监听器
                    checkbox.addEventListener('change', () => {
                        this.checkAtLeastOneSelected(statusCheckboxes, 'statusError');
                    });
                }
            });
            
            // 类型复选框事件
            typeCheckboxes.forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    // 移除可能存在的旧事件监听器
                    checkbox.removeEventListener('change', this.handleCheckboxChange);
                    // 添加新的事件监听器
                    checkbox.addEventListener('change', () => {
                        this.checkAtLeastOneSelected(typeCheckboxes, 'typeError');
                    });
                }
            });
            
            // 初始化时隐藏错误提示
            this.hideAllValidationErrors();
            
            console.log('筛选面板初始化完成 - 包含验证逻辑');
        }
    },

    // 确保验证元素存在
    ensureValidationElements() {
        // 检查状态错误提示元素是否存在，如果不存在则创建
        if (!document.getElementById('statusError')) {
            const statusGroup = document.querySelector('.filter-group:nth-of-type(2)'); // 状态筛选组
            if (statusGroup) {
                const errorElement = document.createElement('div');
                errorElement.id = 'statusError';
                errorElement.className = 'filter-validation-error';
                errorElement.textContent = '请至少选择一个状态';
                errorElement.style.display = 'none';
                statusGroup.appendChild(errorElement);
            }
        }
        
        // 检查类型错误提示元素是否存在，如果不存在则创建
        if (!document.getElementById('typeError')) {
            const typeGroup = document.querySelector('.filter-group:nth-of-type(3)'); // 类型筛选组
            if (typeGroup) {
                const errorElement = document.createElement('div');
                errorElement.id = 'typeError';
                errorElement.className = 'filter-validation-error';
                errorElement.textContent = '请至少选择一个类型';
                errorElement.style.display = 'none';
                typeGroup.appendChild(errorElement);
            }
        }
    },

    // 检查至少一个复选框被选中
    checkAtLeastOneSelected(checkboxIds, errorElementId) {
        console.log(`检查 ${checkboxIds} 是否至少选中一个`);
        
        let atLeastOneSelected = false;
        
        checkboxIds.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox && checkbox.checked) {
                atLeastOneSelected = true;
            }
        });
        
        // 显示或隐藏错误提示
        const errorElement = document.getElementById(errorElementId);
        if (errorElement) {
            if (atLeastOneSelected) {
                errorElement.style.display = 'none';
                errorElement.classList.remove('show');
                console.log(`验证通过: ${errorElementId}`);
            } else {
                errorElement.style.display = 'block';
                errorElement.classList.add('show');
                console.log(`验证失败: ${errorElementId}`);
            }
        } else {
            console.error(`错误提示元素未找到: ${errorElementId}`);
        }
        
        return atLeastOneSelected;
    },


    // 隐藏所有验证错误
    hideAllValidationErrors() {
        const errorElements = document.querySelectorAll('.filter-validation-error');
        errorElements.forEach(element => {
            element.style.display = 'none';
            element.classList.remove('show');
        });
    },








    // 新增：确保面板初始状态
    ensureFilterPanelInitialState() {
        const filterPanel = document.getElementById('filterPanel');
        if (filterPanel) {
            // 确保有filter-panel类
            if (!filterPanel.classList.contains('filter-panel')) {
                filterPanel.classList.add('filter-panel');
            }
            
            // 确保初始状态是隐藏的
            filterPanel.classList.remove('show');
            filterPanel.style.transform = 'translateY(100%)';
            
            console.log('筛选面板初始状态已设置');
        }
    },

    // 绑定所有事件
    bindEvents() {
        // 浮动定位按钮事件
        document.getElementById('floatingLocateBtn').addEventListener('click', () => {
            if (MapManager.map && MapManager.map._geolocation) {
                MapManager.map._geolocation.getCurrentPosition();
            } else {
                this.showResultToast('定位功能未就绪');
            }
        });

        // 详情面板事件
        document.getElementById('closeDetailBtn').addEventListener('click', () => {
            MapManager.closeDetailPanel();
        });

        // 导航事件
        document.getElementById('startNavBtn').addEventListener('click', () => {
            MapManager.closeDetailPanel();
            setTimeout(() => {
                NavigationManager.startNavigation();
            }, 300);
        });

        // 关闭导航事件
        document.getElementById('closeNavBtn').addEventListener('click', () => {
            NavigationManager.closeNavigation();
        });

        // 导航策略切换事件
        document.querySelectorAll('.policy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.policy-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                NavigationManager.switchNavigationPolicy(parseInt(this.dataset.policy));
            });
        });

        // 采集事件
        document.getElementById('collectBtn').addEventListener('click', () => {
            MapManager.closeDetailPanel();
            setTimeout(() => {
                this.showCollectPanel();
            }, 300);
        });

        // 采集关闭事件
        document.getElementById('closeCollectBtn').addEventListener('click', () => {
            this.closeCollectPanel();
        });

        // 采集提交事件
        document.getElementById('submitCollect').addEventListener('click', () => {
            this.submitCollectData();
        });

        // 保存草稿事件
        document.getElementById('saveDraft').addEventListener('click', () => {
            this.showResultToast('草稿已保存');
        });

        // 筛选事件
        document.getElementById('filterBtn').addEventListener('click', () => {
            this.toggleFilterPanel();
        });

        // 半径选项事件
        document.querySelectorAll('.radius-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.radius-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
            });
        });

        // 确认筛选事件
        document.getElementById('confirmFilter').addEventListener('click', () => {
            this.filterHydrants();
        });

        // 搜索事件
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.searchHydrants();
        });

        // 离线地图事件
        document.getElementById('offlineBtn').addEventListener('click', () => {
            document.getElementById('offlinePanel').style.display = 'block';
        });

        // 关闭离线地图事件
        document.getElementById('closeOfflineBtn').addEventListener('click', () => {
            document.getElementById('offlinePanel').style.display = 'none';
        });

        // 下载离线地图事件
        document.getElementById('downloadOfflineBtn').addEventListener('click', () => {
            this.downloadOfflineMap();
        });

        // 我的按钮事件
        document.getElementById('mineBtn').addEventListener('click', () => {
            AuthManager.showUserPanel();
        });

        // 关闭用户详情界面事件
        document.getElementById('closeUserBtn').addEventListener('click', () => {
            document.getElementById('userPanel').style.display = 'none';
        });

        // 退出登录事件
        document.getElementById('logoutBtn').addEventListener('click', () => {
            AuthManager.logout();
        });

        // 重试导航按钮事件
        document.getElementById('retryNavBtn').addEventListener('click', () => {
            NavigationManager.executeDrivingNavigation();
        });

        // 地图按钮事件
        document.getElementById('mapBtn').addEventListener('click', () => {
            if (MapManager.map) {
                MapManager.map.setZoom(13);
            }
        });

        // 支持搜索框回车搜索
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchHydrants();
            }
        });


        document.getElementById('resetFilter').addEventListener('click', () => {
            this.resetFilter();
        });


        document.getElementById('helpMenuItem').addEventListener('click', () => {
            // 保存当前状态
            const currentState = {
                user: AuthManager.currentUser,
                mapState: MapManager.isMapLoaded
            };
            
            // 保存到 sessionStorage
            sessionStorage.setItem('appState', JSON.stringify(currentState));
            
            // 跳转到帮助页面
            window.location.href = 'help.html';
        });

        // 筛选事件 - 确保只绑定一次
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) {
            // 先移除旧的事件监听器
            filterBtn.removeEventListener('click', this.toggleFilterPanel);
            // 绑定新的事件监听器，使用箭头函数保持 this 上下文
            filterBtn.addEventListener('click', () => {
                console.log('筛选按钮点击事件触发');
                this.toggleFilterPanel();
            });
        }

        // 确认筛选事件
        const confirmFilter = document.getElementById('confirmFilter');
        if (confirmFilter) {
            confirmFilter.addEventListener('click', () => {
                console.log('确认筛选按钮被点击');
                this.filterHydrants();
            });
        }

         // 重置筛选事件
        const resetFilter = document.getElementById('resetFilter');
        if (resetFilter) {
            resetFilter.addEventListener('click', () => {
                console.log('重置筛选按钮被点击');
                this.resetFilter();
            });
        }

        // 搜索事件
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                console.log('搜索按钮被点击');
                this.searchHydrants();
            });
        }

        // 搜索框回车事件
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('搜索框回车键被按下');
                    this.searchHydrants();
                }
            });
        }

        // 半径选项事件
        document.querySelectorAll('.radius-option').forEach(option => {
            option.addEventListener('click', function() {
                console.log('半径选项被点击:', this.dataset.radius);
                document.querySelectorAll('.radius-option').forEach(o => o.classList.remove('active'));
                this.classList.add('active');
            });
        });


        // 导航事件
        document.getElementById('startNavBtn').addEventListener('click', () => {
            if (!MapManager.selectedHydrant) {
                this.showResultToast('请先在地图上选择一个消防栓');
                return;
            }
            
            MapManager.closeDetailPanel();
            setTimeout(() => {
                NavigationManager.startNavigation();
            }, 300);
        });


        // 关闭导航事件
        document.getElementById('closeNavBtn').addEventListener('click', () => {
            NavigationManager.closeNavigation();
        });

        // 导航策略切换事件
        document.querySelectorAll('.policy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.policy-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                NavigationManager.switchNavigationPolicy(parseInt(this.dataset.policy));
            });
        });

        // 重试导航按钮事件
        document.getElementById('retryNavBtn')?.addEventListener('click', () => {
            NavigationManager.executeDrivingNavigation();
        });

        // 在文档加载完成后添加高德地图JS SDK
        document.addEventListener('DOMContentLoaded', () => {
            // 确保已经加载了高德地图SDK
            if (typeof AMap === 'undefined') {
                console.error('高德地图SDK未加载！');
                // 可以在这里动态加载SDK
                const script = document.createElement('script');
                script.src = `https://webapi.amap.com/maps?v=2.0&key=ac2c26790d5eae08d22bb5ffa6b604f7&plugin=AMap.Geolocation,AMap.ToolBar,AMap.Driving`;
                document.head.appendChild(script);
            }
            
            AppManager.init();
        });

        // 个人信息菜单项事件 
        document.getElementById('profileMenuItem').addEventListener('click', async () => {
        this.showUserProfile();
        });

        // 关闭个人信息面板事件
        document.getElementById('closeProfileBtn')?.addEventListener('click', () => {
        this.closeProfilePanel();
        });

        // 编辑个人信息事件
        document.getElementById('editProfileBtn')?.addEventListener('click', () => {
        this.showResultToast('更改信息请联系管理员');
        });

        // 操作记录
        document.getElementById('historyMenuItem').addEventListener('click', async () => {
        this.showOperationHistory();
        });

        // 添加新的事件绑定
        document.getElementById('closeHistoryBtn')?.addEventListener('click', () => {
        this.closeHistoryPanel();
        });

        document.getElementById('refreshHistoryBtn')?.addEventListener('click', () => {
        this.loadOperationHistory();
        });


    },

    // 添加调试方法，检查DOM元素
    checkElements() {
        console.log('检查DOM元素:');
        console.log('filterBtn:', document.getElementById('filterBtn'));
        console.log('confirmFilter:', document.getElementById('confirmFilter'));
        console.log('resetFilter:', document.getElementById('resetFilter'));
        console.log('searchBtn:', document.getElementById('searchBtn'));
        console.log('searchInput:', document.getElementById('searchInput'));
        console.log('radius-options:', document.querySelectorAll('.radius-option').length);
    },


    // 初始化采集功能
    initCollectFunction() {
        // 照片采集事件
        document.getElementById('photoFront').addEventListener('click', () => {
            this.takePhoto('front');
        });
        document.getElementById('photoSide').addEventListener('click', () => {
            this.takePhoto('side');
        });
        document.getElementById('photoPlate').addEventListener('click', () => {
            this.takePhoto('plate');
        });

        // 采集标签页切换
        document.querySelectorAll('.collect-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.collect-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.collect-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}Content`).classList.add('active');
            });
        });
    },

    // 显示采集面板
    showCollectPanel() {
        document.getElementById('collectPanel').style.display = 'block';
        document.getElementById('collectPanel').classList.add('show');
    },

    // 关闭采集面板
    closeCollectPanel() {
        document.getElementById('collectPanel').classList.remove('show');
        setTimeout(() => {
            document.getElementById('collectPanel').style.display = 'none';
        }, 300);
    },

    // 拍照功能
    takePhoto(type) {
        // 模拟拍照，使用随机图片
        const photoUrl = 'https://picsum.photos/200/200?random=' + Math.random();

        document.getElementById(`photo${type.charAt(0).toUpperCase() + type.slice(1)}`).innerHTML = 
            `<img src="${photoUrl}" alt="${type}照片">`;
        this.collectPhotos = this.collectPhotos || {};
        this.collectPhotos[type] = photoUrl;

        // 模拟清晰度检测
        this.checkPhotoClarity(photoUrl, type);
    },

    // 检查照片清晰度
    checkPhotoClarity(photoUrl, type) {
        // 模拟清晰度检测
        setTimeout(() => {
            const score = Math.floor(Math.random() * 100);
            if (score < 60) {
                this.showResultToast(
                    `${type === 'front' ? '正面' : type === 'side' ? '侧面' : '铭牌'}照片模糊，请重新拍摄`
                );
                this.collectPhotos[type] = null;
                document.getElementById(`photo${type.charAt(0).toUpperCase() + type.slice(1)}`).innerHTML = 
                    `<i class="fa fa-camera"></i><span>${
                        type === 'front' ? '正面' : type === 'side' ? '侧面' : '铭牌'
                    }</span>`;
            } else {
                this.showResultToast('照片清晰度合格，已自动打码隐私信息');
            }
        }, 1000);
    },

    // 提交采集数据
    submitCollectData() {
        const type = document.getElementById('collectType').value;
        const status = document.getElementById('collectStatus').value;
        const waterSource = document.getElementById('collectWaterSource').value;
        const pressure = document.getElementById('collectPressure').value;
        const reference = document.getElementById('collectReference').value;

        if (!reference) {
            this.showResultToast('请填写周边参照物');
            return;
        }
        if (!this.collectPhotos || !this.collectPhotos.front || !this.collectPhotos.side || !this.collectPhotos.plate) {
            this.showResultToast('请拍摄3张完整照片');
            return;
        }

        // 创建新的消防栓数据
        const newHydrant = DataManager.addHydrant({
            type: type,
            status: status,
            waterSource: waterSource,
            pressure: pressure ? `${pressure}MPa` : '-',
            reference: reference,
            position: MapManager.selectedHydrant ? MapManager.selectedHydrant.position : [113.3802, 22.5281],
            name: `采集消防栓-${new Date().getTime()}`
        });

        this.showResultToast('采集数据提交成功，等待审核');
        this.closeCollectPanel();

        // 更新用户界面显示
        AuthManager.updateUserDisplay();

        // 重置采集表单
        this.resetCollectForm();

        // 刷新消防栓列表
        MapManager.loadHydrantMarkers();
    },

    // 重置采集表单
    resetCollectForm() {
        this.collectPhotos = { front: null, side: null, plate: null };
        document.getElementById('photoFront').innerHTML = '<i class="fa fa-camera"></i><span>正面</span>';
        document.getElementById('photoSide').innerHTML = '<i class="fa fa-camera"></i><span>侧面</span>';
        document.getElementById('photoPlate').innerHTML = '<i class="fa fa-camera"></i><span>铭牌</span>';
        document.getElementById('collectReference').value = '';
        document.getElementById('collectPressure').value = '';
    },

    // 筛选消防栓
    filterHydrants() {
        console.log('filterHydrants 方法被调用');
        
        // 验证筛选条件
        const statusCheckboxes = ['statusNormal', 'statusDamage', 'statusAbandon'];
        const typeCheckboxes = ['typeGround', 'typeUnderground'];
        
        const statusValid = this.checkAtLeastOneSelected(statusCheckboxes, 'statusError');
        const typeValid = this.checkAtLeastOneSelected(typeCheckboxes, 'typeError');
        
        if (!statusValid || !typeValid) {
            this.showResultToast('每种条件必须至少选择一个选项');
            return;
        }
        
        // 获取筛选条件
        const radiusOption = document.querySelector('.radius-option.active');
        if (!radiusOption) {
            this.showResultToast('请选择一个搜索半径');
            return;
        }
        
        const radius = parseInt(radiusOption.dataset.radius);
        
        const statusNormal = document.getElementById('statusNormal').checked;
        const statusDamage = document.getElementById('statusDamage').checked;
        const statusAbandon = document.getElementById('statusAbandon').checked;
        const typeGround = document.getElementById('typeGround').checked;
        const typeUnderground = document.getElementById('typeUnderground').checked;
        
        // 构建筛选参数
        const filters = {};
        
        // 状态筛选 - 构建数组
        const statusFilters = [];
        if (statusNormal) statusFilters.push('正常');
        if (statusDamage) statusFilters.push('损坏');
        if (statusAbandon) statusFilters.push('废弃');
        
        if (statusFilters.length > 0) {
            filters.status = statusFilters;
        }
        
        // 类型筛选 - 构建数组
        const typeFilters = [];
        if (typeGround) typeFilters.push('地上');
        if (typeUnderground) typeFilters.push('地下');
        
        if (typeFilters.length > 0) {
            filters.type = typeFilters;
        }
        
        // 距离筛选（如果有当前位置）
        if (MapManager.currentPosition && radius && radius > 0) {
            filters.radius = radius;
            filters.longitude = MapManager.currentPosition.lng;
            filters.latitude = MapManager.currentPosition.lat;
        }
        
        console.log('最终筛选参数:', filters);
        
        // 关闭筛选面板
        this.closeFilterPanel();
        
        // 显示加载中
        AuthManager.showLoading('正在筛选...');
        
        // 加载筛选后的消防栓
        setTimeout(async () => {
            try {
                console.log('开始加载筛选后的消防栓...');
                
                // 使用 DataManager 加载筛选后的数据
                const filteredHydrants = await DataManager.loadHydrantsFromServer(filters);
                
                console.log('筛选结果数量:', filteredHydrants.length);
                
                // 清除现有标记
                MapManager.clearHydrantMarkers();
                
                if (filteredHydrants.length > 0) {
                    // 创建新标记
                    filteredHydrants.forEach(hydrant => {
                        MapManager.createHydrantMarker(hydrant);
                    });
                    
                    // 定位到合适的位置
                    let centerPosition;
                    
                    if (MapManager.currentPosition && radius && radius > 0) {
                        // 如果有当前位置和半径，以当前位置为中心
                        centerPosition = [MapManager.currentPosition.lng, MapManager.currentPosition.lat];
                    } else if (filteredHydrants.length > 0) {
                        // 否则以第一个消防栓为中心
                        const firstHydrant = filteredHydrants[0];
                        centerPosition = [firstHydrant.longitude, firstHydrant.latitude];
                    } else {
                        // 默认中山市中心
                        centerPosition = [113.389810, 22.531800];
                    }
                    
                    if (MapManager.map && centerPosition) {
                        MapManager.map.setCenter(centerPosition);
                        
                        // 根据半径调整缩放级别
                        let zoomLevel = 13;
                        if (radius === 0) {
                            zoomLevel = 13; // 全部范围
                        } else if (radius <= 1000) {
                            zoomLevel = 16; // 1公里
                        } else if (radius <= 5000) {
                            zoomLevel = 15; // 5公里
                        } else {
                            zoomLevel = 14; // 10公里
                        }
                        MapManager.map.setZoom(zoomLevel);
                    }
                    
                    AuthManager.showResultToast(`找到 ${filteredHydrants.length} 个符合条件的消防栓`);
                } else {
                    AuthManager.showResultToast('未找到符合条件的消防栓');
                    // 如果没有结果，可以加载一些默认的消防栓
                    // 或者保持在当前视图
                }
                
            } catch (error) {
                console.error('筛选失败:', error);
                AuthManager.showResultToast('筛选失败: ' + error.message);
                
                // 出错时加载所有消防栓作为备用
                try {
                    const allHydrants = await DataManager.loadHydrantsFromServer({});
                    MapManager.clearHydrantMarkers();
                    allHydrants.forEach(hydrant => {
                        MapManager.createHydrantMarker(hydrant);
                    });
                } catch (fallbackError) {
                    console.error('备用加载也失败:', fallbackError);
                }
            } finally {
                AuthManager.hideLoading();
            }
        }, 300);
    },

    //筛选验证方法
    validateFilterSelection() {
        console.log('验证筛选条件...');
        
        // 验证状态筛选（至少选择一个）
        const statusNormal = document.getElementById('statusNormal').checked;
        const statusDamage = document.getElementById('statusDamage').checked;
        const statusAbandon = document.getElementById('statusAbandon').checked;
        
        const hasStatusSelected = statusNormal || statusDamage || statusAbandon;
        
        if (!hasStatusSelected) {
            this.showResultToast('请至少选择一个消防栓状态');
            return false;
        }
        
        // 验证类型筛选（至少选择一个）
        const typeGround = document.getElementById('typeGround').checked;
        const typeUnderground = document.getElementById('typeUnderground').checked;
        
        const hasTypeSelected = typeGround || typeUnderground;
        
        if (!hasTypeSelected) {
            this.showResultToast('请至少选择一个消防栓类型');
            return false;
        }
        
        console.log('筛选验证通过');
        return true;
    },

    // 重置筛选方法
    resetFilter() {
        console.log('重置筛选条件');
        
        // 重置半径选项
        document.querySelectorAll('.radius-option').forEach(option => {
            option.classList.remove('active');
        });
        
        // 默认选择1公里
        const defaultRadius = document.querySelector('.radius-option[data-radius="1000"]') || 
                            document.querySelector('.radius-option');
        if (defaultRadius) {
            defaultRadius.classList.add('active');
        }
        
        // 重置状态复选框（默认全部选中）
        const statusCheckboxes = ['statusNormal', 'statusDamage', 'statusAbandon'];
        statusCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) checkbox.checked = true;
        });
        
        // 重置类型复选框（默认全部选中）
        const typeCheckboxes = ['typeGround', 'typeUnderground'];
        typeCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) checkbox.checked = true;
        });
        
        // 隐藏所有错误提示
        this.hideAllValidationErrors();
        
        this.showResultToast('筛选条件已重置为默认值');
    },



    // 关闭筛选面板
    closeFilterPanel() {
        const filterPanel = document.getElementById('filterPanel');
        
        console.log('关闭筛选面板...');
        
        // 使用 transform 隐藏
        filterPanel.style.transform = 'translateY(100%)';
        filterPanel.classList.remove('show');
        
        console.log('面板已关闭，当前类:', filterPanel.className);
    },

    // 切换筛选面板
    toggleFilterPanel() {
        const filterPanel = document.getElementById('filterPanel');
        
        if (!filterPanel) {
            console.error('筛选面板元素未找到!');
            return;
        }
        
        // 方法1：直接读取计算样式
        const computedStyle = window.getComputedStyle(filterPanel);
        const transformValue = computedStyle.transform;
        
        // 方法2：检查是否可见（translateY值）
        let isShowing = false;
        
        if (transformValue === 'none') {
            isShowing = false;
        } else {
            // 解析 transform 矩阵或 translateY 值
            const match = transformValue.match(/translateY\(([^)]+)\)/);
            if (match) {
                const value = match[1];
                // 如果 translateY 值是 0px 或 0%，说明面板显示中
                isShowing = value === '0px' || value === '0%' || value === '0';
            }
        }
        
        console.log('面板状态检测:', {
            transform: transformValue,
            isShowing: isShowing,
            hasShowClass: filterPanel.classList.contains('show')
        });
        
        if (isShowing) {
            this.closeFilterPanel();
        } else {
            this.showFilterPanel();
        }
    },


    // 新增：专门显示面板的方法
    showFilterPanel() {
        const filterPanel = document.getElementById('filterPanel');
        
        console.log('显示筛选面板...');
        
        // 使用 transform 动画
        filterPanel.style.transform = 'translateY(0)';
        filterPanel.classList.add('show');
        
        console.log('面板已显示，当前类:', filterPanel.className);
    },

    // 搜索消防栓
    async searchHydrants() {
        const keyword = document.getElementById('searchInput').value.trim();
        
        if (!keyword) {
            this.showResultToast('请输入搜索关键词');
            return;
        }
        
        // 客户端验证
        if (keyword.length < 2) {
            this.showResultToast('搜索关键词至少需要2个字符');
            return;
        }
        
        // 显示加载中
        if (typeof AuthManager.showLoading === 'function') {
            AuthManager.showLoading('正在搜索...');
        }
        
        try {
            const matched = await DataManager.searchHydrants(keyword);
            
            if (matched.length > 0) {
                // 清除现有标记
                MapManager.clearHydrantMarkers();
                
                // 显示搜索结果标记
                matched.forEach(hydrant => {
                    MapManager.createHydrantMarker(hydrant);
                });
                
                // 定位到第一个结果
                const firstMatch = matched[0];
                if (MapManager.map) {
                    MapManager.map.setCenter([firstMatch.longitude, firstMatch.latitude]);
                    MapManager.map.setZoom(16);
                }
                
                // 显示详情
                MapManager.showHydrantDetail(firstMatch);
                
                this.showResultToast(`找到 ${matched.length} 个匹配的消防栓`);
            } else {
                // 如果没有搜索结果，显示提示
                this.showResultToast('未找到匹配的消防栓');
                MapManager.clearHydrantMarkers();
            }
        } catch (error) {
            console.error('搜索失败:', error);
            this.showResultToast('搜索失败');
        } finally {
            if (typeof AuthManager.hideLoading === 'function') {
                AuthManager.hideLoading();
            }
        }
    },

    // 下载离线地图
    downloadOfflineMap() {
        document.getElementById('loadingToast').style.display = 'block';
        setTimeout(() => {
            document.getElementById('loadingToast').style.display = 'none';
            this.offlineMapLoaded = true;
            this.showResultToast('离线地图下载完成');
            document.getElementById('offlinePanel').style.display = 'none';
        }, 3000);
    },

    // 显示提示信息
    showResultToast(message) {
        const toast = document.getElementById('resultToast');
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 2000);
    },


    // 显示个人信息面板
    async showUserProfile() {
        try {
            // 显示加载中
            AuthManager.showLoading('加载个人信息...');
            
            // 获取用户信息
            const userProfile = await AuthManager.getUserProfile();
            
            if (userProfile) {
            // 更新个人信息显示
            this.updateProfileDisplay(userProfile);
            
            // 显示个人信息面板
            document.getElementById('profilePanel').style.display = 'block';
            setTimeout(() => {
                document.getElementById('profilePanel').classList.add('show');
            }, 10);
            
            console.log('个人信息加载成功:', userProfile);
            } else {
            this.showResultToast('获取个人信息失败');
            }
        } catch (error) {
            console.error('显示个人信息失败:', error);
            this.showResultToast('加载失败: ' + error.message);
        } finally {
            AuthManager.hideLoading();
        }
    },


    // 更新个人信息显示
    updateProfileDisplay(profile) {
        console.log('个人信息数据:', profile); // 保留调试日志
        
        document.getElementById('profileUsername').textContent = profile.username || '--';
        document.getElementById('profileRealName').textContent = profile.realName || profile.real_name || '--';
        
        // 角色显示
        let roleText = '未知';
        if (profile.role === 'admin') roleText = '管理员';
        else if (profile.role === 'firefighter') roleText = '消防员';
        else if (profile.role === 'collector') roleText = '采集员';
        document.getElementById('profileRole').textContent = roleText;
        
        // 状态显示
        const statusText = profile.status === 1 ? '正常' : '禁用';
        const statusClass = profile.status === 1 ? 'status-active' : 'status-inactive';
        document.getElementById('profileStatus').textContent = statusText;
        document.getElementById('profileStatus').className = `status ${statusClass}`;
        
        // 时间格式化函数
        const formatDateTime = (dateString) => {
            if (!dateString) return '--';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                    return '--';
                }
                
                return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            } catch (e) {
                console.error('格式化时间失败:', e);
                return '--';
            }
        };
    
        const loginTime = profile.lastLoginAt || profile.createdAt;
        document.getElementById('profileCreatedAt').textContent = formatDateTime(loginTime);
        
        document.getElementById('profileUserId').textContent = profile.id || '--';
    },

    // 关闭个人信息面板
    closeProfilePanel() {
        document.getElementById('profilePanel').classList.remove('show');
        setTimeout(() => {
            document.getElementById('profilePanel').style.display = 'none';
        }, 300);
    },

    // 显示操作记录面板
    showOperationHistory: async function() {
        try {
            console.log('显示操作记录面板');
            
            // 先显示面板
            const historyPanel = document.getElementById('historyPanel');
            if (!historyPanel) {
            console.error('操作记录面板元素未找到');
            return;
            }
            
            historyPanel.style.display = 'block';
            
            // 等待DOM渲染完成
            setTimeout(async () => {
            historyPanel.classList.add('show');
            
            // 显示加载中
            if (typeof AuthManager.showLoading === 'function') {
                AuthManager.showLoading('加载操作记录...');
            }
            
            try {
                // 加载操作记录
                await this.loadOperationHistory();
            } finally {
                if (typeof AuthManager.hideLoading === 'function') {
                AuthManager.hideLoading();
                }
            }
            }, 50); // 给DOM一点时间渲染
            
        } catch (error) {
            console.error('显示操作记录失败:', error);
            if (typeof AuthManager.showResultToast === 'function') {
            AuthManager.showResultToast('加载操作记录失败');
            }
        }
    },
    
    // 加载操作记录
    loadOperationHistory: async function() {
        try {
            console.log('开始加载操作记录');
            
            // 获取操作记录
            const logs = await AuthManager.getOperationLogs();
            console.log('获取到的操作记录:', logs);
            
            // 更新统计信息
            this.updateHistoryStats(logs);
            
            // 更新操作记录列表
            this.updateHistoryList(logs);
            
        } catch (error) {
            console.error('加载操作记录失败:', error);
            if (typeof AuthManager.showResultToast === 'function') {
            AuthManager.showResultToast('加载失败: ' + error.message);
            }
        }
    },

    // 更新操作记录列表
    updateHistoryList: function(logs) {
        console.log('更新操作记录列表，日志数量:', logs.length);
        
        // 使用更可靠的查找方式
        const historyPanel = document.getElementById('historyPanel');
        if (!historyPanel) {
            console.error('historyPanel 未找到！');
            return;
        }
        
        // 在历史面板内部查找元素
        let historyList = historyPanel.querySelector('#historyList');
        let historyEmpty = historyPanel.querySelector('#historyEmpty');
        
        console.log('查找结果 - historyList:', historyList, 'historyEmpty:', historyEmpty);
        
        // 如果还是找不到，尝试其他查找方式
        if (!historyEmpty) {
            console.warn('通过ID查找失败，尝试其他方式...');
            historyEmpty = document.querySelector('.history-empty');
            console.log('通过class查找:', historyEmpty);
        }
        
        if (!historyList) {
            console.error('historyList 仍然未找到，无法更新列表');
            return;
        }
        
        if (!historyEmpty) {
            console.error('historyEmpty 仍然未找到，将创建空状态显示逻辑');
            // 临时处理：如果没有空状态元素，直接在列表中显示消息
        }
        
        if (!logs || logs.length === 0) {
            console.log('没有操作记录，显示空状态');
            if (historyEmpty) {
            historyEmpty.style.display = 'flex';
            }
            historyList.innerHTML = historyEmpty ? historyEmpty.outerHTML : '<div class="history-empty"><i class="fa fa-history"></i><div>暂无操作记录</div></div>';
            return;
        }
        
        console.log('有操作记录，隐藏空状态');
        if (historyEmpty) {
            historyEmpty.style.display = 'none';
        }
        
        // 生成操作记录HTML
        let historyHTML = '';
        
        // 先按时间排序（最新的在前面）
        const sortedLogs = [...logs].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        sortedLogs.forEach((log, index) => {
            console.log(`处理第 ${index + 1} 条记录:`, log.operation, log.timestamp);
            
            // 格式化时间
            let timeStr = this.formatTimeAgo(log.timestamp);
            
            // 根据操作类型设置图标和颜色
            let icon = 'fa-info-circle';
            let color = '#1677ff';
            let description = log.operation || '未知操作';
            
            if (log.operation === '用户登录') {
            icon = 'fa-sign-in';
            color = '#52c41a';
            description = '登录系统';
            } else if (log.operation === '开始导航') {
            icon = 'fa-road';
            color = '#1890ff';
            const hydrantName = log.details?.hydrantName || '未知消防栓';
            const distance = log.details?.distance ? `(${Math.round(log.details.distance)}米)` : '';
            description = `导航到 ${hydrantName} ${distance}`;
            }
            
            historyHTML += `
            <div class="history-item">
                <div class="history-icon" style="background: ${color}">
                <i class="fa ${icon}"></i>
                </div>
                <div class="history-details">
                <div class="history-operation">${description}</div>
                <div class="history-time">${timeStr}</div>
                </div>
            </div>
            `;
        });
        
        console.log('生成的HTML长度:', historyHTML.length);
        
        // 清空列表并添加新内容
        historyList.innerHTML = historyHTML;
        
        // 验证更新是否成功
        console.log('更新后的子元素数量:', historyList.children.length);
    },

    // 添加时间格式化辅助方法
    formatTimeAgo: function(timestamp) {
        if (!timestamp) return '未知时间';
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp;
            
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffMins < 1) {
            return '刚刚';
            } else if (diffMins < 60) {
            return `${diffMins}分钟前`;
            } else if (diffHours < 24) {
            return `${diffHours}小时前`;
            } else if (diffDays < 7) {
            return `${diffDays}天前`;
            } else {
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            }
        } catch (e) {
            console.error('格式化时间失败:', e);
            return timestamp;
        }
    },




    // 关闭操作记录面板
    closeHistoryPanel: function() {
        console.log('关闭操作记录面板');
        const historyPanel = document.getElementById('historyPanel');
        if (historyPanel) {
            historyPanel.classList.remove('show');
            setTimeout(() => {
            historyPanel.style.display = 'none';
            }, 300);
        }
    },

    
    //更新操作记录统计
    updateHistoryStats: function(logs) {
    console.log('更新操作记录统计，日志数量:', logs.length);
    
    if (!logs || logs.length === 0) {
        document.getElementById('totalLogins').textContent = '0';
        document.getElementById('totalNavigations').textContent = '0';
        return;
    }
    
    // 统计登录次数
    const totalLogins = logs.filter(log => log.operation === '用户登录').length;
    
    // 统计导航次数
    const totalNavigations = logs.filter(log => log.operation === '开始导航').length;
    
    console.log('统计结果 - 登录:', totalLogins, '导航:', totalNavigations);
    
    document.getElementById('totalLogins').textContent = totalLogins;
    document.getElementById('totalNavigations').textContent = totalNavigations;
    },

    


    







};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    AppManager.init();
});