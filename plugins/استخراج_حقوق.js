const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const WebP = require('node-webpmux');

module.exports = {
    command: 'حقوق',
    description: 'استخراج اسم الحزمة والمؤلف من الملصق',
    usage: '.حقوق (رد على ملصق)',
    category: 'TOOLS',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMsg || !quotedMsg.stickerMessage) {
                return await sock.sendMessage(groupJid, { text: '⚠️ رد على ملصق لاستخراج حقوقه!' }, { quoted: msg });
            }

            // 1. تحميل الملصق كـ Buffer
            const stream = await downloadContentFromMessage(quotedMsg.stickerMessage, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. فك تشفير بيانات الـ WebP
            const img = new WebP.Image();
            await img.load(buffer);
            
            // استخراج الـ EXIF (حيث توجد الحقوق)
            const exifData = img.exif ? img.exif.toString('utf-8') : null;
            
            let pack = "غير معروف";
            let author = "غير معروف";

            if (exifData) {
                // البحث عن نصوص داخل الـ Exif (واتساب يخزنها بصيغة JSON مخفية)
                try {
                    const jsonStr = exifData.substring(exifData.indexOf('{'), exifData.lastIndexOf('}') + 1);
                    const meta = JSON.parse(jsonStr);
                    pack = meta['sticker-pack-name'] || "غير معروف";
                    author = meta['sticker-pack-publisher'] || "غير معروف";
                } catch (e) {
                    // محاولة استخراج يدوية إذا فشل الـ JSON
                    pack = exifData.match(/sticker-pack-name(.*?)/)?.[1] || "غير معروف";
                    author = exifData.match(/sticker-pack-publisher(.*?)/)?.[1] || "غير معروف";
                }
            }

            // 3. إرسال النتيجة
            const resultText = `> ╭─── [ 🏷️ حقوق الملصق ] ───╮
> 📦 الحزمة: *${pack}*
> 👤 المؤلف: *${author}*
> ╰────────────────────╯`;

            await sock.sendMessage(groupJid, { text: resultText }, { quoted: msg });

        } catch (error) {
            console.error(error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ فشل استخراج الحقوق، قد لا يحتوي الملصق على بيانات وصفية.' }, { quoted: msg });
        }
    }
};