const fs = require('fs');
const { isFounder, isOwnerbot, isDeveloper } = require('../haykala/developer.js');
const { join } = require('path');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
    command: 'انزلو',
    usage: '.انزلو',
    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = decode(msg.key.participant || groupJid);
            
            // التحقق من الصلاحيات مع المطور والمؤسس والمالك
            if (!isFounder(sender) && !isOwnerbot(sender) && !isDeveloper(sender)) {
                await sock.sendMessage(groupJid, {
                    text: '❌ هذا الأمر مخصص للمطور والمؤسس والمالك فقط!'
                }, { quoted: msg });
                return;
            }

            if (!groupJid.endsWith('@g.us'))
                return await sock.sendMessage(groupJid, { 
                    text: '❗ هذا الأمر يعمل فقط داخل *المجموعات*.' 
                }, { quoted: msg });

            const groupMetadata = await sock.groupMetadata(groupJid);
            const botNumber = decode(sock.user.id);

            const adminsToDemote = groupMetadata.participants
                .filter(p =>
                    p.admin &&
                    decode(p.id) !== sender &&
                    decode(p.id) !== botNumber
                )
                .map(p => p.id);

            if (adminsToDemote.length === 0) {
                return await sock.sendMessage(groupJid, { 
                    text: '✅ لا يوجد مشرفين آخرين ليتم تنزيلهم.' 
                }, { quoted: msg });
            }

            await sock.groupParticipantsUpdate(groupJid, adminsToDemote, 'demote').catch(() => {});
            
            // رسالة فخمة بعد التنزيل
            const msgText = `
┏━━━━━━━━━━━━━━━━━━┓
┃   ⚠️✨ *تنزيل إدمنز* ✨⚠️
┗━━━━━━━━━━━━━━━━━━┛

🧨 تم *سحب الرتبة* من الجميع  
👑 الملك موجود هنا ولا منافس 👑  

━━━━━━━━━━━━━━━━━━━
⚡ الحقوق محفوظة لـ *FHS* ⚡
            `;

            await sock.sendMessage(groupJid, { text: msgText }, { quoted: msg });

        } catch (error) {
            console.error('❌ خطأ في أمر انزلو:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ أثناء تنفيذ الأمر:\n\n${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};