const DataManager = {
    // 用户数据
    userData: {
        totalHydrants: 0,
        userCollections: 0,
        usageDays: 1
    },

    // 从服务器加载消防栓数据（带筛选）
    async loadHydrantsFromServer(filters = {}) {
        try {
            // 构建查询参数
            const params = new URLSearchParams();
            
            // 添加筛选参数
            if (filters.status && Array.isArray(filters.status)) {
                // 如果是数组，转换为逗号分隔的字符串
                params.append('status', filters.status.join(','));
            } else if (filters.status) {
                params.append('status', filters.status);
            }
            
            if (filters.type && Array.isArray(filters.type)) {
                // 如果是数组，转换为逗号分隔的字符串
                params.append('type', filters.type.join(','));
            } else if (filters.type) {
                params.append('type', filters.type);
            }
            
            // 添加位置筛选参数
            if (filters.radius && filters.longitude && filters.latitude) {
                params.append('radius', filters.radius);
                params.append('longitude', filters.longitude);
                params.append('latitude', filters.latitude);
            }
            
            console.log('发送筛选请求，参数:', params.toString());
            
            const response = await AuthManager.apiCall(`/hydrants?${params.toString()}`);
            
            console.log('服务器响应:', response);
            
            if (response.success) {
                return response.data || [];
            } else {
                console.error('服务器返回错误:', response.message);
                AuthManager.showResultToast(response.message || '加载数据失败');
                return [];
            }
        } catch (error) {
            console.error('加载消防栓数据失败:', error);
            AuthManager.showResultToast('网络错误，请稍后重试');
            return [];
        }
    },

    // 搜索消防栓
    async searchHydrants(keyword) {
        try {
            // 移除前后空格
            keyword = keyword.trim();
            
            if (!keyword || keyword === '') {
                // 如果关键词为空，不返回数据，让用户看到空状态
                return [];
            }
            
            // 验证搜索关键词格式
            const isValidKeyword = this.validateSearchKeyword(keyword);
            if (!isValidKeyword) {
                AuthManager.showResultToast('请输入正确的消防栓信息（编号、名称或地址）');
                return [];
            }
            
            const response = await AuthManager.apiCall(`/hydrants/search?keyword=${encodeURIComponent(keyword)}`);
            
            if (response.success) {
                if (response.data && response.data.length > 0) {
                    return response.data;
                } else {
                    // 没有找到匹配结果
                    AuthManager.showResultToast('未找到匹配的消防栓');
                    return [];
                }
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('搜索消防栓失败:', error);
            AuthManager.showResultToast('搜索失败: ' + error.message);
            return [];
        }
    },

    // 验证搜索关键词格式
    validateSearchKeyword(keyword) {
        // 检查是否为纯数字（避免只输入1、2等单个数字）
        if (/^\d+$/.test(keyword)) {
            return false;
        }
        
        // 检查是否为消防栓编号格式（如 XFH-001, XFH-002）
        if (/^XFH-[A-Za-z0-9]+$/i.test(keyword)) {
            return true;
        }
        
        // 检查是否为有效的搜索关键词（至少2个字符）
        if (keyword.length < 2) {
            return false;
        }
        
        // 检查是否包含有效的搜索词（可以包含中文、英文、数字）
        const validPattern = /^[\u4e00-\u9fa5a-zA-Z0-9\-\s]+$/;
        return validPattern.test(keyword);
    },

    // 筛选消防栓（客户端筛选，作为备用方案）
    filterHydrantsClientSide(hydrants, filters = {}) {
        let filtered = [...hydrants];
        
        // 状态筛选
        const statusFilters = [];
        if (filters.statusNormal) statusFilters.push('正常');
        if (filters.statusDamage) statusFilters.push('损坏');
        if (filters.statusAbandon) statusFilters.push('废弃');
        
        if (statusFilters.length > 0) {
            filtered = filtered.filter(hydrant => statusFilters.includes(hydrant.status));
        }
        
        // 类型筛选
        const typeFilters = [];
        if (filters.typeGround) typeFilters.push('地上');
        if (filters.typeUnderground) typeFilters.push('地下');
        
        if (typeFilters.length > 0) {
            filtered = filtered.filter(hydrant => typeFilters.includes(hydrant.type));
        }
        
        // 距离筛选（如果有当前位置）
        if (filters.radius && filters.currentPosition) {
            filtered = filtered.filter(hydrant => {
                const distance = this.calculateDistance(
                    filters.currentPosition.lat,
                    filters.currentPosition.lng,
                    hydrant.latitude,
                    hydrant.longitude
                );
                return distance <= filters.radius;
            });
            
            // 按距离排序
            filtered.sort((a, b) => {
                const distA = this.calculateDistance(
                    filters.currentPosition.lat,
                    filters.currentPosition.lng,
                    a.latitude,
                    a.longitude
                );
                const distB = this.calculateDistance(
                    filters.currentPosition.lat,
                    filters.currentPosition.lng,
                    b.latitude,
                    b.longitude
                );
                return distA - distB;
            });
        }
        
        return filtered;
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

    // 添加消防栓
    async addHydrant(hydrantData) {
        try {
            const response = await AuthManager.apiCall('/hydrants', 'POST', hydrantData);
            
            if (response.success) {
                AuthManager.showResultToast('消防栓添加成功');
                return response;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('添加消防栓失败:', error);
            AuthManager.showResultToast('添加失败: ' + error.message);
            return { success: false };
        }
    },

    // 更新消防栓
    async updateHydrant(hydrantId, hydrantData) {
        try {
            const response = await AuthManager.apiCall('/hydrants', 'POST', {
                ...hydrantData,
                hydrant_id: hydrantId
            });
            
            if (response.success) {
                AuthManager.showResultToast('消防栓更新成功');
                return response;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('更新消防栓失败:', error);
            AuthManager.showResultToast('更新失败: ' + error.message);
            return { success: false };
        }
    }
};