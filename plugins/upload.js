


const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const FormData = require('form-data');

module.exports = {
  command: 'ارفع',
  category: 'tools',
  description: '📤 رفع الملفات والحصول على رابط مباشر (Uguu)',

  async execute(sock, msg) {
    try {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const messageContent = quoted || msg.message;

      const mimeType =
        messageContent?.imageMessage?.mimetype ||
        messageContent?.videoMessage?.mimetype ||
        messageContent?.documentMessage?.mimetype ||
        messageContent?.audioMessage?.mimetype;

      if (!mimeType) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: '⚠️ لازم ترد على ملف وتكتب ارفع.'
        }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: '⏳ جاري تجهيز الملف للرفع...'
      }, { quoted: msg });

      const type = Object.keys(messageContent).find(k => k.endsWith('Message'));
      const stream = await downloadContentFromMessage(
        messageContent[type],
        type.replace('Message', '')
      );

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);

      if (sizeMB > 128) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: '❌ الحد الأقصى 128MB.'
        }, { quoted: msg });
      }

      const extension = mimeType.split('/')[1] || 'bin';

      const form = new FormData();
      form.append('files[]', buffer, {
        filename: `MORA_${Date.now()}.${extension}`
      });

      const response = await axios.post('https://uguu.se/upload.php', form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const fileUrl = response.data.files[0].url;

      await sock.sendMessage(msg.key.remoteJid, {
        text: `
✅ تم الرفع بنجاح

📦 الحجم: ${sizeMB} MB
🔗 الرابط:
${fileUrl}

> ⏱︎ 𝙱𝚈 →❬ 𝑒𝑥𝑡𝑣𝑖𝑎𝑛 • 𝑏𝑜𝑡 ❭
        `.trim()
      }, { quoted: msg });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ فشل الرفع. تأكد من الاتصال أو جرب شبكة مختلفة.'
      }, { quoted: msg });
    }
  }
};


