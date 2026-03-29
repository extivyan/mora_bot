const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  command: 'استيكر',
  description: 'تحويل صورة أو رد على صورة إلى ستيكر مع باك نيم.',
  category: 'إدارة',

  async execute(sock, m) {
    try {
      // نبحث عن الصورة في الرسالة نفسها أو في الرد
      const imageMsg = m.message?.imageMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

      if (!imageMsg) {
        return await sock.sendMessage(m.key.remoteJid, {
          text: '⚠️ أرسل صورة أو رد على صورة لتحويلها لملصق.'
        }, { quoted: m });
      }

      // تحميل الصورة
      const stream = await downloadContentFromMessage(imageMsg, 'image');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      if (!buffer.length) return sock.sendMessage(m.key.remoteJid, { text: '❌ فشل تحميل الصورة.' }, { quoted: m });

      const input = path.join(process.cwd(), `temp-${Date.now()}.jpg`);
      const output = path.join(process.cwd(), `sticker-${Date.now()}.webp`);
      fs.writeFileSync(input, buffer);

      // تحويل الصورة لستيكرف WebP مع باك نيم
      const packname = '𝐄𝐗𝐓𝐕𝐈𝐀𝐍 𝓋𝟹';
      exec(`ffmpeg -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease" -c:v libwebp -preset default -quality 100 -compression_level 6 -qscale 50 -metadata "sticker-pack=${packname}" "${output}"`, async (err) => {
        if (err) {
          console.error('FFmpeg error:', err);
          cleanupFiles([input, output]);
          return await sock.sendMessage(m.key.remoteJid, { text: '❌ خطأ أثناء تحويل الصورة.' }, { quoted: m });
        }

        try {
          const webpBuffer = fs.readFileSync(output);
          await sock.sendMessage(m.key.remoteJid, { sticker: webpBuffer }, { quoted: m });
        } catch (sendErr) {
          console.error('Send sticker error:', sendErr);
          await sock.sendMessage(m.key.remoteJid, { text: '❌ خطأ أثناء إرسال الملصق.' }, { quoted: m });
        } finally {
          cleanupFiles([input, output]);
        }
      });

    } catch (error) {
      console.error('Processing error:', error);
      await sock.sendMessage(m.key.remoteJid, { text: '❌ حدث خطأ أثناء المعالجة.' }, { quoted: m });
    }
  }
};

// تنظيف الملفات بعد الاستخدام
function cleanupFiles(files) {
  for (const f of files) {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { console.error('Cleanup error:', e); }
  }
}
