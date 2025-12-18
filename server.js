const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const AMAP_WEB_SERVICE_KEY = '27bfbdb0c1fabbc6d01fafa1066529fb';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'fire_hydrant_secret_key_2024';



app.use(cors());
app.use(express.json());
app.use(express.static('public'));





const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backup');


const ensureDirectories = () => {
    try {
     
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
            console.log('📁 创建数据目录:', DATA_DIR);
        }
        
    
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
            console.log('📁 创建备份目录:', BACKUP_DIR);
        }
        
      
        if (!fs.existsSync(DATA_FILE)) {
            console.log('📄 数据库文件不存在，创建初始数据');
            const initialDB = getInitialDatabase();
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialDB, null, 2));
        }
        
        return true;
    } catch (error) {
        console.error('❌ 目录创建失败:', error.message);
        
     
        try {
       
            const tmpDir = path.join('/tmp', 'fire_hydrant_data');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }
            console.log('🔄 使用备选目录:', tmpDir);
            return true;
        } catch (tmpError) {
            console.error('❌ 备选目录也失败:', tmpError.message);
            return false;
        }
    }
};


const getInitialDatabase = () => {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const firefighterPassword = bcrypt.hashSync('123456', 10);
    const collectorPassword = bcrypt.hashSync('123456', 10);

    return {
        users: [
            {
                id: 1,
                username: 'admin',
                password: adminPassword,
                role: 'admin',
                real_name: '系统管理员',
                status: 1,
                created_at: new Date().toISOString(),
                last_login_at: new Date().toISOString()
            },
            {
                id: 2,
                username: 'firefighter',
                password: firefighterPassword,
                role: 'firefighter',
                real_name: '消防员测试账号',
                status: 1,
                created_at: new Date().toISOString(),
                last_login_at: new Date().toISOString()
            },
            {
                id: 3,
                username: 'collector',
                password: collectorPassword,
                role: 'collector',
                real_name: '采集员测试账号',
                status: 1,
                created_at: new Date().toISOString(),
                last_login_at: new Date().toISOString()
            }
        ],
        fire_hydrants: [
            {
                id: 1,
                hydrant_id: 'XFH-001',
                name: '东区体育中心消防栓',
                address: '东区体育路1号广场西侧',
                longitude: 113.3852,
                latitude: 22.5311,
                type: '地上',
                status: '正常',
                water_source: '市政供水',
                pressure: 0.4,
                reference: '体育中心西侧广场',
                last_check: '2023-11-01',
                update_user_id: 1,
                audit_status: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 2,
                hydrant_id: 'XFH-002',
                name: '石岐区步行街消防栓',
                address: '石岐区孙文西路100号商铺前',
                longitude: 113.3702,
                latitude: 22.5201,
                type: '地上',
                status: '损坏',
                water_source: '市政供水',
                pressure: 0.2,
                reference: '步行街中段商铺前',
                last_check: '2023-09-15',
                update_user_id: 1,
                audit_status: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 3,
                hydrant_id: 'XFH-003',
                name: '西区客运站消防栓',
                address: '西区富华道48号客运站广场',
                longitude: 113.3502,
                latitude: 22.5281,
                type: '地下',
                status: '正常',
                water_source: '市政供水',
                pressure: 0.35,
                reference: '客运站入口广场',
                last_check: '2023-10-20',
                update_user_id: 1,
                audit_status: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 4,
                hydrant_id: 'XFH-004',
                name: '南区医院消防栓',
                address: '南区城南一路1号医院大门左侧',
                longitude: 113.375,
                latitude: 22.498,
                type: '地上',
                status: '废弃',
                water_source: '市政供水',
                pressure: null,
                reference: '医院大门左侧花坛',
                last_check: '2023-06-10',
                update_user_id: 1,
                audit_status: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 5,
                hydrant_id: 'XFH-005',
                name: '火炬开发区测试消防栓',
                address: '火炬开发区科技大道100号',
                longitude: 113.4502,
                latitude: 22.5401,
                type: '地上',
                status: '正常',
                water_source: '市政供水',
                pressure: 0.35,
                reference: '科技大道与创新路交叉口',
                last_check: '2023-11-01',
                update_user_id: 1,
                audit_status: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 6,
                hydrant_id: 'XFH-006',
                name: '小榄镇测试消防栓',
                address: '小榄镇工业大道200号',
                longitude: 113.2502,
                latitude: 22.6481,
                type: '地上',
                status: '正常',
                water_source: '市政供水',
                pressure: 0.4,
                reference: '工业大道与小榄大道交叉口',
                last_check: '2023-11-01',
                update_user_id: 1,
                audit_status: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 7,
                hydrant_id: 'XFH-007',
                name: '港口镇测试消防栓',
                address: '港口镇兴港大道300号',
                longitude: 113.3802,
                latitude: 22.6081,
                type: '地上',
                status: '正常',
                water_source: '市政供水',
                pressure: 0.4,
                reference: '兴港大道与民主路交叉口',
                last_check: '2023-11-01',
                update_user_id: 1,
                audit_status: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 8,
                hydrant_id: 'XFH-008',
                name: '三角镇测试消防栓',
                address: '三角镇金三大道500号',
                longitude: 113.4202,
                latitude: 22.6781,
                type: '地上',
                status: '正常',
                water_source: '市政供水',
                pressure: 0.35,
                reference: '金三大道与福源路交叉口',
                last_check: '2023-11-01',
                update_user_id: 1,
                audit_status: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 9,
                hydrant_id: 'XFH-009',
                name: '板芙镇测试消防栓',
                address: '板芙镇工业大道800号',
                longitude: 113.3202,
                latitude: 22.4281,
                type: '地上',
                status: '正常',
                water_source: '市政供水',
                pressure: 0.38,
                reference: '工业大道与芙蓉路交叉口',
                last_check: '2023-11-01',
                update_user_id: 1,
                audit_status: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 10,
                hydrant_id: 'XFH-010',
                name: '南朗镇测试消防栓',
                address: '南朗镇南岐中路600号',
                longitude: 113.5302,
                latitude: 22.4981,
                type: '地上',
                status: '正常',
                water_source: '市政供水',
                pressure: 0.42,
                reference: '南岐中路与岭南路交叉口',
                last_check: '2023-11-01',
                update_user_id: 1,
                audit_status: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ],
        hydrant_photos: [],
        operation_logs: []
    };
};


const createBackup = () => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
        
        const backupData = {
            users: database.users,
            fire_hydrants: database.fire_hydrants,
            hydrant_photos: database.hydrant_photos || [],
            operation_logs: database.operation_logs || [],
            _backupTime: new Date().toISOString()
        };
        
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        
     
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse();
        
        if (backups.length > 5) {
            backups.slice(5).forEach(file => {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
            });
        }
    } catch (error) {
        console.error('❌ 创建备份失败:', error.message);
    }
};


const loadDatabase = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const parsed = JSON.parse(data);
            console.log('✅ 从文件加载数据库成功');
            
          
            return {
                users: parsed.users || [],
                fire_hydrants: parsed.fire_hydrants || [],
                hydrant_photos: parsed.hydrant_photos || [],
                operation_logs: parsed.operation_logs || []
            };
        }
    } catch (error) {
        console.error('❌ 加载数据库文件失败:', error.message);
    }
    
    console.log('📁 数据库文件不存在，使用初始数据');
    return getInitialDatabase();
};


ensureDirectories();
let database = loadDatabase();


let saveDatabase = () => {
    try {
     
        createBackup();
        
   
        const dataToSave = {
            users: database.users,
            fire_hydrants: database.fire_hydrants,
            hydrant_photos: database.hydrant_photos || [],
            operation_logs: database.operation_logs || [],
            _lastSaved: new Date().toISOString()
        };
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
        console.log('💾 数据库已保存到文件');
        return true;
    } catch (error) {
        console.error('❌ 保存数据库失败:', error.message);
        return false;
    }
};


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: '访问令牌缺失' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: '令牌无效' });
        }
        req.user = user;
        next();
    });
};


const logOperation = (userId, operation, details = {}, source = 'server') => {
    if (!database.operation_logs) {
        database.operation_logs = [];
    }
    
    const log = {
        id: Date.now(),
        userId: userId,
        operation: operation,
        timestamp: new Date().toISOString(),
        details: details,
        source: source 
    };
    
    database.operation_logs.unshift(log);
    

    if (database.operation_logs.length > 100) {
        database.operation_logs = database.operation_logs.slice(0, 100);
    }
    
    saveDatabase();
    console.log(`📝 操作记录: ${operation} - 用户ID: ${userId} - 来源: ${source}`);
};


function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}


app.post('/api/login', (req, res) => {
    const { username, password, selectedRole } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    }

    try {
        const user = database.users.find(u => u.username === username && u.status === 1);

        if (!user) {
            return res.status(401).json({ success: false, message: '账号或密码输入错误' });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ success: false, message: '账号或密码输入错误' });
        }

    
        if (selectedRole && user.role !== selectedRole) {
            let roleName = '';
            switch(user.role) {
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
            return res.status(403).json({ 
                success: false, 
                message: `请使用${roleName}角色登录此账号` 
            });
        }

        user.last_login_at = new Date().toISOString();
        saveDatabase(); 
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

      
        logOperation(user.id, '用户登录', {
            loginTime: new Date().toISOString(),
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
        });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                realName: user.real_name,
                lastLoginAt: user.last_login_at,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});


app.post('/api/log/navigation', authenticateToken, (req, res) => {
    try {
        const { hydrantId, hydrantName, distance, operation, details } = req.body;
        const userId = req.user.id;
        
        console.log('收到日志请求:', { 
            userId, 
            operation: operation || '开始导航', 
            hydrantId, 
            hydrantName 
        });
        

        const logOperationType = operation || '开始导航';
        
        logOperation(userId, logOperationType, {
            hydrantId: hydrantId,
            hydrantName: hydrantName,
            distance: distance || 0,
            ...details, 
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: '操作记录已保存' });
    } catch (error) {
        console.error('记录操作错误:', error);
        res.status(500).json({ success: false, message: '记录操作失败' });
    }
});


app.get('/api/user/operation-logs', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('获取操作记录，用户ID:', userId);
        

        if (!database.operation_logs) {
            database.operation_logs = [];
        }
        
   
        const userLogs = database.operation_logs.filter(log => log.userId == userId);
        
       
        const sortedLogs = userLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
      
        const recentLogs = sortedLogs.slice(0, 20);
        
        console.log(`返回 ${recentLogs.length} 条操作记录`);
        
        res.json({ 
            success: true, 
            data: recentLogs,
            total: userLogs.length
        });
    } catch (error) {
        console.error('获取操作记录错误:', error);
        res.status(500).json({ success: false, message: '获取操作记录失败' });
    }
});


app.get('/api/hydrants', authenticateToken, (req, res) => {
    const { status, type, radius, longitude, latitude } = req.query;
    
    try {
        let hydrants = [...database.fire_hydrants];

 
        if (status && status !== 'all') {
            const statusArray = status.split(',');
            if (statusArray.length > 0) {
                hydrants = hydrants.filter(h => statusArray.includes(h.status));
            }
        }

        
        if (type && type !== 'all') {
            const typeArray = type.split(',');
            if (typeArray.length > 0) {
                hydrants = hydrants.filter(h => typeArray.includes(h.type));
            }
        }

     
        if (radius && longitude && latitude) {
            const centerLng = parseFloat(longitude);
            const centerLat = parseFloat(latitude);
            const radiusKm = parseFloat(radius) / 1000;

            if (radiusKm > 0) {
                hydrants = hydrants.filter(hydrant => {
                    const distance = getDistance(centerLat, centerLng, hydrant.latitude, hydrant.longitude);
                    return distance <= radiusKm;
                });

             
                hydrants.sort((a, b) => {
                    const distA = getDistance(centerLat, centerLng, a.latitude, a.longitude);
                    const distB = getDistance(centerLat, centerLng, b.latitude, b.longitude);
                    return distA - distB;
                });
            }
        }


        const hydrantsWithUser = hydrants.map(hydrant => {
            const updateUser = database.users.find(u => u.id === hydrant.update_user_id);
            return {
                ...hydrant,
                update_user_name: updateUser ? updateUser.real_name : '未知'
            };
        });

        console.log(`返回 ${hydrantsWithUser.length} 个消防栓`);
        res.json({ success: true, data: hydrantsWithUser });
    } catch (error) {
        console.error('获取消防栓列表错误:', error);
        res.status(500).json({ success: false, message: '查询失败' });
    }
});


app.get('/api/hydrants/search', authenticateToken, (req, res) => {
    const { keyword } = req.query;
    
    if (!keyword || keyword.trim() === '') {
        return res.status(400).json({ success: false, message: '搜索关键词不能为空' });
    }
    
  
    const searchTerm = keyword.trim();
    
   
    if (searchTerm.length < 2) {
        return res.json({ success: true, data: [] });
    }
    
  
    if (/^\d+$/.test(searchTerm) && searchTerm.length < 3) {
        return res.json({ success: true, data: [] });
    }

    try {
     
        const searchLower = searchTerm.toLowerCase();
        
       
        const results = database.fire_hydrants.filter(hydrant => {
     
            if (hydrant.hydrant_id && hydrant.hydrant_id.toLowerCase().includes(searchLower)) {
                return true;
            }
            
      
            if (hydrant.name && hydrant.name.toLowerCase().includes(searchLower)) {
                return true;
            }
            
  
            if (hydrant.address && hydrant.address.toLowerCase().includes(searchLower)) {
                return true;
            }
            
            return false;
        });

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('搜索消防栓错误:', error);
        res.status(500).json({ success: false, message: '搜索失败' });
    }
});


app.get('/api/hydrants/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    try {
        const hydrant = database.fire_hydrants.find(h => h.id == id);
        if (!hydrant) {
            return res.status(404).json({ success: false, message: '消防栓不存在' });
        }

        const updateUser = database.users.find(u => u.id === hydrant.update_user_id);
        const hydrantWithUser = {
            ...hydrant,
            update_user_name: updateUser ? updateUser.real_name : '未知'
        };

        res.json({ success: true, data: hydrantWithUser });
    } catch (error) {
        console.error('获取消防栓详情错误:', error);
        res.status(500).json({ success: false, message: '查询失败' });
    }
});


app.post('/api/hydrants', authenticateToken, (req, res) => {
    console.log('=== 收到消防栓保存请求 ===');
    console.log('请求体:', JSON.stringify(req.body, null, 2));
    console.log('用户ID:', req.user.id);
    
    const { 
        id, 
        hydrant_id, name, address, longitude, latitude, 
        type, status, water_source, pressure, reference 
    } = req.body;
    const userId = req.user.id;

   
    if (!hydrant_id || !name || !address || !longitude || !latitude || !type || !status || !water_source) {
        return res.status(400).json({ success: false, message: '必填字段不能为空' });
    }

    try {
        
        if (id) {
            console.log('编辑模式，查找ID:', id);
            
          
            const existingIndex = database.fire_hydrants.findIndex(h => h.id == id);
            
            if (existingIndex >= 0) {
                const originalHydrant = database.fire_hydrants[existingIndex];
                console.log('找到原始记录:', originalHydrant);
                
            
                const isHydrantIdChanged = originalHydrant.hydrant_id !== hydrant_id;
                console.log('编号是否修改:', isHydrantIdChanged, '从', originalHydrant.hydrant_id, '到', hydrant_id);
                
                if (isHydrantIdChanged) {
                  
                    const duplicateIndex = database.fire_hydrants.findIndex(h => 
                        h.hydrant_id === hydrant_id && h.id != id);
                    
                    if (duplicateIndex >= 0) {
                        return res.status(400).json({ 
                            success: false, 
                            message: `消防栓编号 ${hydrant_id} 已被其他记录使用` 
                        });
                    }
                }
                
               
                database.fire_hydrants[existingIndex] = {
                    ...originalHydrant,
                    hydrant_id: hydrant_id, 
                    name,
                    address,
                    longitude: parseFloat(longitude),
                    latitude: parseFloat(latitude),
                    type,
                    status,
                    water_source,
                    pressure: pressure ? parseFloat(pressure) : null,
                    reference,
                    update_user_id: userId,
                    updated_at: new Date().toISOString()
                };
                
                console.log('更新后记录:', database.fire_hydrants[existingIndex]);

           
                logOperation(userId, '更新消防栓', {
                    originalId: originalHydrant.id,
                    originalHydrantId: originalHydrant.hydrant_id,
                    newHydrantId: hydrant_id,
                    hydrantName: name,
                    hydrantIdChanged: isHydrantIdChanged
                });

                saveDatabase();

                res.json({ 
                    success: true, 
                    message: isHydrantIdChanged ? 
                        `消防栓编号已从 ${originalHydrant.hydrant_id} 更新为 ${hydrant_id}` : 
                        '消防栓信息更新成功',
                    data: {
                        id: database.fire_hydrants[existingIndex].id,
                        hydrant_id: hydrant_id
                    }
                });
                return;
            } else {
                console.log('未找到ID对应的记录，可能被删除了');
             
            }
        }
        
      
        console.log('新增模式，检查编号是否重复');
        
   
        const duplicateIndex = database.fire_hydrants.findIndex(h => h.hydrant_id === hydrant_id);
        
        if (duplicateIndex >= 0) {
            return res.status(400).json({ 
                success: false, 
                message: `消防栓编号 ${hydrant_id} 已存在` 
            });
        }
        
 
        const maxId = database.fire_hydrants.length > 0 ? 
            Math.max(...database.fire_hydrants.map(h => h.id)) : 0;
        
        const newHydrant = {
            id: maxId + 1,
            hydrant_id,
            name,
            address,
            longitude: parseFloat(longitude),
            latitude: parseFloat(latitude),
            type,
            status,
            water_source,
            pressure: pressure ? parseFloat(pressure) : null,
            reference,
            last_check: new Date().toISOString().split('T')[0],
            update_user_id: userId,
            audit_status: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('新增记录:', newHydrant);

        database.fire_hydrants.push(newHydrant);

     
        logOperation(userId, '添加消防栓', {
            hydrantId: hydrant_id,
            hydrantName: name,
            newId: newHydrant.id
        });

        saveDatabase();

        res.json({ 
            success: true, 
            message: '消防栓添加成功', 
            data: {
                id: newHydrant.id,
                hydrant_id: hydrant_id
            }
        });
        
    } catch (error) {
        console.error('添加/更新消防栓错误:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
});


app.get('/api/user/stats', authenticateToken, (req, res) => {
    const userId = req.user.id;

    try {
        const totalHydrants = database.fire_hydrants.length;
        const userCollections = database.fire_hydrants.filter(h => h.update_user_id === userId).length;
        
      
        const usageDays = Math.floor(Math.random() * 30) + 1;

        res.json({
            success: true,
            data: {
                totalHydrants,
                userCollections,
                usageDays
            }
        });
    } catch (error) {
        console.error('获取用户统计信息错误:', error);
        res.status(500).json({ success: false, message: '获取统计信息失败' });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/collector.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'collector.html'));
});

app.get('/help.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'help.html'));
});


app.get('/api/amap/regeocode', async (req, res) => {
    console.log('收到逆地理编码请求:', req.query);
    
    const { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
        return res.status(400).json({ 
            success: false, 
            message: '参数错误：longitude 和 latitude 为必填项' 
        });
    }

    try {
       
        const AMAP_WEB_SERVICE_KEY = '27bfbdb0c1fabbc6d01fafa1066529fb';
        
      
        const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_WEB_SERVICE_KEY}&location=${longitude},${latitude}&extensions=base&batch=false`;
        
        console.log('请求高德API:', url);
        
       
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('高德API响应状态:', data.status, '信息:', data.info);

     
        if (data.status === '1') {
            res.json({
                success: true,
                data: data
            });
        } else {
            res.json({
                success: false,
                message: `地址解析失败: ${data.info || '未知错误'}`,
                amapData: data
            });
        }

    } catch (error) {
        console.error('逆地理编码代理接口错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '逆地理编码服务暂时不可用' 
        });
    }
});


app.get('/api/user/profile', authenticateToken, (req, res) => {
    try {
        const user = database.users.find(u => u.id == req.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

       
        const userProfile = {
            id: user.id,
            username: user.username,
            realName: user.real_name,
            role: user.role,
            status: user.status,
            createdAt: user.created_at,
            lastLoginAt: user.last_login_at
        };

        console.log('返回用户信息:', userProfile);
        
        res.json({ success: true, data: userProfile });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ success: false, message: '获取用户信息失败' });
    }
});


app.get('/api/admin/users', authenticateToken, (req, res) => {
  
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限访问' });
    }

    try {
     
        const users = database.users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({ success: false, message: '获取用户列表失败' });
    }
});


app.post('/api/admin/users', authenticateToken, (req, res) => {
  
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限访问' });
    }

    const { username, real_name, password, role, status = 1 } = req.body;

   
    if (!username || !password || !real_name || !role) {
        return res.status(400).json({ success: false, message: '必填字段不能为空' });
    }

  
    const validRoles = ['admin', 'firefighter', 'collector'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: '无效的角色' });
    }

   
    const existingUser = database.users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    try {
      
        const hashedPassword = bcrypt.hashSync(password, 10);

       
        const newUser = {
            id: database.users.length + 1,
            username,
            real_name,
            password: hashedPassword,
            role,
            status: parseInt(status),
            created_at: new Date().toISOString(),
            last_login_at: null
        };

        database.users.push(newUser);
    
        const saveSuccess = saveDatabase();
        if (!saveSuccess) {
            return res.status(500).json({ success: false, message: '保存用户数据失败' });
        }

      
        logOperation(req.user.id, '添加用户', {
            targetUsername: username,
            targetRole: role
        });

      
        const { password: _, ...userWithoutPassword } = newUser;

        res.json({ 
            success: true, 
            message: '用户添加成功',
            data: userWithoutPassword 
        });
    } catch (error) {
        console.error('添加用户错误:', error);
        res.status(500).json({ success: false, message: '添加用户失败' });
    }
});


app.put('/api/admin/users/:id/password', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限访问' });
    }

    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: '密码长度至少6位' });
    }

    try {
        const userIndex = database.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

      
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        database.users[userIndex].password = hashedPassword;
        
        const saveSuccess = saveDatabase();
        if (!saveSuccess) {
            return res.status(500).json({ success: false, message: '保存密码修改失败' });
        }

   
        logOperation(req.user.id, '修改用户密码', {
            targetUserId: userId
        });

        res.json({ success: true, message: '密码修改成功' });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({ success: false, message: '修改密码失败' });
    }
});


app.put('/api/admin/users/:id/status', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限访问' });
    }

    const userId = parseInt(req.params.id);
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
        return res.status(400).json({ success: false, message: '无效的状态值' });
    }

    try {
        const userIndex = database.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

       
        if (userId === req.user.id && status === 0) {
            return res.status(400).json({ success: false, message: '不能禁用当前登录的用户' });
        }

        database.users[userIndex].status = parseInt(status);
      
        const saveSuccess = saveDatabase();
        if (!saveSuccess) {
            return res.status(500).json({ success: false, message: '保存状态修改失败' });
        }

       
        logOperation(req.user.id, '修改用户状态', {
            targetUserId: userId,
            newStatus: status === 1 ? '启用' : '禁用'
        });

        res.json({ 
            success: true, 
            message: `用户已${status === 1 ? '启用' : '禁用'}` 
        });
    } catch (error) {
        console.error('修改用户状态错误:', error);
        res.status(500).json({ success: false, message: '修改状态失败' });
    }
});


app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限访问' });
    }

    const userId = parseInt(req.params.id);

    try {
        const userIndex = database.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

     
        if (userId === req.user.id) {
            return res.status(400).json({ success: false, message: '不能删除当前登录的用户' });
        }

        const deletedUser = database.users.splice(userIndex, 1)[0];
      
        const saveSuccess = saveDatabase();
        if (!saveSuccess) {
            return res.status(500).json({ success: false, message: '保存删除操作失败' });
        }

     
        logOperation(req.user.id, '删除用户', {
            targetUserId: userId,
            targetUsername: deletedUser.username
        });

        res.json({ success: true, message: '用户删除成功' });
    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({ success: false, message: '删除用户失败' });
    }
});


app.get('/api/admin/db-status', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限访问' });
    }
    
    const stats = {
        users: database.users.length,
        hydrants: database.fire_hydrants.length,
        logs: database.operation_logs ? database.operation_logs.length : 0,
        lastSaved: new Date().toISOString(),
        dataFile: DATA_FILE
    };
    
    res.json({ success: true, data: stats });
});


const safeSaveDatabase = () => {
    try {
        console.log('💾 开始保存数据库...');
        
        
        const dataToSave = {
            users: database.users,
            fire_hydrants: database.fire_hydrants,
            hydrant_photos: database.hydrant_photos || [],
            operation_logs: database.operation_logs || [],
            _lastSaved: new Date().toISOString()
        };
        
     
        const tempFile = DATA_FILE + '.tmp';
        
       
        fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2));
        
       
        if (fs.existsSync(DATA_FILE)) {
            const backupFile = DATA_FILE + '.bak.' + Date.now();
            fs.copyFileSync(DATA_FILE, backupFile);
        }
        
        
        fs.renameSync(tempFile, DATA_FILE);
        
        console.log('✅ 数据库保存完成');
        console.log(`👥 当前用户数: ${database.users.length}`);
        console.log(`🧯 当前消防栓数: ${database.fire_hydrants.length}`);
        
     
        cleanupOldBackups();
        
        return true;
    } catch (error) {
        console.error('❌ 保存数据库失败:', error.message);
        
   
        try {
            console.log('🔄 尝试紧急保存...');
            const dataToSave = {
                users: database.users,
                fire_hydrants: database.fire_hydrants,
                hydrant_photos: database.hydrant_photos || [],
                operation_logs: database.operation_logs || [],
                _lastSaved: new Date().toISOString()
            };
            
            const emergencyFile = DATA_FILE + '.emergency';
            fs.writeFileSync(emergencyFile, JSON.stringify(dataToSave, null, 2));
            console.log('⚠️ 紧急保存到:', emergencyFile);
            
           
            fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
            console.log('✅ 主文件保存成功');
            
            return true;
        } catch (fallbackError) {
            console.error('❌ 所有保存方式都失败:', fallbackError.message);
            return false;
        }
    }
};


const cleanupOldBackups = () => {
    try {
        const files = fs.readdirSync(DATA_DIR);
        const backupFiles = files.filter(f => f.startsWith('database.json.bak.'));
        
        if (backupFiles.length > 5) {
        
            const sortedFiles = backupFiles.map(file => ({
                name: file,
                time: fs.statSync(path.join(DATA_DIR, file)).mtime.getTime()
            })).sort((a, b) => a.time - b.time);
       
            for (let i = 0; i < sortedFiles.length - 5; i++) {
                fs.unlinkSync(path.join(DATA_DIR, sortedFiles[i].name));
                console.log(`🗑️ 删除旧备份: ${sortedFiles[i].name}`);
            }
        }
    } catch (error) {
        console.warn('⚠️ 清理备份文件失败:', error.message);
    }
};


saveDatabase = safeSaveDatabase;


const startAutoSave = () => {
    setInterval(() => {
        console.log('🔄 定时备份数据库...');
        safeSaveDatabase(); 
    }, 5 * 60 * 1000); 
    
    console.log('🔄 定时备份已启动（每5分钟一次）');
};


process.on('SIGINT', () => {
    console.log('\n🔔 收到关闭信号，正在保存数据...');
    try {
        const saveSuccess = saveDatabase();
        if (saveSuccess) {
            console.log('✅ 数据保存完成，退出进程');
        } else {
            console.error('❌ 数据保存失败');
        }
    } catch (error) {
        console.error('❌ 保存数据异常:', error.message);
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🔔 收到终止信号，正在保存数据...');
   
    try {
        const dataToSave = {
            users: database.users,
            fire_hydrants: database.fire_hydrants,
            hydrant_photos: database.hydrant_photos || [],
            operation_logs: database.operation_logs || [],
            _lastSaved: new Date().toISOString()
        };
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
        console.log('✅ 数据保存完成，退出进程');
    } catch (error) {
        console.error('❌ 保存数据失败:', error.message);
    }
    process.exit(0);
});


app.delete('/api/hydrants/:id', authenticateToken, (req, res) => {
    const hydrantId = parseInt(req.params.id);
    
    try {
        const hydrantIndex = database.fire_hydrants.findIndex(h => h.id === hydrantId);
        
        if (hydrantIndex === -1) {
            return res.status(404).json({ success: false, message: '消防栓不存在' });
        }
    
        const deletedHydrant = database.fire_hydrants.splice(hydrantIndex, 1)[0];
        
     
        saveDatabase();
        
     
        logOperation(req.user.id, '删除消防栓', {
            hydrantId: deletedHydrant.hydrant_id,
            hydrantName: deletedHydrant.name,
            deletedAt: new Date().toISOString()
        });
        
        res.json({ 
            success: true, 
            message: '消防栓删除成功'
        });
        
    } catch (error) {
        console.error('删除消防栓错误:', error);
        res.status(500).json({ success: false, message: '删除失败' });
    }
});



startAutoSave();


if (process.env.VERCEL) {
   
    console.log('✅ Vercel Serverless 环境启动');
    module.exports = app;
} else {

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log('=================================');
        console.log('🔥 消防栓定位与导航系统服务器启动成功');
        console.log('=================================');
        console.log(`🌐 服务器运行在端口: ${PORT}`);
        console.log('📂 项目根目录:', __dirname);
        console.log('📁 数据目录:', DATA_DIR);
        console.log('📄 数据库文件:', DATA_FILE);
        console.log('');
        console.log('🔑 测试账号信息:');
        console.log('管理员账号: admin / admin123');
        console.log('消防员账号: firefighter / 123456');
        console.log('采集员账号: collector / 123456');
        console.log('=================================');
    });
    module.exports = app;
}