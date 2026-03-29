const { isElite, extractPureNumber } = require('../haykala/elite');

module.exports = {
  command: 'منشن',
  description: 'منشن مخفي – نص ثابت أو على رسالة مردود عليها',
  category: 'tools',

  async execute(sock, msg) {
    try {
      const groupJid = msg.key.remoteJid;
      const senderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
      const senderNumber = extractPureNumber(senderJid);

      // جروب فقط
      if (!groupJid.endsWith('@g.us')) {
        return sock.sendMessage(
          groupJid,
          { text: '❌ الأمر ده شغال في الجروبات بس.' },
          { quoted: msg }
        );
      }

      // نخبة فقط
      if (!isElite(senderNumber)) {
        return sock.sendMessage(
          groupJid,
          { text: '🚫 الأمر ده مخصص للنخبة فقط.' },
          { quoted: msg }
        );
      }

      // الأعضاء
      const metadata = await sock.groupMetadata(groupJid);
      const mentions = metadata.participants.map(p => p.id);

      // الكوت المتوثق
      const fakeQuoted = {
        key: {
          fromMe: false,
          remoteJid: 'status@broadcast',
          participant: '0@s.whatsapp.net',
          id: 'BAE5F1AA7B228B'
        },
        message: {
          videoMessage: {
            gifPlayback: true,
            caption: '֗  ๋࣭⋆˚𓂅𝐄𝐗𝐕𝐈𝐀𝐍𓏲֗  ๋࣭⋆˚',
            mimetype: 'video/mp4',
            url: 'https://media.tenor.com/GfSX-u7VGM4AAAAC/loading.gif'
          }
        }
      };

      // لو في رد على رسالة
      const ctx = msg.message?.extendedTextMessage?.contextInfo;
      if (ctx?.quotedMessage && ctx?.stanzaId) {
        const forwardMsg = {
          key: {
            remoteJid: groupJid,
            fromMe: false,
            id: ctx.stanzaId,
            participant: ctx.participant
          },
          message: ctx.quotedMessage
        };

        return sock.sendMessage(
          groupJid,
          {
            forward: forwardMsg,
            mentions
          },
          { quoted: fakeQuoted }
        );
      }

      // منشن عادي (بدون رد)
      return sock.sendMessage(
        groupJid,
        {
          text: '☆⏤͟͟͞͞ 𝑰 𝑺𝑬𝑬 𝒀𝑶𝑼⋆.𐙚 ˚',
          mentions
        },
        { quoted: fakeQuoted }
      );

    } catch (err) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ Error:\n${err.message || err.toString()}` },
        { quoted: msg }
      );
    }
  }
};
