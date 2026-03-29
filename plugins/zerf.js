const fs = require('fs');
const path = require('path');
const hay = require('../haykala/developer');
const plugins = require('../handlers/plugins.js');

const GLOBAL_ZARF_FILE = path.join(__dirname, '../data/zarf_state_global.txt');
const GROUP_ZARF_FILE = path.join(__dirname, '../data/zarf_state_groups.json');
const OLD_ZARF_FILE = path.join(__dirname, '../data/zarf_state.json');

if (!fs.existsSync(GLOBAL_ZARF_FILE)) fs.writeFileSync(GLOBAL_ZARF_FILE, '[off]');
if (!fs.existsSync(GROUP_ZARF_FILE)) fs.writeFileSync(GROUP_ZARF_FILE, '{}');

function getZarfGlobalStatus() {
    return fs.readFileSync(GLOBAL_ZARF_FILE, 'utf8').trim();
}

function setZarfGlobalStatus(status) {
    fs.writeFileSync(GLOBAL_ZARF_FILE, `[${status}]`);
}

function getGroupZarfStatus(groupJid) {
    const groupData = JSON.parse(fs.readFileSync(GROUP_ZARF_FILE, 'utf8'));
    return groupData[groupJid] || null;
}

function setGroupZarfStatus(groupJid, status) {
    const groupData = JSON.parse(fs.readFileSync(GROUP_ZARF_FILE, 'utf8'));
    groupData[groupJid] = `[${status}]`;
    fs.writeFileSync(GROUP_ZARF_FILE, JSON.stringify(groupData, null, 2));
}

function deleteGroupZarfStatus(groupJid) {
    const groupData = JSON.parse(fs.readFileSync(GROUP_ZARF_FILE, 'utf8'));
    if (groupData[groupJid]) {
        delete groupData[groupJid];
        fs.writeFileSync(GROUP_ZARF_FILE, JSON.stringify(groupData, null, 2));
        return true;
    }
    return false;
}

function updateOldZarfFile() {
    const globalStatus = getZarfGlobalStatus();
    const isEnabled = globalStatus === '[on]';
    fs.writeFileSync(OLD_ZARF_FILE, JSON.stringify({ enabled: isEnabled }, null, 2));
}

async function getAllSpecialGroups(sock) {
    const groupData = JSON.parse(fs.readFileSync(GROUP_ZARF_FILE, 'utf8'));
    const specialGroups = [];
    
    for (const [groupJid, status] of Object.entries(groupData)) {
        if (status === '[on]' || status === '[off]') {
            let groupName = groupJid.split('@')[0];
            
            try {
                const groupInfo = await sock.groupMetadata(groupJid).catch(() => null);
                if (groupInfo && groupInfo.subject) {
                    groupName = groupInfo.subject;
                }
            } catch (err) {
            }
            
            specialGroups.push({
                groupJid,
                groupName,
                status: status === '[on]' ? '✅ مفعل' : '❌ معطل'
            });
        }
    }
    
    return specialGroups;
}

module.exports = {
    command: 'zarf',
    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = msg.key.participant || groupJid;
            const pure = String(sender).split('@')[0];
            const lid = pure + '@lid';

            const isAuthorized = hay.isFounder(lid) || hay.isOwnerbot(lid);
            
            if (!isAuthorized) {
                return;
            }

            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = body.trim().split(/\s+/).slice(1);

            const globalStatus = getZarfGlobalStatus();
            const groupStatus = getGroupZarfStatus(groupJid);
            
            const globalText = globalStatus === '[on]' ? '✅ مفعل' : '❌ معطل';
            const groupText = groupStatus === '[on]' ? '✅ مفعل' : groupStatus === '[off]' ? '❌ معطل' : '🌐 يتبع العام';

            if (!args[0]) {
                const helpText = `⚙️ *نظام التحكم بالزرف*\n\n📊 *الحالة الحالية:*\n▸ هذا القروب: ${groupText}\n▸ الوضع العام: ${globalText}\n\n⚡ *الأوامر:*\n• .zarf on - تشغيل لهذا القروب\n• .zarf off - إيقاف لهذا القروب\n• .zarf on تشغيل للكل - كل\n• .zarf off إيقاف للكل - كل\n• .zarf إزالة وضع القروب - حذف\n• .zarf عرض القروبات الخاصة - عرض`;

                await sock.sendMessage(groupJid, { text: helpText });
                return;
            }

            const action = args[0].toLowerCase();
            const applyAll = args[1] === 'كل';

            if (action === 'عرض') {
                const specialGroups = await getAllSpecialGroups(sock);
                
                if (specialGroups.length === 0) {
                    await sock.sendMessage(groupJid, {
                        text: `📋 *القروبات ذات الوضع الخاص*\n\n🔍 *النتيجة:* لا يوجد قروبات ذات وضع خاص\n📊 *الحالة:* جميع القروبات تتبع الوضع العام (${globalText})`
                    });
                    return;
                }
                
                let groupsText = '📋 *القروبات ذات الوضع الخاص*\n\n';
                
                specialGroups.forEach((group, index) => {
                    groupsText += `▸ *${index + 1}.* ${group.groupName}\n   ▸ الحالة: ${group.status}\n\n`;
                });
                
                groupsText += `📊 *الإحصائيات:*\n▸ العدد: ${specialGroups.length} قروب\n▸ الوضع العام: ${globalText}`;
                
                await sock.sendMessage(groupJid, { text: groupsText });
                return;
            }

            if (action === 'حذف') {
                if (deleteGroupZarfStatus(groupJid)) {
                    await sock.sendMessage(groupJid, 
                        { text: `✅ تم حذف وضع الزرف للقروب\n▸ الوضع: يتبع العام (${globalText})\n▸ تم بواسطة: ${hay.isFounder(lid) ? 'المؤسس' : 'الأونر بوت'}` }
                    );
                } else {
                    await sock.sendMessage(groupJid, 
                        { text: 'ℹ️ هذا القروب ليس له وضع خاص، وهو يتبع الوضع العام بالفعل.' }
                    );
                }
                updateOldZarfFile();
                await plugins.loadPlugins();
                return;
            }

            if (!['on', 'off', 'تشغيل', 'ايقاف'].includes(action)) {
                await sock.sendMessage(groupJid, 
                    { text: '❌ استخدم:\n.zarf on\n.zarf off\n.zarf on كل\n.zarf off كل' }
                );
                return;
            }

            const finalStatus = action === 'on' || action === 'تشغيل' ? 'on' : 'off';

            if (applyAll) {
                if (getZarfGlobalStatus() === `[${finalStatus}]`) {
                    await sock.sendMessage(groupJid, 
                        { text: `⚠️ الوضع العام *${finalStatus === 'on' ? 'مفعل' : 'معطل'}* بالفعل.` }
                    );
                    return;
                }
                
                setZarfGlobalStatus(finalStatus);
                updateOldZarfFile();
                await sock.sendMessage(groupJid, 
                    { text: `✅ *تم ${finalStatus === 'on' ? 'تشغيل' : 'إيقاف'} الزرف للكل*\n▸ الوضع: ${finalStatus === 'on' ? '✅ مفعل' : '❌ معطل'}\n▸ النطاق: كل القروبات\n▸ تم بواسطة: ${hay.isFounder(lid) ? 'المؤسس' : 'الأونر بوت'}` }
                );
            } else {
                const currentGroupStatus = getGroupZarfStatus(groupJid);
                if (currentGroupStatus === `[${finalStatus}]`) {
                    await sock.sendMessage(groupJid, 
                        { text: `⚠️ الزرف في هذه المجموعة *${finalStatus === 'on' ? 'مفعل' : 'معطل'}* بالفعل.` }
                    );
                    return;
                }
                
                setGroupZarfStatus(groupJid, finalStatus);
                await sock.sendMessage(groupJid, 
                    { text: `✅ *تم ${finalStatus === 'on' ? 'تشغيل' : 'إيقاف'} الزرف للقروب*\n▸ الوضع: ${finalStatus === 'on' ? '✅ مفعل' : '❌ معطل'}\n▸ النطاق: هذا القروب فقط\n▸ تم بواسطة: ${hay.isFounder(lid) ? 'المؤسس' : 'الأونر بوت'}` }
                );
            }

            await plugins.loadPlugins();

        } catch (err) {
            console.error('خطأ في أمر الزرف:', err);
        }
    }
};
