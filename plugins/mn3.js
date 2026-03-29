const fs = require('fs');
const path = require('path');
const { isFounder, isOwnerbot, isDeveloper } = require('../haykala/developer');
const { isElite } = require('../haykala/elite.js');

const activeLinksPath = path.join(__dirname, '..', 'data', 'activeLinks.json');
const activeMentionsPath = path.join(__dirname, '..', 'data', 'activeMentions.json');
const warningsPath = path.join(__dirname, '..', 'data', 'warnings.json');

if (!fs.existsSync(activeLinksPath)) fs.writeFileSync(activeLinksPath, JSON.stringify([]));
if (!fs.existsSync(activeMentionsPath)) fs.writeFileSync(activeMentionsPath, JSON.stringify([]));
if (!fs.existsSync(warningsPath)) fs.writeFileSync(warningsPath, JSON.stringify({}));

let linkListenerAdded = false;
let mentionListenerAdded = false;

function loadWarnings() { return JSON.parse(fs.readFileSync(warningsPath, 'utf8')); }
function saveWarnings(data) { fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2)); }

function isProtected(senderNumber) {
    return isFounder(senderNumber) || isOwnerbot(senderNumber) || isDeveloper(senderNumber) || isElite(senderNumber);
}

function initializeLinkListener(sock) {
    if (linkListenerAdded) return;
    linkListenerAdded = true;

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        const groupId = msg.key.remoteJid;
        if (!groupId.endsWith('@g.us')) return;

        const activeGroups = JSON.parse(fs.readFileSync(activeLinksPath, 'utf8'));
        if (!activeGroups.includes(groupId)) return;

        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
        const senderNumber = sender?.split('@')[0];

        if (isProtected(senderNumber)) return;

        const containsLink = /(https?:\/\/|wa\.me\/|t\.me\/|discord\.gg|chat\.whatsapp\.com)/i.test(body);
        if (!containsLink) return;

        let warnings = loadWarnings();
        if (!warnings[groupId]) warnings[groupId] = {};
        if (!warnings[groupId][sender]) warnings[groupId][sender] = { count: 0, reasons: [] };

        const lastWarning = warnings[groupId][sender].reasons.slice(-1)[0];
        const timeNow = Date.now();
        const lastWarningTime = warnings[groupId][sender].lastWarningTime || 0;
        
        if (lastWarning === "إرسال روابط" && (timeNow - lastWarningTime) < 30000) {
            return;
        }

        warnings[groupId][sender].count += 1;
        warnings[groupId][sender].reasons.push("إرسال روابط");
        warnings[groupId][sender].lastWarningTime = timeNow;
        saveWarnings(warnings);

        const warnCount = warnings[groupId][sender].count;

        try { await sock.sendMessage(groupId, { delete: msg.key }); } catch (e) {}

        if (warnCount >= 4) {
            await sock.sendMessage(groupId, {
                text: `🚫 تم طرد @${senderNumber} بعد ${warnCount} إنذارات (إرسال روابط).`,
                mentions: [sender]
            });
            try { await sock.groupParticipantsUpdate(groupId, [sender], 'remove'); } catch (e) {}
            delete warnings[groupId][sender];
            saveWarnings(warnings);
        } else {
            await sock.sendMessage(groupId, {
                text: `⚠️ @${senderNumber} هذا إنذار رقم ${warnCount} بسبب إرسال روابط.\nسيتم طردك عند 4 إنذارات.`,
                mentions: [sender]
            });
        }
    });
}

function initializeMentionListener(sock) {
    if (mentionListenerAdded) return;
    mentionListenerAdded = true;

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        const groupId = msg.key.remoteJid;
        if (!groupId.endsWith('@g.us')) return;

        const activeGroups = JSON.parse(fs.readFileSync(activeMentionsPath, 'utf8'));
        if (!activeGroups.includes(groupId)) return;

        const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
        const senderNumber = sender?.split('@')[0];

        if (isProtected(senderNumber)) return;

        const message = msg.message;
        let isGroupMention = false;
        let mentions = [];

        if (message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            mentions = message.extendedTextMessage.contextInfo.mentionedJid;
        }

        if (Array.isArray(mentions) && mentions.length > 0) {
            try {
                const metadata = await sock.groupMetadata(groupId);
                const totalMembers = metadata.participants.length;
                let mentionedCount = 0;
                
                metadata.participants.forEach(participant => {
                    if (mentions.includes(participant.id)) {
                        mentionedCount++;
                    }
                });

                if (mentionedCount >= totalMembers * 0.9) {
                    isGroupMention = true;
                }
            } catch (err) {
                console.error('Error getting group metadata:', err);
            }
        }

        if (!isGroupMention) return;

        try { await sock.sendMessage(groupId, { delete: msg.key }); } catch (e) {}

        let warnings = loadWarnings();
        if (!warnings[groupId]) warnings[groupId] = {};
        if (!warnings[groupId][sender]) warnings[groupId][sender] = { count: 0, reasons: [] };

        const lastWarning = warnings[groupId][sender].reasons.slice(-1)[0];
        const timeNow = Date.now();
        const lastWarningTime = warnings[groupId][sender].lastWarningTime || 0;
        
        if (lastWarning === "منشن جماعي" && (timeNow - lastWarningTime) < 30000) {
            return;
        }

        warnings[groupId][sender].count++;
        warnings[groupId][sender].reasons.push("منشن جماعي");
        warnings[groupId][sender].lastWarningTime = timeNow;
        saveWarnings(warnings);

        const count = warnings[groupId][sender].count;
        if (count < 4) {
            await sock.sendMessage(groupId, { text: `⚠️ تحذير ${count}/4 🚨 منشن جماعي ممنوع!`, mentions: [sender] });
        } else {
            await sock.groupParticipantsUpdate(groupId, [sender], 'remove');
            await sock.sendMessage(groupId, { text: `تم طرد @${senderNumber} بعد 4 إنذارات ❌`, mentions: [sender] });
            delete warnings[groupId][sender];
            saveWarnings(warnings);
        }
    });
}

module.exports = {
    command: 'منع',
    async execute(sock, msg) {
        const groupId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
        const senderNumber = (sender || '').split('@')[0];
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

        if (!groupId.endsWith('@g.us')) {
            return sock.sendMessage(groupId, { text: '❌ هذا الأمر يعمل فقط داخل المجموعات.' }, { quoted: msg });
        }

        const parts = text.trim().split(/\s+/);
        const action = parts[1]?.toLowerCase();

        if (!action) {
            return sock.sendMessage(groupId, { text: '📖 *أوامر المنع*\n\n.منع رابط تشغيل/قفل\n.منع منشن تشغيل/ايقاف\n.منع قائمة' }, { quoted: msg });
        }

        let activeLinks = JSON.parse(fs.readFileSync(activeLinksPath, 'utf8'));
        let activeMentions = JSON.parse(fs.readFileSync(activeMentionsPath, 'utf8'));

        if (action === 'قائمة') {
            let output = '📊 *حالة أنظمة المنع*\n\n';
            output += `🔗 منع الروابط: ${activeLinks.includes(groupId) ? '✅ مفعل' : '❌ معطل'}\n`;
            output += `📢 منع المنشن الجماعي: ${activeMentions.includes(groupId) ? '✅ مفعل' : '❌ معطل'}\n\n`;
            output += '📌 *التفاصيل:*\n';
            output += '- منع الروابط: يحذف الروابط ويعطي إنذار\n';
            output += '- منع المنشن: يحذف المنشن الجماعي ويعطي إنذار\n';
            output += '- الطرد بعد 4 إنذارات';
            return sock.sendMessage(groupId, { text: output }, { quoted: msg });
        }

        if (action === 'رابط') {
            const subAction = parts[2]?.toLowerCase();
            
            if (subAction === 'تشغيل') {
                if (activeLinks.includes(groupId)) {
                    return sock.sendMessage(groupId, { text: '✅ منع الروابط مفعل مسبقاً.' }, { quoted: msg });
                }
                activeLinks.push(groupId);
                fs.writeFileSync(activeLinksPath, JSON.stringify(activeLinks, null, 2));
                initializeLinkListener(sock);
                return sock.sendMessage(groupId, { text: '✅ تم تفعيل منع الروابط. سيتم الطرد عند 4 إنذارات.' }, { quoted: msg });
            }
            
            if (subAction === 'قفل') {
                if (!activeLinks.includes(groupId)) {
                    return sock.sendMessage(groupId, { text: '⚠️ منع الروابط معطل بالفعل.' }, { quoted: msg });
                }
                activeLinks = activeLinks.filter(jid => jid !== groupId);
                fs.writeFileSync(activeLinksPath, JSON.stringify(activeLinks, null, 2));
                return sock.sendMessage(groupId, { text: '⛔ تم تعطيل منع الروابط.' }, { quoted: msg });
            }
        }

        if (action === 'منشن') {
            const subAction = parts[2]?.toLowerCase();
            
            if (subAction === 'تشغيل') {
                if (activeMentions.includes(groupId)) {
                    return sock.sendMessage(groupId, { text: '✅ منع المنشن الجماعي مفعل مسبقاً.' }, { quoted: msg });
                }
                activeMentions.push(groupId);
                fs.writeFileSync(activeMentionsPath, JSON.stringify(activeMentions, null, 2));
                initializeMentionListener(sock);
                return sock.sendMessage(groupId, { text: '✅ تم تفعيل منع المنشن الجماعي. سيتم الطرد عند 4 إنذارات.' }, { quoted: msg });
            }
            
            if (subAction === 'ايقاف' || subAction === 'إيقاف') {
                if (!activeMentions.includes(groupId)) {
                    return sock.sendMessage(groupId, { text: '⚠️ منع المنشن الجماعي معطل بالفعل.' }, { quoted: msg });
                }
                activeMentions = activeMentions.filter(jid => jid !== groupId);
                fs.writeFileSync(activeMentionsPath, JSON.stringify(activeMentions, null, 2));
                return sock.sendMessage(groupId, { text: '⛔ تم تعطيل منع المنشن الجماعي.' }, { quoted: msg });
            }
        }

        return sock.sendMessage(groupId, { text: '📖 *أوامر المنع*\n\n.منع رابط تشغيل/قفل\n.منع منشن تشغيل/ايقاف\n.منع قائمة' }, { quoted: msg });
    }
};
