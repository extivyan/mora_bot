const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

module.exports = {
  command: "صوره",
  description: "تغيير صورة المجموعة.",
  usage: ".صوره (قم بالرد على صورة)",
  category: 'tools',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;

    try {
      if (!chatId.endsWith('@g.us')) {
        return await sock.sendMessage(chatId, { text: "❌ هذا الأمر للمجموعات فقط." }, { quoted: msg });
      }

      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const isImage = msg.message?.imageMessage || quoted?.imageMessage;

      if (!isImage) {
        return await sock.sendMessage(chatId, { text: "❌ يرجى الرد على صورة لتغيير صورة المجموعة." }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { text: "⏳ جاري تحديث الصوره..." }, { quoted: msg });

      // تحميل الصورة من واتساب
      const messageContent = msg.message?.imageMessage || quoted?.imageMessage;
      const stream = await downloadContentFromMessage(messageContent, 'image');
      const tempDir = '/data/data/com.termux/files/home/downloads';
      const tempPath = path.join(tempDir, `wa_pic_${Date.now()}.jpg`);
      const processedPath = path.join(tempDir, `wa_pic_processed_${Date.now()}.jpg`);
      const bufferArray = [];

      for await (const chunk of stream) bufferArray.push(chunk);
      fs.writeFileSync(tempPath, Buffer.concat(bufferArray));

      // معالجة الصورة باستخدام ImageMagick
      await new Promise((resolve, reject) => {
        exec(`convert "${tempPath}" -resize 640x640 "${processedPath}"`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const processedImage = fs.readFileSync(processedPath);

      // إرسال طلب التحديث للسيرفر
      await sock.query({
        tag: 'iq',
        attrs: {
          target: chatId,
          to: '@s.whatsapp.net',
          type: 'set',
          xmlns: 'w:profile:picture'
        },
        content: [
          {
            tag: 'picture',
            attrs: { type: 'image' },
            content: processedImage
          }
        ]
      });

      await sock.sendMessage(chatId, { text: "✅ تم تحديث صورة المجموعة بنجاح" }, { quoted: msg });

      // تنظيف الملفات المؤقتة
      fs.unlinkSync(tempPath);
      fs.unlinkSync(processedPath);

    } catch (error) {
      console.log('✗ Error in Profile Picture Command:', error.message || error);

      let errorMsg = "❌ فشل التحديث.";
      if (error.message && (error.message.includes('not-authorized') || error.status === 403)) {
        errorMsg = "❌ تأكد من أنني مشرف (Admin) في المجموعة.";
      }

      await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
    }
  }
};
