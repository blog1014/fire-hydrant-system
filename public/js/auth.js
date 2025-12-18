// 认证模块
const AuthManager = {
    currentUser: null,
    currentToken: null,
    API_BASE: '/api',

    // 初始化登录功能
    initLogin() {
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.handleLogin();
        });

        // 支持回车登录
        document.getElementById('loginPwd').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });

        // 检查本地存储的token
        this.checkStoredToken();
    },



    // 获取用户信息
    async getUserProfile() {
        try {
            const response = await this.apiCall('/user/profile', 'GET');
            if (response.success) {
            return response.data;
            }
            return null;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    },

    // 检查本地存储的token
    checkStoredToken() {
        const token = localStorage.getItem('fire_hydrant_token');
        const user = localStorage.getItem('fire_hydrant_user');
        
        if (token && user) {
            try {
                this.currentToken = token;
                this.currentUser = JSON.parse(user);
                this.autoLogin();
            } catch (e) {
                this.clearStorage();
            }
        }
    },

    // 自动登录
    async autoLogin() {
        try {
            // 验证token是否有效
            const response = await this.apiCall('/user/stats', 'GET');
            if (response.success) {
                this.loginSuccess(this.currentUser, this.currentToken);
            } else {
                this.clearStorage();
            }
        } catch (error) {
            this.clearStorage();
        }
    },

    // 处理登录
    async handleLogin() {
        const username = document.getElementById('loginAccount').value.trim();
        const password = document.getElementById('loginPwd').value.trim();
        const selectedRole = document.getElementById('userRole').value;

        // 验证输入
        if (!username || !password) {
            this.showResultToast('请输入账号和密码');
            return;
        }

        this.showLoading('登录中...');

        try {
            const response = await fetch(`${this.API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username, 
                    password,
                    selectedRole  // 将用户选择的角色也发送到后端
                })
            });

            const data = await response.json();
            this.hideLoading();

            if (data.success) {
                // 验证用户选择的角色是否匹配账号实际角色
                if (data.user.role !== selectedRole) {
                    let roleName = '';
                    switch(data.user.role) {
                        case 'admin':
                            roleName = '管理员';
                            break;
                        case 'firefighter':
                            roleName = '消防员';
                            break;
                        case 'collector':
                            roleName = '采集员';
                            break;
                        default:
                            roleName = '用户';
                    }
                    this.showResultToast(`账号角色错误，请选择${roleName}角色登录`);
                    return;
                }
                
                this.currentToken = data.token;
                this.currentUser = data.user;
                
                // 保存到本地存储
                localStorage.setItem('fire_hydrant_token', data.token);
                localStorage.setItem('fire_hydrant_user', JSON.stringify(data.user));
                
                this.loginSuccess(data.user, data.token);
            } else {
                // 直接显示后端返回的错误消息
                this.showResultToast(data.message || '登录失败');
            }
        } catch (error) {
            this.hideLoading();
            // 根据不同错误类型显示不同提示
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                this.showResultToast('网络连接失败，请检查服务器是否运行');
            } else {
                this.showResultToast('登录过程发生错误，请稍后重试');
            }
            console.error('Login error:', error);
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

        if (body && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.API_BASE}${endpoint}`, config);
        return await response.json();
    },

    // 登录成功处理
    loginSuccess(user, token) {
        this.currentUser = user;
        this.currentToken = token;

        // 如果是管理员角色，跳转到管理页面
        if (user.role === 'admin') {
            // 保存token和用户信息到sessionStorage
            sessionStorage.setItem('admin_token', token);
            sessionStorage.setItem('admin_user', JSON.stringify(user));
            
            // 跳转到管理员页面
            window.location.href = 'admin.html';
            return;
        }
        
        // 如果是采集员角色，跳转到采集页面
        if (user.role === 'collector') {
            // 跳转到采集员页面
            window.location.href = 'collector.html';
            return;
        }

        // 消防员留在主页面
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('mapContainer').style.display = 'block';
        document.getElementById('topBar').style.display = 'flex';
        document.getElementById('bottomBar').style.display = 'flex';
        document.getElementById('floatingLocateBtn').style.display = 'flex';

        // 初始化地图和用户数据
        MapManager.initMap();
        this.loadUserStats();
        this.updateUserDisplay();

        this.showResultToast(`欢迎回来，${user.realName || user.username}！`);
    },

    // 加载用户统计信息
    async loadUserStats() {
        try {
            const response = await this.apiCall('/user/stats');
            if (response.success) {
                DataManager.userData = response.data;
                this.updateUserDisplay();
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    },

    // 更新用户界面显示
    updateUserDisplay() {
        if (this.currentUser) {
            document.getElementById('userNameDisplay').textContent = 
                this.currentUser.realName || this.currentUser.username;
            document.getElementById('userRoleDisplay').textContent = 
                this.currentUser.role === 'admin' ? '管理员' : 
                this.currentUser.role === 'collector' ? '采集员' : '消防员';
        }

        if (DataManager.userData) {
            document.getElementById('statHydrants').textContent = DataManager.userData.totalHydrants || 0;
            document.getElementById('statCollections').textContent = DataManager.userData.userCollections || 0;
            document.getElementById('statDays').textContent = DataManager.userData.usageDays || 1;
        }
    },

    // 退出登录
    logout() {
        this.clearStorage();
        
        // 隐藏所有界面
        document.getElementById('userPanel').style.display = 'none';
        document.getElementById('mapContainer').style.display = 'none';
        document.getElementById('topBar').style.display = 'none';
        document.getElementById('bottomBar').style.display = 'none';
        document.getElementById('floatingLocateBtn').style.display = 'none';

        // 重置状态
        this.currentUser = null;
        this.currentToken = null;
        MapManager.reset();

        // 显示登录界面
        document.getElementById('loginPanel').style.display = 'flex';

        // 重置登录表单
        document.getElementById('loginAccount').value = '';
        document.getElementById('loginPwd').value = '';

        this.showResultToast('已退出登录');
    },

    // 清除本地存储
    clearStorage() {
        localStorage.removeItem('fire_hydrant_token');
        localStorage.removeItem('fire_hydrant_user');
    },

    // 显示用户详情界面
    showUserPanel() {
        document.getElementById('userPanel').style.display = 'flex';
    },

    // 显示加载中
    showLoading(message = '处理中...') {
        const toast = document.getElementById('loadingToast');
        toast.textContent = message;
        toast.style.display = 'block';
    },

    // 隐藏加载中
    hideLoading() {
        document.getElementById('loadingToast').style.display = 'none';
    },

    // 显示提示信息
    showResultToast(message) {
        const toast = document.getElementById('resultToast');
        if (!toast) return;
        
        // 清除之前的定时器
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
            this.toastTimer = null;
        }
        
        // 设置消息
        toast.textContent = message;
        
        // 显示并淡入
        toast.style.display = 'block';
        
        // 使用requestAnimationFrame确保DOM更新
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });
        
        // 2秒后淡出并隐藏
        this.toastTimer = setTimeout(() => {
            toast.style.opacity = '0';
            
            // 等淡出动画完成后隐藏
            setTimeout(() => {
                toast.style.display = 'none';
            }, 200); // 淡出动画时间
        }, 2000);
    },

    // 获取操作记录
    async getOperationLogs() {
        try {
            const response = await this.apiCall('/user/operation-logs');
            if (response.success) {
            return response.data;
            }
            return [];
        } catch (error) {
            console.error('获取操作记录失败:', error);
            return [];
        }
    },


    
};