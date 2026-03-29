const { loadPlugins, checkZarfStatus, createSearchAnimation } = require('./plugins');
const config = require('../config');
const logger = require('../utils/console');
const fs = require('fs-extra');
const path = require('path');
const { isElite } = require('../haykala/elite');
const dev = require('../haykala/developer');
const pointsController = require('../haykala/pointsController');

const commands = new Map();

function cmd(options = {}) {
    if (!options.name || !options.exec) {
        throw new Error('يجب تحديد اسم الأمر ودالة التنفيذ');
    }

    commands.set(options.name.toLowerCase(), {
        name: options.name,
        exec: options.exec,
        usage: options.usage || '',
        cooldown: options.cooldown || 0,
        owner: options.owner || false,
        group: options.group || false,
        elite: options.elite || false,
        developer: options.developer || false,
    });

    logger.info(`تم تسجيل الأمر: ${options.name}`);
}

function getCurrentMode(chatId) {
    try {
        if (chatId.endsWith('@g.us')) {
            const groupModePath = path.join(__dirname, '../data/mode_groups.json');
            if (fs.existsSync(groupModePath)) {
                const groupModes = JSON.parse(fs.readFileSync(groupModePath, 'utf8'));
                if (groupModes[chatId]) {
                    return groupModes[chatId];
                }
            }
        }
        
        const globalModePath = path.join(__dirname, '../data/mode.txt');
        if (fs.existsSync(globalModePath)) {
            return fs.readFileSync(globalModePath, 'utf8').trim();
        }
        
        return '[off]';
    } catch (error) {
        logger.warn('خطأ في قراءة الوضع:', error.message);
        return '[off]';
    }
}

function hasPermission(senderNumber, currentMode, commandHandler = {}) {
    const founder = dev.isFounder(senderNumber);
    const owner = dev.isOwnerbot(senderNumber);
    const developer = dev.isDeveloper(senderNumber);
    const elite = isElite(senderNumber);

    if (founder) return true;

    if (commandHandler.developer && !(developer || owner || founder)) {
        return false;
    }

    if (commandHandler.elite && !(elite || developer || owner || founder)) {
        return false;
    }

    if (commandHandler.owner && !(owner || founder)) {
        return false;
    }

    switch (currentMode) {
        case '[اونر]':
            return owner || founder;
        case '[مطور]':
            return developer || owner || founder;
        case '[نخبة]':
            return elite || developer || owner || founder;
        case '[off]':
        default:
            return true;
    }
}

async function handleMessages(sock, { messages }) {
    let message;
    let searchAnim = null;
    
    try {
        message = messages?.[0];
        if (!message) return;

        const chatId = message.key?.remoteJid;
        if (!chatId) return;

        pointsController.setGlobalGroupCache(chatId);

        const disabledChatsPath = path.join(__dirname, '../db/disabledChats.json');
        let disabledChats = {};
        try {
            if (fs.existsSync(disabledChatsPath)) {
                disabledChats = JSON.parse(fs.readFileSync(disabledChatsPath, 'utf8'));
            }
        } catch (err) {
            logger.warn('تعذر قراءة ملف disabledChats.json:', err.message);
        }

        const body =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            '';

        if (!body || typeof body !== 'string') return;

        const currentPrefix = config.prefix;
        if (!body.toLowerCase().startsWith(currentPrefix.toLowerCase())) return;

        const parts = body.slice(currentPrefix.length).trim().split(/\s+/);
        const command = parts[0]?.toLowerCase();
        const args = parts.slice(1);
        if (!command) return;

        if (disabledChats[chatId]) {
            const allowedCommands = ['جروب'];
            if (!allowedCommands.includes(command)) {
                logger.warn(`📴 البوت معطل في هذه المحادثة (${chatId})، تم تجاهل الأمر: ${command}`);
                return;
            }
        }

        const commandWithoutPrefix = command.replace(currentPrefix, '');

        const botPath = path.join(__dirname, '../data/bot.txt');
        let botStatus = '[on]';
        try {
            if (fs.existsSync(botPath)) {
                botStatus = fs.readFileSync(botPath, 'utf8').trim();
            }
        } catch (err) {
            logger.warn('تعذر قراءة ملف bot.txt:', err.message);
        }

        if (botStatus === '[off]' && commandWithoutPrefix !== 'bot') {
            logger.warn(`البوت موقوف. تجاهل الأمر: ${commandWithoutPrefix}`);
            return;
        }

        let senderNumber = '';
        if (chatId.endsWith('@g.us')) {
            senderNumber = message.key.participant?.split('@')[0] || '';
        } else {
            senderNumber = chatId.split('@')[0];
        }

        const currentMode = getCurrentMode(chatId);
        const isGroup = chatId.endsWith('@g.us');
        const isBotDisabled = botStatus === '[off]';
        const zarfEnabled = checkZarfStatus(chatId);

        searchAnim = createSearchAnimation(
            commandWithoutPrefix,
            currentMode,
            isGroup,
            isBotDisabled,
            zarfEnabled
        );
        searchAnim.start();

        const plugins = await loadPlugins();
        const handler = plugins?.[commandWithoutPrefix];
        
        if (!handler) {
            searchAnim.stop(false, 'Command not found');
            logger.warn(`أمر غير معروف: ${commandWithoutPrefix}`);
            return;
        }

        if (handler.isZarfPlugin && chatId.endsWith('@g.us')) {
            const zarfEnabled = checkZarfStatus(chatId);
            if (!zarfEnabled) {
                searchAnim.stop(false, 'Zarf disabled');
                logger.info(`🚫 تم منع أمر الزرف "${commandWithoutPrefix}" في ${chatId}`);
                return;
            }
        }

        const hasPerm = hasPermission(senderNumber, currentMode, handler);
        if (!hasPerm) {
            searchAnim.stop(false, 'Permission denied');
            logger.warn(`⛔ تم رفض الأمر "${commandWithoutPrefix}" - الوضع: ${currentMode}, المرسل: ${senderNumber}`);
            return;
        }

        message.args = args;
        message.command = command;
        message.prefix = currentPrefix;

        if (handler.elite && !dev.isFounder(senderNumber)) {
            searchAnim.stop(false, 'Elite command');
            logger.warn(`محاولة أمر نخبة من غير مصرح: ${senderNumber}`);
            await sock.sendMessage(chatId, { text: config.messages.ownerOnly });
            return;
        }

        if (handler.group && !chatId.endsWith('@g.us')) {
            searchAnim.stop(false, 'Group only');
            await sock.sendMessage(chatId, { text: config.messages.groupOnly });
            return;
        }

        if (typeof handler === 'function') {
            await handler(sock, message);
        } else if (typeof handler.execute === 'function') {
            await handler.execute(sock, message);
        } else {
            throw new Error('المعالج غير صالح: لا توجد دالة execute');
        }

        searchAnim.stop(true, commandWithoutPrefix);

    } catch (error) {
        if (searchAnim) searchAnim.stop(false, 'Error');
        logger.error(`✗ خطأ في معالجة الرسالة: ${error.stack}`);
        if (message?.key?.remoteJid) {
            await sock.sendMessage(message.key.remoteJid, {
                text: config.messages.error
            }).catch(() => {});
        }
    }
}

async function handleCommand(sock, msg, command, args) {
    const cmd = commands.get(command.toLowerCase());
    if (!cmd) return;

    try {
        const chatId = msg.key?.remoteJid;
        const currentMode = getCurrentMode(chatId);
        
        let senderNumber = '';
        if (chatId.endsWith('@g.us')) {
            senderNumber = msg.key.participant?.split('@')[0] || '';
        } else {
            senderNumber = chatId.split('@')[0];
        }

        const hasPerm = hasPermission(senderNumber, currentMode, cmd);
        if (!hasPerm) {
            logger.warn(`⛔ تم رفض الأمر "${command}" - الوضع: ${currentMode}`);
            return;
        }

        if (cmd.owner && !dev.isFounder(senderNumber)) {
            return msg.reply(config.messages.ownerOnly);
        }

        if (cmd.group && !msg.isGroup) {
            return msg.reply(config.messages.groupOnly);
        }

        if (msg.isGroup && config.allowedGroups.length > 0 && !config.allowedGroups.includes(msg.chat)) {
            return msg.reply(config.messages.notAllowedGroup);
        }

        await cmd.exec(sock, msg, args);
        
    } catch (error) {
        logger.error(`✗ خطأ في تنفيذ الأمر ${command}:`, error);
        msg.reply(config.messages.error);
    }
}

function createPluginHandler(options = {}) {
    const pluginHandler = options.execute || (() => {});
    pluginHandler.elite = options.elite || false;
    pluginHandler.group = options.group || false;
    pluginHandler.developer = options.developer || false;
    pluginHandler.command = options.command || 'لا يوجد أمر محدد';
    return pluginHandler;
}

function handleMessagesLoader() {
    logger.info("✅ تم تهيئة نظام الرسائل بنجاح.");
}

module.exports = {
    handleMessages,
    handleCommand,
    cmd,
    commands,
    createPluginHandler,
    handleMessagesLoader,
    getCurrentMode,
    hasPermission
};