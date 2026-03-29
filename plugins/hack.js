const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid => (jidDecode(jid)?.user || jid?.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
    command: ['تهكير'],
    usage: '.تهكير [منشن | رقم | رد]',
    async execute(sock, msg, args) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = decode(msg.key.participant || msg.key.remoteJid);
            let targetJid;

            const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
            const mentionedJid = contextInfo.mentionedJid;
            const quotedParticipant = contextInfo.participant;

            // التحقق من إذا كان المستهدف هو المطور - نفس نظام أمر اخرج
            const devID = '8856507793595@s.whatsapp.net';

            if (Array.isArray(mentionedJid) && mentionedJid.length > 0) {
                targetJid = mentionedJid[0];
            } else if (args?.[0]) {
                const cleaned = args[0].replace(/\D/g, '');
                if (!cleaned) throw new Error('❌ لم يتم تحديد رقم صحيح.');
                targetJid = `${cleaned}@s.whatsapp.net`;
            } else if (quotedParticipant) {
                targetJid = decode(quotedParticipant);
            } else {
                targetJid = sender;
            }

            // منع تهكير المطور - نفس نظام أمر اخرج
            if (targetJid === devID) {
                await sock.sendMessage(groupJid, {
                    text: '❌ *ممنوع تهكير المطور* 🛡️\nلا يمكن تهكير المطور الأساسي!'
                }, { quoted: msg });
                return;
            }

            const number = targetJid.split('@')[0];
            
            // الحصول على معلومات المستخدم
            const targetUser = await sock.onWhatsApp(targetJid);
            const targetName = targetUser[0]?.exists ? targetUser[0].jid.split('@')[0] : number;

            // الرسالة الأولى مع منشن
            const startMsg = `💣 *سيتم تهكير*`;
            await sock.sendMessage(groupJid, { 
                text: startMsg,
                mentions: [targetJid]
            }, { quoted: msg });

            // مراحل التحميل
            const loadingStages = [
                "*جاري الاختراق* 📡",
                "*جاري تحميل الاختراق* 《 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒》0%",
                "*جاري تحميل الصور* 《 █▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒》10%",
                "*تم تحميل الصور* 《 ██▒▒▒▒▒▒▒▒▒▒▒▒▒▒》20%", 
                "*جاري تحميل الفيديوهات* 《 ███▒▒▒▒▒▒▒▒▒▒▒▒▒》30%",
                "*تم تحميل الفيديوهات* 《 ████▒▒▒▒▒▒▒▒▒▒▒▒》40%",
                "*جاري تحميل الاصوات* 《 █████▒▒▒▒▒▒▒▒▒▒▒》50%",
                "*تم تحميل الاصوات* 《 ██████▒▒▒▒▒▒▒▒▒▒》60%",
                "*جاري تحميل الملفات* 《 ███████▒▒▒▒▒▒▒▒▒》70%",
                "*تم تحميل الملفات* 《 ████████▒▒▒▒▒▒▒▒》80%",
                "*جاري تحميل محادثات الواتساب* 《 █████████▒▒▒▒▒▒▒》90%",
                "*تم تحميل المحادثات* 《 ███████████▒▒▒▒▒》92%",
                "*يتم تحميل الاختراق جاري رفع الاختراق علي السيرفر* 《 ███████████▒▒▒▒▒》95%",
                "*تم الاتصال بجهاز الضحيه يتم تحميل البيانات* 《 ███████████▒▒▒▒▒》96%",
                "*اختراق الضحيه 100% اكتمل جاري جمع جميع الادله* 《 ████████████▒▒▒▒▒》97%", 
                "*اكتمل الاختراق* ✅ 《 ████████████████》100%",
                "*جاري حفظ بيانات الضحيه* ⌛",
                "*تم حفظ بيانات الضحيه بنجاح* ✅"
            ];

            // إرسال رسالة التحميل الأولى
            let progressMsg = await sock.sendMessage(groupJid, { 
                text: loadingStages[0] 
            });

            // تحديث مراحل التحميل بنفس الرسالة
            for (let i = 1; i < loadingStages.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                await sock.sendMessage(groupJid, { 
                    text: loadingStages[i],
                    edit: progressMsg.key
                });
            }

            // الانتظار قليلاً قبل الرسالة النهائية
            await new Promise(resolve => setTimeout(resolve, 1000));

            // الرسالة النهائية مع منشن
            const finalResponse = 
                "━━━━━━━⬣ *👾* ⬣━━━━━━━\n" +
                `> *تم اختراقك بنجاح* ✅\n` +
                `> تم اختراقك بواسطة عمك — تم سحب ملفاتك وبياناتك ورفعها للسيرفر.\n\n` +
                `> *❥ بوت 𝐄𝐗𝐓𝐕𝐈𝐀𝐍*\n` +
                "━━━━━━━⬣ *👾* ⬣━━━━━━━\n" +
                "© 𝐄𝐗𝐓𝐕𝐈𝐀𝐍 — جميع الحقوق محفوظة.";

            await sock.sendMessage(groupJid, { 
                text: finalResponse,
                mentions: [targetJid]
            }, { quoted: msg });

        } catch (error) {
            console.error('✗ خطأ في أمر التهكير:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ أثناء التهكير:\n${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};
