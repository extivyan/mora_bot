module.exports = {
  command: 'تست',
  description: 'رد فخامة بصورة موثقة ستايل واتساب',
  category: 'tools',

  async execute(sock, msg) {
    try {
      const decoratedText = `\`❖══⏣⊰ 𝑬𝑿𝑻𝑽𝑰𝑨𝑵 𝐵𝑂𝑇 ⊱⏣══❖\``;

      const fakeQuoted = {
        key: {
          fromMe: false,
          remoteJid: "status@broadcast",
          participant: "0@s.whatsapp.net",
          id: "BAE5F1AA7B228B"
        },
        message: {
          extendedTextMessage: {
            text: "𓆩𝑬𝑿𝑻𝑽𝑰𝑨𝑵 𝑯𝑬𝑹𝑬𓆪",
            contextInfo: {
              externalAdReply: {
                title: "واتساب",
                body: "رسالة موثقة تجريبية",
                mediaType: 1,
                thumbnailUrl: "https://i.postimg.cc/cLtbYGGJ/ef6b8d23b629d5f074579dee4b9e4c51.jpg",
                renderLargerThumbnail: true,
                showAdAttribution: true,
                sourceUrl: "https://chat.whatsapp.com/XXXX"
              }
            }
          }
        }
      };

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: decoratedText,
          contextInfo: {
            externalAdReply: {
              title: '𝑬𝑿𝑻𝑽𝑰𝑨𝑵_𝐵𝐎𝐓',
              body: ' ⚶ ⊹ 𝑬𝑿𝑻𝑽𝑰𝑨𝑵 𝄢 ⊹',
              mediaType: 1,
              thumbnailUrl: "https://i.postimg.cc/cLtbYGGJ/ef6b8d23b629d5f074579dee4b9e4c51.jpg",
              renderLargerThumbnail: true,
              sourceUrl: 'https://whatsapp.com/channel/0029Vb23NjZEVccPoPiccG10'
            }
          }
        },
        { quoted: fakeQuoted }
      );

    } catch (error) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `🔥 Error: ${error.message || error.toString()}` },
        { quoted: msg }
      );
    }
  }
};
