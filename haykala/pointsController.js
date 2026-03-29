const fs = require('fs');
const path = require('path');

const POINTS_FILE = path.join(__dirname, '../data/points.json');
const CONFIG_FILE = path.join(__dirname, '../data/points-config.json');
const GLOBAL_POINTS_FILE = path.join(__dirname, '../data/points_state_global.txt');
const GROUP_POINTS_FILE = path.join(__dirname, '../data/points_state_groups.json');

let SYSTEM_ENABLED = true;
let SYSTEM_MESSAGES = {};
let globalGroupCache = null;

function setGlobalGroupCache(groupJid) {
    if (groupJid && groupJid.endsWith('@g.us')) {
        globalGroupCache = groupJid;
    }
}

function getGlobalGroupCache() {
    return globalGroupCache;
}

function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            const defaultConfig = {
                enabled: true,
                messages: {
                    system_disabled: "نظام النقاط مقفل حالياً 🔒",
                    insufficient_points: "نقاطك غير كافية! ❌\nالمطلوب: {amount}\nرصيدك: {balance}",
                    points_deducted: "تم خصم {amount} نقطة ✅\nالرصيد الجديد: {newBalance}",
                    points_added: "تم إضافة {amount} نقطة ✅\nالرصيد الجديد: {newBalance}",
                    balance_check: "رصيدك: {balance} نقطة 🪙",
                    rank_info: "تصنيفك: {rank} 🎖️"
                }
            };
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
            SYSTEM_MESSAGES = defaultConfig.messages;
            return defaultConfig;
        }
        
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        SYSTEM_ENABLED = config.enabled;
        SYSTEM_MESSAGES = config.messages || {};
        return config;
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error.message);
        return { enabled: true, messages: {} };
    }
}

function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        SYSTEM_ENABLED = config.enabled;
        SYSTEM_MESSAGES = config.messages || {};
        return true;
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error.message);
        return false;
    }
}

function loadPoints() {
    try {
        if (!fs.existsSync(POINTS_FILE)) {
            fs.writeFileSync(POINTS_FILE, JSON.stringify({}, null, 2));
        }
        return JSON.parse(fs.readFileSync(POINTS_FILE, 'utf8'));
    } catch (error) {
        console.error('خطأ في تحميل النقاط:', error.message);
        return {};
    }
}

function savePoints(data) {
    try {
        fs.writeFileSync(POINTS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('خطأ في حفظ النقاط:', error.message);
        return false;
    }
}

function getPointsGlobalStatus() {
    if (!fs.existsSync(GLOBAL_POINTS_FILE)) {
        fs.writeFileSync(GLOBAL_POINTS_FILE, '[on]');
        return '[on]';
    }
    return fs.readFileSync(GLOBAL_POINTS_FILE, 'utf8').trim();
}

function getGroupPointsStatus(groupJid) {
    if (!fs.existsSync(GROUP_POINTS_FILE)) {
        fs.writeFileSync(GROUP_POINTS_FILE, '{}');
        return null;
    }
    const groupData = JSON.parse(fs.readFileSync(GROUP_POINTS_FILE, 'utf8'));
    return groupData[groupJid] || null;
}

function isSystemEnabled(groupJid = null) {
    let actualGroupJid = groupJid;
    
    if (!actualGroupJid) {
        actualGroupJid = getGlobalGroupCache();
    }
    
    if (actualGroupJid && actualGroupJid.endsWith('@g.us')) {
        const groupStatus = getGroupPointsStatus(actualGroupJid);
        if (groupStatus) return groupStatus === '[on]';
        const globalStatus = getPointsGlobalStatus();
        return globalStatus === '[on]';
    }
    
    const globalStatus = getPointsGlobalStatus();
    return globalStatus === '[on]';
}

function toggleSystem(status, groupJid = null) {
    if (groupJid && groupJid.endsWith('@g.us')) {
        let groupData = {};
        if (fs.existsSync(GROUP_POINTS_FILE)) {
            groupData = JSON.parse(fs.readFileSync(GROUP_POINTS_FILE, 'utf8'));
        }
        groupData[groupJid] = `[${status ? 'on' : 'off'}]`;
        fs.writeFileSync(GROUP_POINTS_FILE, JSON.stringify(groupData, null, 2));
    } else {
        fs.writeFileSync(GLOBAL_POINTS_FILE, `[${status ? 'on' : 'off'}]`);
    }
    
    console.log(`نظام النقاط ${status ? 'مفعل' : 'معطل'} ${groupJid ? `للمجموعة ${groupJid}` : 'عالمياً'}`);
    return status;
}

function getSystemMessage(key, data = {}) {
    let message = SYSTEM_MESSAGES[key] || '';
    
    for (const [placeholder, value] of Object.entries(data)) {
        message = message.replace(`{${placeholder}}`, value);
    }
    
    return message;
}

function checkUserBalance(userId, amount, groupJid = null) {
    let actualGroupJid = groupJid;
    if (!actualGroupJid) {
        actualGroupJid = getGlobalGroupCache();
    }
    
    if (!isSystemEnabled(actualGroupJid)) {
        return {
            success: false,
            enabled: false,
            message: getSystemMessage('system_disabled')
        };
    }
    
    const pointsData = loadPoints();
    const balance = pointsData[userId] || 0;
    
    if (balance < amount) {
        return {
            success: false,
            enabled: true,
            balance: balance,
            message: getSystemMessage('insufficient_points', {
                amount: amount,
                balance: balance
            })
        };
    }
    
    return {
        success: true,
        enabled: true,
        balance: balance,
        message: getSystemMessage('balance_check', { balance: balance })
    };
}

function processDeduction(userId, amount, reason = '', groupJid = null) {
    let actualGroupJid = groupJid;
    if (!actualGroupJid) {
        actualGroupJid = getGlobalGroupCache();
    }
    
    if (!isSystemEnabled(actualGroupJid)) {
        return {
            success: false,
            enabled: false,
            message: getSystemMessage('system_disabled')
        };
    }
    
    const pointsData = loadPoints();
    const currentBalance = pointsData[userId] || 0;
    
    if (currentBalance < amount) {
        return {
            success: false,
            enabled: true,
            balance: currentBalance,
            message: getSystemMessage('insufficient_points', {
                amount: amount,
                balance: currentBalance
            })
        };
    }
    
    pointsData[userId] = currentBalance - amount;
    savePoints(pointsData);
    
    return {
        success: true,
        enabled: true,
        newBalance: pointsData[userId],
        message: getSystemMessage('points_deducted', {
            amount: amount,
            newBalance: pointsData[userId]
        })
    };
}

function processAddition(userId, amount, reason = '', groupJid = null) {
    let actualGroupJid = groupJid;
    if (!actualGroupJid) {
        actualGroupJid = getGlobalGroupCache();
    }
    
    if (!isSystemEnabled(actualGroupJid)) {
        return {
            success: false,
            enabled: false,
            message: getSystemMessage('system_disabled')
        };
    }
    
    const pointsData = loadPoints();
    const currentBalance = pointsData[userId] || 0;
    
    pointsData[userId] = currentBalance + amount;
    savePoints(pointsData);
    
    return {
        success: true,
        enabled: true,
        newBalance: pointsData[userId],
        message: getSystemMessage('points_added', {
            amount: amount,
            newBalance: pointsData[userId]
        })
    };
}

function getUserInfo(userId, groupJid = null) {
    let actualGroupJid = groupJid;
    if (!actualGroupJid) {
        actualGroupJid = getGlobalGroupCache();
    }
    
    if (!isSystemEnabled(actualGroupJid)) {
        return {
            success: false,
            enabled: false,
            message: getSystemMessage('system_disabled')
        };
    }
    
    const pointsData = loadPoints();
    const balance = pointsData[userId] || 0;
    const rank = getRank(balance);
    
    return {
        success: true,
        enabled: true,
        balance: balance,
        rank: rank,
        message: `${getSystemMessage('balance_check', { balance: balance })}\n${getSystemMessage('rank_info', { rank: rank })}`
    };
}

function getRank(points) {
    if (points >= 1000000000) return 'DEVELOPER 👑';
    if (points >= 100000000) return 'KING OF POINTS 🌀';
    if (points >= 10000000) return 'BIG BOSS 💀';
    if (points >= 1000000000) return 'WTF 🔥🔥';
    if (points >= 100000) return 'KILLER 🔪🩸'; 
    if (points >= 10000) return 'LEGEND 🦁';
    if (points >= 1000) return 'PRO 💎';
    if (points >= 500) return 'advanced 🔥';
    if (points >= 200) return 'junior 🌱';
    if (points < -10) return 'noob 🪫';
    return 'junior 🌱';
}

function updateMessage(key, newMessage) {
    const config = loadConfig();
    if (!config.messages) config.messages = {};
    config.messages[key] = newMessage;
    saveConfig(config);
    return true;
}

loadConfig();

module.exports = {
    loadPoints,
    savePoints,
    isSystemEnabled,
    toggleSystem,
    checkUserBalance,
    processDeduction,
    processAddition,
    getUserInfo,
    getRank,
    updateMessage,
    getSystemMessage,
    setGlobalGroupCache,
    getGlobalGroupCache,
    
    SYSTEM_INFO: {
        configFile: CONFIG_FILE,
        pointsFile: POINTS_FILE
    }
};