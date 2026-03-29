const axios = require('axios');

module.exports = {
  command: 'اختصر',
  category: 'tools',
  description: '🔗 اختصار الروابط',

  async execute(sock, msg, opts) {
    try {
      // الحصول على النص (الرابط)
      const text = opts?.text || 
                   msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text || 
                   '';

      const url = text.replace(/^(\.|،)?اختصر\s*/i, '').trim();

      if (!url) {
        return sock.sendMessage(msg.key.remoteJid, { 
          text: '⚠️ يرجى كتابة الرابط بعد الأمر.' 
        }, { quoted: msg });
      }

      // إضافة اسم MORA مع رقم عشوائي لضمان عدم تكرار الرابط المحجوز
      const randomId = Math.floor(Math.random() * 9999);
      const alias = `MORA-${randomId}`; 

      // طلب الاختصار مع التخصيص
      const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}&alias=${alias}`);
      const shortUrl = response.data;

      await sock.sendMessage(msg.key.remoteJid, { 
        text: `🔗 تم اختصار الرابط:\n${shortUrl}` 
      }, { quoted: msg });

    } catch (err) {
      // إذا فشل بسبب أن الاسم محجوز، سنختصره بشكل عادي كحل احتياطي
      try {
        const fallback = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        return sock.sendMessage(msg.key.remoteJid, { 
          text: `🔗 تم الاختصار :\n${fallback.data}` 
        }, { quoted: msg });
      } catch (e) {
        return sock.sendMessage(msg.key.remoteJid, { 
          text: '❌ حدث خطأ في الرابط أو الخدمة.' 
        }, { quoted: msg });
      }
    }
  }
};
