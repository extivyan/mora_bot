module.exports = {
  command: 'قول',
  category: 'fun',
  description: '📢 يعيد الكلام الذي كتبه المستخدم بنفس الزخرفة',

  async execute(sock, msg, opts) {
    try {
      // قراءة النص من opts أو مباشرة من الرسالة
      const text = opts?.text ||
                   msg.message?.conversation ||
                   msg.message?.extendedTextMessage?.text ||
                   '';

      if (!text) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: '*_~╻🍷.╹↵ ⚠️ الرجاء كتابة شيء بعد الأمر .قول ╻🫦.╹↵~_*' },
          { quoted: msg }
        );
      }

      // إزالة الأمر من النص لو موجود
      const cleanText = text.replace(/^(\.|،)?قول\s*/i, '').trim();

      if (!cleanText) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: '*_~╻🍷.╹↵ ⚠️ الرجاء كتابة شيء بعد الأمر .قول ╻🫦.╹↵~_*' },
          { quoted: msg }
        );
      }

      // الرد بالنص بين الزخرفة نفسها
      const decorated = `*_~╻🍷.╹↵ ${cleanText} ╻🫦.╹↵~_*`;

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: decorated },
        { quoted: msg }
      );

    } catch (err) {
      console.error('❌ خطأ في قول handler:', err);
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `*_~╻🍷.╹↵ ❌ خطأ غير متوقع: ${err.message || err.toString()} ╻🫦.╹↵~_*` },
        { quoted: msg }
      );
    }
  }
};
