const fs = require('fs');
const { join } = require('path');
const { isFounder, isOwnerbot, isDeveloper } = require('../haykala/developer.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

// تخزين الفخاخ النشطة
const activeTraps = new Map();

module.exports = {
    command: 'فخ',
    usage: '.فخ [ايقاف]',
    async execute(sock, msg, args) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = decode(msg.key.participant || groupJid);

            // التحقق من الصلاحيات مع المطور والمؤسس والمالك
            if (!isFounder(sender) && !isOwnerbot(sender) && !isDeveloper(sender)) {
                return await sock.sendMessage(groupJid, { 
                    text: '❌ ما عندك صلاحية تستخدم هالأمر.' 
                }, { quoted: msg });
            }

            if (!groupJid.endsWith('@g.us'))
                return await sock.sendMessage(groupJid, { 
                    text: '❗ هالأمر يشتغل بس جوة القروبات.' 
                }, { quoted: msg });

            // حالة إيقاف الفخ
            if (args[0] === 'ايقاف') {
                const trap = activeTraps.get(groupJid);
                if (trap) {
                    clearInterval(trap.intervalId);
                    activeTraps.delete(groupJid);
                    return await sock.sendMessage(groupJid, { 
                        text: '✅ تم إيقاف الفخ بنجاح.' 
                    }, { quoted: msg });
                } else {
                    return await sock.sendMessage(groupJid, { 
                        text: '❌ ما في فخ نشط عشان أوقفه.' 
                    }, { quoted: msg });
                }
            }

            const zarfData = JSON.parse(fs.readFileSync(join(process.cwd(), 'zarf.json')));
            const groupMetadata = await sock.groupMetadata(groupJid);
            const founder = groupMetadata.owner?.replace('c.us', 's.whatsapp.net');

            if (!founder)
                return await sock.sendMessage(groupJid, { 
                    text: '❌ ما لقيت مؤسس القروب.' 
                }, { quoted: msg });

            // إذا فيه فخ نشط مسبقاً
            if (activeTraps.has(groupJid)) {
                return await sock.sendMessage(groupJid, { 
                    text: '⚠️ فيه فخ نشط بالفعل. استخدم `.فخ ايقاف` لإيقافه أولاً.' 
                }, { quoted: msg });
            }

            // ردود بالعامية
            const trapMessages = [
                'فينك؟',
                'رد علينا شوي',
                'شايف ايش قاعد يصير؟',
                'يلا رد بسرعة',
                'بتكتب ولا لا؟'
            ];
            let index = 0;
            let trapTriggered = false;

            await sock.sendMessage(groupJid, { 
                text: '✅ تمام، الفخ جاهز والمراقبة شغالة.\n\nاستخدم `.فخ ايقاف` لإيقاف الفخ.' 
            }, { quoted: msg });

            const intervalId = setInterval(async () => {
                if (trapTriggered || !activeTraps.has(groupJid)) {
                    clearInterval(intervalId);
                    return;
                }
                try {
                    await sock.sendMessage(founder, { text: trapMessages[index] });
                    index = (index + 1) % trapMessages.length;
                } catch (err) {
                    console.error('خطأ أثناء إرسال الرسائل:', err);
                    clearInterval(intervalId);
                    activeTraps.delete(groupJid);
                }
            }, 2000);

            // حفظ الفخ النشط
            activeTraps.set(groupJid, {
                intervalId,
                founder,
                groupJid
            });

            // معالج الرسائل للفخ
            const messageHandler = async (chatUpdate) => {
                try {
                    const newMsg = chatUpdate.messages[0];
                    if (!newMsg?.key?.remoteJid || trapTriggered || !activeTraps.has(groupJid)) return;

                    const fromJid = newMsg.key.remoteJid;
                    const hasText = newMsg.message?.conversation?.trim() || 
                                   newMsg.message?.extendedTextMessage?.text?.trim();

                    if (fromJid === founder && hasText) {
                        trapTriggered = true;
                        clearInterval(intervalId);
                        activeTraps.delete(groupJid);

                        console.log(`تم اصطياد المؤسس: ${founder}`);

                        // إزالة المعالج بعد التنفيذ
                        sock.ev.off('messages.upsert', messageHandler);

                        // رسالة القروب النهائية بالعامية
                        const finalMsg = zarfData?.messages?.final || 
                            `🎯 المؤسس وقع في الفخ \n🔥 تم طرد جميع الأعضاء ما عدا المطور والمؤسس والمالك\n\n⚡ الحقوق محفوظة لـ FHS`;
                        
                        await sock.sendMessage(groupJid, { text: finalMsg }).catch(() => {});

                        const botNumber = decode(sock.user.id);

                        // طرد كل من ليس من المطور والمؤسس والمالك
                        const toKick = groupMetadata.participants
                            .filter(p => {
                                const participantJid = decode(p.id);
                                return p.id !== botNumber && 
                                       !isFounder(participantJid) && 
                                       !isOwnerbot(participantJid) && 
                                       !isDeveloper(participantJid);
                            })
                            .map(p => p.id);

                        if (toKick.length > 0) {
                            await sleep(500);
                            await sock.groupParticipantsUpdate(groupJid, toKick, 'remove').catch(() => {});
                        }
                    }
                } catch (err) {
                    console.error('خطأ أثناء مراقبة رد المؤسس:', err);
                }
            };

            // إضافة المعالج للأحداث
            sock.ev.on('messages.upsert', messageHandler);

            // تنظيف تلقائي بعد 10 دقائق
            setTimeout(() => {
                if (activeTraps.has(groupJid)) {
                    clearInterval(intervalId);
                    activeTraps.delete(groupJid);
                    sock.ev.off('messages.upsert', messageHandler);
                    sock.sendMessage(groupJid, { 
                        text: '⏰ انتهى وقت الفخ تلقائياً بعد 10 دقائق.' 
                    }).catch(() => {});
                }
            }, 10 * 60 * 1000);

        } catch (error) {
            console.error('خطأ أثناء تنفيذ أمر الفخ:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ صار خطأ أثناء تنفيذ الفخ:\n\n${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};