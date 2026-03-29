const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  command: 'زود-وقت',
  category: 'tools',
  description: '⏱ تعديل مدة عرض الفيديو أو الصوت',

  async execute(sock, msg) {
    try {

      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: '⚠️ رد على فيديو أو صوت واكتب: زود-وقت 10'
        }, { quoted: msg });
      }

      // ✅ نجيب نص الرسالة كامل
      const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      // ✅ نستخرج الرقم من النص
      const match = body.match(/\d+/);
      if (!match) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: '❌ اكتب عدد الثواني بشكل صحيح.'
        }, { quoted: msg });
      }

      const seconds = parseInt(match[0]);

      if (seconds <= 0) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: '❌ الرقم لازم يكون أكبر من صفر.'
        }, { quoted: msg });
      }

      const mimeType =
        quoted?.videoMessage?.mimetype ||
        quoted?.audioMessage?.mimetype;

      if (!mimeType) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: '⚠️ الأمر يعمل فقط على فيديو أو صوت.'
        }, { quoted: msg });
      }

      const type = Object.keys(quoted).find(k => k.endsWith('Message'));
      const stream = await downloadContentFromMessage(
        quoted[type],
        type.replace('Message', '')
      );

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const sizeLimit = 15 * 1024 * 1024;
      if (buffer.length > sizeLimit) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: '❌ الحد الأقصى 15MB.'
        }, { quoted: msg });
      }

      if (/^video/.test(mimeType)) {

        await sock.sendMessage(msg.key.remoteJid, {
          video: buffer,
          seconds: seconds,
          caption: `⏱ تم ضبط المدة إلى ${seconds} ثانية`
        }, { quoted: msg });

      } else if (/^audio/.test(mimeType)) {

        await sock.sendMessage(msg.key.remoteJid, {
          audio: buffer,
          mimetype: 'audio/mp4',
          seconds: seconds,
          ptt: false
        }, { quoted: msg });

      }

    } catch (err) {
      console.error('Duration Edit Error:', err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ حصل خطأ أثناء التنفيذ.'
      }, { quoted: msg });
    }
  }
};
