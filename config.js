const fs = require('fs');
const path = require('path');

const PREFIX_FILE = path.join(__dirname, 'prefix.txt');

function readPrefixFromFile() {
    try {
        if (fs.existsSync(PREFIX_FILE)) {
            return fs.readFileSync(PREFIX_FILE, 'utf8').trim();
        }
    } catch (error) {
        console.error('Error reading prefix file:', error);
    }
    return '.'; 
}

function writePrefixToFile(newPrefix) {
    try {
        fs.writeFileSync(PREFIX_FILE, newPrefix, 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing prefix file:', error);
        return false;
    }
}

let prefix = readPrefixFromFile();

module.exports = {
    botName: 'FHS',
    version: '2.5.0',
    owner: '972532731932',

    defaultPrefix: '.',
    get prefix() { 
        return readPrefixFromFile();
    },
    set prefix(p) { 
        if (typeof p === 'string') {
            writePrefixToFile(p);
            prefix = p; 
        }
    },

    allowedGroups: [],

    messages: {
        error: '❌ حدث خطأ أثناء تنفيذ الأمر',
        noPermission: 'ليس لديك صلاحية لاستخدام هذا الأمر',
        groupOnly: 'هذا الأمر متاح فقط في المجموعات',
        ownerOnly: 'هذا الأمر متاح فقط للنخبة',
        notAllowedGroup: 'عذراً، البوت لا يعمل في هذه المجموعة'
    },

    colors: {
        success: '\x1b[32m',
        error: '\x1b[31m',
        info: '\x1b[36m',
        warn: '\x1b[33m',
        reset: '\x1b[0m'
    }
};