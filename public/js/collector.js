// 采集员专用功能
const CollectorManager = {
    map: null,
    marker: null,
    currentUser: null,
    currentToken: null,
    editHydrantId: null,
    editOriginalHydrantId: null, 
    mapSelectionEnabled: false,
    hydrants: [],
    API_BASE: '/api',

    // 防止重复记录的标志
    isLoggingOperation: false, // 正在记录操作的标志
    lastOperationInfo: null,   // 最后一次操作的信息
    operationTimeout: null,    // 操作超时定时器

    // 初始化
    async init() {
        console.log('CollectorManager 初始化');
        
        // 检查登录状态
        await this.checkLogin();
        
        // 初始化用户信息
        this.initUserInfo();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化地图
        await this.initMap();
        
        // 加载消防栓数据
        await this.loadHydrants();
        
        console.log('CollectorManager 初始化完成');
    },

    // 检查登录状态
    async checkLogin() {
        const token = localStorage.getItem('fire_hydrant_token');
        const user = localStorage.getItem('fire_hydrant_user');
        
        if (!token || !user) {
            window.location.href = 'index.html';
            return;
        }
        
        try {
            this.currentToken = token;
            this.currentUser = JSON.parse(user);
            
            // 验证用户角色
            if (this.currentUser.role !== 'collector') {
                this.showToast('请使用采集员账号登录');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
        } catch (error) {
            console.error('检查登录状态失败:', error);
            this.logout();
        }
    },

    // 初始化用户信息
    initUserInfo() {
        if (this.currentUser) {
            document.getElementById('collectorName').textContent = 
                this.currentUser.realName || this.currentUser.username;
        }
    },

    // 绑定事件
    bindEvents() {
        // 退出登录
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // 标签页切换
        document.querySelectorAll('.collector-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.collector-tab').forEach(t => 
                    t.classList.remove('active'));
                document.querySelectorAll('.collector-content').forEach(c => 
                    c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}Content`).classList.add('active');
            });
        });

        // 获取当前位置
        document.getElementById('getCurrentLocation').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // 地图选择位置
        document.getElementById('selectOnMap').addEventListener('click', () => {
            this.enableMapSelection();
        });

        // 确认提交
        document.getElementById('submitHydrant').addEventListener('click', () => {
            this.saveHydrant();
        });

        // 取消编辑
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.resetForm();
        });

        // 搜索功能
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.filterHydrants();
            }
        });

        // 刷新列表
        document.getElementById('refreshList').addEventListener('click', () => {
            this.loadHydrants();
        });

        // 刷新日志
        document.getElementById('refreshLogs').addEventListener('click', () => {
            this.loadOperationLogs();
        });
    },

    // 初始化地图
    async initMap() {
        try {
            await this.waitForAMap();
            
            this.map = new AMap.Map('mapContainer', {
                zoom: 13,
                center: [113.389810, 22.531800],
                resizeEnable: true,
                mapStyle: 'amap://styles/normal',
            });

            // 添加缩放控件
            this.map.addControl(new AMap.ToolBar({
                position: 'RB',
            }));

            // 地图点击事件
            this.map.on('click', (e) => {
                if (this.mapSelectionEnabled) {
                    this.setLocation(e.lnglat.lng, e.lnglat.lat);
                    this.mapSelectionEnabled = false;
                    this.showToast('位置已选择');
                }
            });

        } catch (error) {
            console.error('初始化地图失败:', error);
            this.showToast('地图初始化失败');
        }
    },

    // 等待高德地图API加载
    waitForAMap() {
        return new Promise((resolve) => {
            const checkAMap = () => {
                if (typeof AMap !== 'undefined') {
                    resolve(true);
                    return;
                }
                setTimeout(checkAMap, 100);
            };
            checkAMap();
        });
    },

    // 获取当前位置
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showToast('浏览器不支持定位');
            return;
        }

        this.showLoading('获取位置中...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // 将WGS84坐标转换为高德地图坐标
                const converted = this.wgs84ToGcj02(lng, lat);
                
                this.setLocation(converted[0], converted[1]);
                this.hideLoading();
                this.showToast('位置获取成功');
            },
            (error) => {
                this.hideLoading();
                this.showToast('获取位置失败');
            }
        );
    },

    // 设置位置
    setLocation(lng, lat) {
        document.getElementById('longitude').value = lng.toFixed(6);
        document.getElementById('latitude').value = lat.toFixed(6);
        
        // 更新地图标记
        this.updateMapMarker(lng, lat);
        
        // 移动地图中心
        if (this.map) {
            this.map.setCenter([lng, lat]);
            this.map.setZoom(17);
        }
    },

    // 更新地图标记
    updateMapMarker(lng, lat) {
        if (this.marker) {
            this.marker.setMap(null);
        }
        
        this.marker = new AMap.Marker({
            position: [lng, lat],
            icon: new AMap.Icon({
                image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
                size: new AMap.Size(30, 30),
            }),
        });
        
        this.marker.setMap(this.map);
    },

    // 启用地图选择
    enableMapSelection() {
        this.mapSelectionEnabled = true;
        this.map.setDefaultCursor('crosshair');
        this.showToast('请在地图上点击选择位置');
    },


    // 保存消防栓 
    async saveHydrant() {
        if (!this.validateForm()) {
            return;
        }

        const hydrantData = {
            hydrant_id: document.getElementById('hydrantNumber').value.trim(),
            name: document.getElementById('hydrantName').value.trim(),
            address: document.getElementById('hydrantAddress').value.trim(),
            longitude: parseFloat(document.getElementById('longitude').value),
            latitude: parseFloat(document.getElementById('latitude').value),
            type: document.getElementById('hydrantType').value,
            status: document.getElementById('hydrantStatus').value,
            water_source: document.getElementById('waterSource').value,
            pressure: document.getElementById('waterPressure').value ? 
                parseFloat(document.getElementById('waterPressure').value) : null,
            reference: document.getElementById('reference').value.trim(),
        };

        console.log('=== 开始保存操作 ===');
        console.log('新的hydrant_id:', hydrantData.hydrant_id);
        console.log('当前editHydrantId:', this.editHydrantId);
        console.log('原始hydrant_id:', this.editOriginalHydrantId);

        // 检查是否修改了编号
        const isHydrantIdChanged = this.editOriginalHydrantId && 
            this.editOriginalHydrantId !== hydrantData.hydrant_id;
        
        if (isHydrantIdChanged) {
            console.log('检测到编号修改:', this.editOriginalHydrantId, '→', hydrantData.hydrant_id);
            
            // 显示确认提示
            if (!confirm(`您正在修改消防栓编号：\n\n原编号：${this.editOriginalHydrantId}\n新编号：${hydrantData.hydrant_id}\n\n修改后，原编号将不再可用。是否继续？`)) {
                return;
            }
        }

        // 如果是编辑模式，传递ID
        if (this.editHydrantId) {
            hydrantData.id = this.editHydrantId;
            console.log('设置hydrantData.id为:', hydrantData.id);
        }

        if (isNaN(hydrantData.longitude) || isNaN(hydrantData.latitude)) {
            this.showToast('请输入有效的坐标');
            return;
        }

        const isEdit = !!this.editHydrantId;
        console.log('操作模式:', isEdit ? '编辑' : '新增');
        
        this.showLoading(isEdit ? '更新中...' : '保存中...');

        try {
            console.log('发送到服务器的数据:', hydrantData);
            
            const response = await this.apiCall('/hydrants', 'POST', hydrantData);
            
            console.log('服务器响应:', response);
            
            if (response.success) {
                if (isHydrantIdChanged) {
                    this.showToast(`编号已从 ${this.editOriginalHydrantId} 修改为 ${hydrantData.hydrant_id}`);
                } else {
                    this.showToast(isEdit ? '更新成功' : '添加成功');
                }
                
                // 记录操作日志
                await this.logOperation(
                    isEdit ? '更新消防栓' : '添加消防栓',
                    {
                        originalHydrantId: this.editOriginalHydrantId,
                        newHydrantId: hydrantData.hydrant_id,
                        hydrantName: hydrantData.name,
                        hydrantIdChanged: isHydrantIdChanged
                    }
                );
                
                // 重置表单
                this.resetForm();
                
                // 重新加载数据
                await this.loadHydrants();
                
                // 切换到列表页
                document.querySelector('[data-tab="list"]').click();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('保存失败详情:', error);
            this.showToast('保存失败: ' + error.message);
        } finally {
            this.hideLoading();
        }
    },

    // 验证表单
    validateForm() {
        const requiredFields = [
            'hydrantNumber', 'hydrantName', 'hydrantAddress', 
            'hydrantType', 'hydrantStatus', 'waterSource',
            'reference', 'longitude', 'latitude'
        ];
        
        let isValid = true;
        
        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.style.borderColor = '#ff4d4f';
                isValid = false;
            } else {
                field.style.borderColor = '#d9d9d9';
            }
        }
        
        if (!isValid) {
            this.showToast('请填写所有必填字段');
        }
        
        return isValid;
    },

    // 重置表单
    resetForm() {
        console.log('=== 重置表单 ===');
        
        document.getElementById('hydrantId').value = '';
        document.getElementById('hydrantNumber').value = '';
        document.getElementById('hydrantName').value = '';
        document.getElementById('hydrantAddress').value = '';
        document.getElementById('hydrantType').value = '';
        document.getElementById('hydrantStatus').value = '';
        document.getElementById('waterSource').value = '';
        document.getElementById('waterPressure').value = '';
        document.getElementById('reference').value = '';
        document.getElementById('longitude').value = '';
        document.getElementById('latitude').value = '';
        
        this.editHydrantId = null;
        this.editOriginalHydrantId = null;
        console.log('重置editHydrantId为null');
        console.log('重置editOriginalHydrantId为null');
        
        if (this.marker) {
            this.marker.setMap(null);
            this.marker = null;
        }
        
        document.getElementById('cancelEdit').style.display = 'none';
        document.getElementById('submitHydrant').textContent = '确认提交';
    },

    // 加载消防栓数据
    async loadHydrants() {
        try {
            this.showLoading('加载数据中...');
            
            const response = await this.apiCall('/hydrants');
            
            if (response.success) {
                this.hydrants = response.data || [];
                this.displayHydrants();
                await this.loadOperationLogs();
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showToast('加载失败');
        } finally {
            this.hideLoading();
        }
    },

    // 显示消防栓列表
    displayHydrants() {
        const tableBody = document.getElementById('hydrantTableBody');
        const emptyState = document.getElementById('emptyList');
        const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
        
        let filteredHydrants = this.hydrants;
        
        // 搜索过滤
        if (searchTerm) {
            filteredHydrants = this.hydrants.filter(h => 
                (h.hydrant_id && h.hydrant_id.toLowerCase().includes(searchTerm)) ||
                (h.name && h.name.toLowerCase().includes(searchTerm)) ||
                (h.address && h.address.toLowerCase().includes(searchTerm))
            );
        }
        
        if (filteredHydrants.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        let html = '';
        
        filteredHydrants.forEach(hydrant => {
            // 格式化时间
            const time = new Date(hydrant.updated_at || hydrant.created_at);
            const timeStr = `${time.getMonth()+1}/${time.getDate()} ${time.getHours().toString().padStart(2,'0')}:${time.getMinutes().toString().padStart(2,'0')}`;
            
            // 显示更新人
            const updater = hydrant.update_user_id === this.currentUser.id ? 
                '采集员' : (hydrant.update_user_name || '未知');
            
            html += `
                <tr>
                    <td><strong>${hydrant.hydrant_id}</strong></td>
                    <td>${hydrant.name}</td>
                    <td>${hydrant.address}</td>
                    <td>${hydrant.type}</td>
                    <td><span class="status-badge status-${hydrant.status === '正常' ? 'normal' : hydrant.status === '损坏' ? 'damage' : 'abandon'}">${hydrant.status}</span></td>
                    <td>${updater}</td>
                    <td>${timeStr}</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit-btn" onclick="CollectorManager.editHydrant(${hydrant.id})">
                                编辑
                            </button>
                            <button class="action-btn delete-btn" onclick="CollectorManager.deleteHydrant(${hydrant.id}, '${hydrant.name.replace(/'/g, "\\'")}')">
                                删除
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    },

    // 过滤消防栓
    filterHydrants() {
        this.displayHydrants();
    },

    // 编辑消防栓
    async editHydrant(hydrantId) {
        try {
            this.showLoading('加载信息中...');
            
            const response = await this.apiCall(`/hydrants/${hydrantId}`);
            
            if (response.success && response.data) {
                const hydrant = response.data;
                console.log('=== 编辑消防栓 ===');
                console.log('原始数据:', hydrant);
                
                // 保存原始hydrant_id（非常重要！）
                this.editOriginalHydrantId = hydrant.hydrant_id;
                console.log('保存原始编号:', this.editOriginalHydrantId);
                
                // 确保隐藏字段正确设置
                const hydrantIdInput = document.getElementById('hydrantId');
                if (hydrantIdInput) {
                    hydrantIdInput.value = hydrant.id;
                    console.log('设置隐藏字段ID:', hydrant.id);
                }
                
                // 填充表单
                document.getElementById('hydrantNumber').value = hydrant.hydrant_id;
                document.getElementById('hydrantName').value = hydrant.name;
                document.getElementById('hydrantAddress').value = hydrant.address;
                document.getElementById('hydrantType').value = hydrant.type;
                document.getElementById('hydrantStatus').value = hydrant.status;
                document.getElementById('waterSource').value = hydrant.water_source;
                document.getElementById('waterPressure').value = hydrant.pressure || '';
                document.getElementById('reference').value = hydrant.reference || '';
                document.getElementById('longitude').value = hydrant.longitude;
                document.getElementById('latitude').value = hydrant.latitude;
                
                this.editHydrantId = hydrant.id;
                console.log('设置编辑ID:', this.editHydrantId);
                
                // 更新地图
                this.setLocation(hydrant.longitude, hydrant.latitude);
                
                // 显示取消按钮
                document.getElementById('cancelEdit').style.display = 'inline-flex';
                document.getElementById('submitHydrant').textContent = '更新消防栓';
                
                // 切换到表单页
                document.querySelector('[data-tab="collect"]').click();
                
                this.showToast(`正在编辑: ${hydrant.hydrant_id} - ${hydrant.name}`);
            }
        } catch (error) {
            console.error('加载信息失败:', error);
            this.showToast('加载失败');
        } finally {
            this.hideLoading();
        }
    },

    // 删除消防栓
    async deleteHydrant(hydrantId, hydrantName) {
        if (!confirm(`确定要删除消防栓"${hydrantName}"吗？`)) {
            return;
        }

        this.showLoading('删除中...');

        try {
            // 使用DELETE方法删除
            const response = await this.apiCall(`/hydrants/${hydrantId}`, 'DELETE');
            
            if (response.success) {
                // 记录操作日志
                await this.logOperation('删除消防栓', {
                    hydrantId: hydrantId,
                    hydrantName: hydrantName
                });
                
                this.showToast('删除成功');
                
                // 重新加载数据
                await this.loadHydrants();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('删除失败:', error);
            this.showToast('删除失败');
        } finally {
            this.hideLoading();
        }
    },

    // 加载操作记录
    async loadOperationLogs() {
        try {
            const response = await this.apiCall('/user/operation-logs');
            
            if (response.success) {
                const logs = response.data || [];
                this.displayOperationLogs(logs);
            }
        } catch (error) {
            console.error('加载操作记录失败:', error);
        }
    },

    // 显示操作记录
    displayOperationLogs(logs) {
        const tableBody = document.getElementById('logsTableBody');
        const emptyState = document.getElementById('emptyLogs');
        
        if (!logs || logs.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // 去重逻辑：对于相同的操作，优先显示服务器端记录
        const uniqueLogs = [];
        const seenOperations = new Set();
        
        logs.forEach(log => {
            const operationKey = `${log.operation}-${log.details?.hydrantId || ''}`;
            
            // 如果没有见过这个操作，或者这个记录是服务器端的（优先）
            if (!seenOperations.has(operationKey) || log.source === 'server') {
                if (!seenOperations.has(operationKey)) {
                    seenOperations.add(operationKey);
                }
                uniqueLogs.push(log);
            }
        });
        
        let html = '';
        
        uniqueLogs.forEach(log => {
            const time = new Date(log.timestamp);
            const timeStr = `${time.getMonth()+1}/${time.getDate()} ${time.getHours().toString().padStart(2,'0')}:${time.getMinutes().toString().padStart(2,'0')}`;
            
            html += `
                <tr>
                    <td>${timeStr}</td>
                    <td><strong>${log.operation}</strong></td>
                    <td>${log.details?.hydrantId || '--'}</td>
                    <td>${log.details?.hydrantName || '--'}</td>
                    <td>${log.details ? JSON.stringify(log.details) : '--'}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    },

    // 记录操作日志
    async logOperation(operation, details = {}) {
        try {
            console.log('记录客户端操作:', operation);
            
            await this.apiCall('/log/operation', 'POST', {
                operation: operation,
                details: details,
                source: 'client'  // 添加来源标记
            });
            
            console.log('客户端操作记录成功');
        } catch (error) {
            console.error('记录操作日志失败:', error);
        }
    },

    // API调用封装
    async apiCall(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.currentToken) {
            headers['Authorization'] = `Bearer ${this.currentToken}`;
        }

        const config = {
            method,
            headers,
        };

        if (body && (method === 'POST' || method === 'DELETE')) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`/api${endpoint}`, config);
        return await response.json();
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

    // 显示提示
    showToast(message) {
        const toast = document.getElementById('resultToast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 2000);
    },

    // 显示加载中
    showLoading(message = '处理中...') {
        const toast = document.getElementById('loadingToast');
        toast.textContent = message;
        toast.style.display = 'block';
    },

    // 隐藏加载中
    hideLoading() {
        const toast = document.getElementById('loadingToast');
        toast.style.display = 'none';
    },

    // 退出登录
    logout() {
        localStorage.removeItem('fire_hydrant_token');
        localStorage.removeItem('fire_hydrant_user');
        window.location.href = 'index.html';
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    CollectorManager.init();
});