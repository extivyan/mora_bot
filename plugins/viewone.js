const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
  command: 'ع',
  category: 'عام',
  description: 'عرض الصور والفيديوهات والصوتيات مع Forored من القناة',

  async execute(sock, msg, args = []) {
    try {
      if (!msg.message) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: 'لا يمكن العثور على محتوى الرسالة' },
          { quoted: msg }
        );
      }

      const messageType = Object.keys(msg.message)[0];

      if (
        messageType !== 'extendedTextMessage' ||
        !msg.message[messageType]?.contextInfo?.quotedMessage
      ) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: 'الرجاء الرد على رسالة بكتابة ع' },
          { quoted: msg }
        );
      }

      const quotedMessage =
        msg.message[messageType].contextInfo.quotedMessage;

      let targetMessage = quotedMessage;

      if (quotedMessage.viewOnceMessage) {
        targetMessage = quotedMessage.viewOnceMessage.message;
      }

      const mediaType = Object.keys(targetMessage)[0];

      if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(mediaType)) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: 'هذه الرسالة ليست صورة أو فيديو أو صوت' },
          { quoted: msg }
        );
      }

      const buffer = await downloadMediaMessage(
        {
          message: {
            [mediaType]: targetMessage[mediaType]
          }
        },
        'buffer',
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      );

      // 🔥 الإعداد المشترك للـ Forward من القناة
      const forwardContext = {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363426138973414@newsletter',
          newsletterName: ' ๋࣭⋆˚𓂅𝐄𝐗𝐕𝐈𝐀𝐍𓏲֗  ๋࣭⋆˚',
          serverMessageId: 970
        }
      };

      if (mediaType === 'imageMessage') {
        return sock.sendMessage(
          msg.key.remoteJid,
          {
            image: buffer,
            caption: targetMessage[mediaType].caption || '',
            contextInfo: forwardContext
          },
          { quoted: msg }
        );
      }

      if (mediaType === 'videoMessage') {
        return sock.sendMessage(
          msg.key.remoteJid,
          {
            video: buffer,
            caption: targetMessage[mediaType].caption || '',
            contextInfo: forwardContext
          },
          { quoted: msg }
        );
      }

      if (mediaType === 'audioMessage') {
        return sock.sendMessage(
          msg.key.remoteJid,
          {
            audio: buffer,
            mimetype: 'audio/mp4',
            contextInfo: forwardContext
          },
          { quoted: msg }
        );
      }

    } catch (error) {
      console.error('❌ ViewOnce Error:', error);

      return sock.sendMessage(
        msg.key.remoteJid,
        { text: 'عذراً، حدث خطأ أثناء معالجة الوسائط' },
        { quoted: msg }
      );
    }
  }
};
