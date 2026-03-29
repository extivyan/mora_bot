// plugins/mentionall.js

module.exports = {
  command: '@',
  description: 'منشن جماعي',
  category: 'tools', 
 group: true,

  async execute(sock, msg) {
    const chat = msg.key.remoteJid;

    try {
      const metadata = await sock.groupMetadata(chat);
      const participants = metadata.participants;

      if (!participants || participants.length === 0) {
        return sock.sendMessage(chat, { text: 'الجروب فاضي يا معلم 😅' });
      }

      // تكوين الرسالة
      let text = '';
      const mentions = [];

      participants.forEach(p => {
        const username = p.id.split('@')[0];
        text += `🦇↬ @${username}\n`;
        mentions.push(p.id);
      });

      await sock.sendMessage(chat, {
        text,
        mentions
      });

    } catch (err) {
      await sock.sendMessage(chat, {
        text: '⚠️ حصل خطأ في المنشن، جرّب تاني'
      });
    }
  }
};
