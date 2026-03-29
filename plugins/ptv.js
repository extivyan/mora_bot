// ملف: plugins/ptv.js

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['ptv'],
    category: 'fun',
    description: 'يرسل الفيديو الدائري.',

    async execute(sock, msg, args) {
        const remoteJid = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // التحقق من وجود فيديو في الرد
        const videoMessage = quoted?.videoMessage || quoted?.documentWithCaptionMessage?.message?.videoMessage;

        // مسار الحفظ الثابت
        const mediaDir = path.join(process.cwd(), 'media');
        const filePath = path.join(mediaDir, 'video.mp4');

        // التأكد من وجود مجلد media
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }

        try {
            if (videoMessage) {
                // --- الحالة 1: المستخدم رد على فيديو جديد لتعيينه كافتراضي ---
                await sock.sendMessage(remoteJid, { text: '⏳ جاري تحميل وحفظ الفيديو الجديد كافتراضي...' }, { quoted: msg });
                
                const stream = await downloadContentFromMessage(videoMessage, 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                // حفظ الملف الجديد ومسح القديم تلقائياً
                fs.writeFileSync(filePath, buffer);

                return await sock.sendMessage(remoteJid, { 
                    text: '✅ تم تحديث الفيديو الافتراضي بنجاح!' 
                }, { quoted: msg });

            } else {
                // --- الحالة 2: إرسال الفيديو المحفوظ حالياً ---
                if (!fs.existsSync(filePath)) {
                    return sock.sendMessage(remoteJid, { 
                        text: '❌ لا يوجد فيديو محفوظ حالياً. قم بالرد على أي فيديو بـ `.ptv` لحفظه.' 
                    }, { quoted: msg });
                }

                const fileBuffer = fs.readFileSync(filePath);

                await sock.sendMessage(
                    remoteJid,
                    {
                        video: fileBuffer,
                        mimetype: 'video/mp4',
                        ptv: true
                    },
                    { quoted: msg }
                );
            }

        } catch (err) {
            console.error('Error in PTV save/send:', err);
            await sock.sendMessage(remoteJid, { text: '❌ حدث خطأ أثناء المعالجة.' }, { quoted: msg });
        }
    }
};

