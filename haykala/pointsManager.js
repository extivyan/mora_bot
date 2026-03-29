const fs = require('fs');
const path = require('path');

const POINTS_FILE = path.join(__dirname, '../data/points.json');
const DEVELOPER_FILE = path.join(__dirname, 'developer.json');

console.log('🔍 مسار points.json:', POINTS_FILE);
console.log('🔍 مسار developer.json:', DEVELOPER_FILE);

function loadPoints() {
    try {
        if (!fs.existsSync(POINTS_FILE)) {
            console.log('📁 جاري إنشاء ملف points.json...');
            fs.writeFileSync(POINTS_FILE, JSON.stringify({}, null, 2));
        }
        const pointsData = JSON.parse(fs.readFileSync(POINTS_FILE, 'utf8'));
        console.log('📊 بيانات النقاط المحملة:', pointsData);
        return pointsData;
    } catch (e) {
        console.error('❌ خطأ في تحميل النقاط:', e);
        return {};
    }
}

function savePoints(data) {
    try {
        fs.writeFileSync(POINTS_FILE, JSON.stringify(data, null, 2));
        console.log('💾 تم حفظ النقاط بنجاح');
        return true;
    } catch (e) {
        console.error('❌ خطأ في حفظ النقاط:', e);
        return false;
    }
}

function loadDevData() {
    try {
        const devData = JSON.parse(fs.readFileSync(DEVELOPER_FILE, 'utf8'));
        console.log('👥 بيانات المطورين:', devData);
        return devData;
    } catch (e) {
        console.error('❌ خطأ في تحميل بيانات المطورين:', e);
        return { founder: [], ownerbot: [], developers: [] };
    }
}

function ensureSpecialUsersPoints() {
    try {
        console.log('🔄 جاري تأكيد نقاط المميزين...');
        const pointsData = loadPoints();
        const devData = loadDevData();
        let updated = false;

        const allSpecialUsers = [
            ...devData.founder,
            ...devData.ownerbot,
            ...devData.developers
        ];

        console.log('🎯 المميزون الحاليون:', allSpecialUsers);

        allSpecialUsers.forEach(user => {
            if (pointsData[user] !== 1e+24) {
                console.log(`✅ إعطاء نقاط لا نهائية لـ: ${user}`);
                pointsData[user] = 1e+24;
                updated = true;
            }
        });

        Object.keys(pointsData).forEach(user => {
            if (pointsData[user] === 1e+24 && !allSpecialUsers.includes(user)) {
                console.log(`🗑️ إزالة النقاط من: ${user}`);
                pointsData[user] = 0;
                updated = true;
            }
        });

        if (updated) {
            savePoints(pointsData);
            console.log('🎉 تم تحديث نقاط المميزين');
        } else {
            console.log('ℹ️ لا يوجد تحديثات needed للنقاط');
        }
        
        return true;
    } catch (error) {
        console.error('❌ خطأ في تأكيد نقاط المميزين:', error);
        return false;
    }
}

ensureSpecialUsersPoints();

module.exports = {
    ensureSpecialUsersPoints
};