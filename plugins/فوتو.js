const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

module.exports = {
  command: "فوتو", // أو "البروفايل"
  description: "تغيير صورة بروفايل البوت.",
  usage: ".فوتو (قم بالرد على صورة)",
  category: 'tools',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;

    try {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const messageContent = msg.message?.imageMessage || quoted?.imageMessage;

      if (!messageContent) {
        return await sock.sendMessage(chatId, { text: "❌ يرجى الرد على صورة لتغيير بروفايل البوت." }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { text: "⏳ جاري معالجة وتحديث الصورة..." }, { quoted: msg });

      // تحميل الصورة من واتساب
      const stream = await downloadContentFromMessage(messageContent, 'image');
      const tempDir = '/data/data/com.termux/files/home/downloads';
      const tempPath = path.join(tempDir, `profile_${Date.now()}.jpg`);
      const processedPath = path.join(tempDir, `profile_done_${Date.now()}.jpg`);
      
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      fs.writeFileSync(tempPath, Buffer.concat(chunks));

      // معالجة الصورة باستخدام ImageMagick (تغيير الحجم والقص لتصبح مربعة 640x640)
      await new Promise((resolve, reject) => {
        // الخيار -resize مع ^ و -gravity center يضمن أن الصورة ستكون مربعة تماماً
        exec(`convert "${tempPath}" -resize "640x640^" -gravity center -extent 640x640 "${processedPath}"`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const processedImage = fs.readFileSync(processedPath);

      // تحديث صورة البروفايل (للبوت نفسه)
      await sock.query({
        tag: 'iq',
        attrs: {
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

      await sock.sendMessage(chatId, { text: "✅ تم تحديث صورة بروفايل البوت بنجاح!" }, { quoted: msg });

      // تنظيف الملفات
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);

    } catch (error) {
      console.error('Error:', error);
      await sock.sendMessage(chatId, { text: "❌ حدث خطأ أثناء تحديث الصورة. تأكد من تثبيت imagemagick." }, { quoted: msg });
    }
  }
};

