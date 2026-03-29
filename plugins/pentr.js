// File: plugins/pinterest.js
// Feature: Pinterest Image Carousel
// Developers: Omar Nagy (formatted by EXT style)

const axios = require('axios');
const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  proto
} = require('@whiskeysockets/baileys');

module.exports = {
  command: 'بينتر',
  category: 'tools',
  description: 'بحث صور Pinterest',

  async execute(sock, m) {
    const chatId = m.key.remoteJid;
    const prefix = '.';
    const commandName = 'بينتر';

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      '';

    let bodyText = text.replace(prefix + commandName, '').trim();
    if (!bodyText) {
      return sock.sendMessage(chatId, {
        text: `⚠️ مثال:\n${prefix}${commandName} لوفاي | 5`
      }, { quoted: m });
    }

    let [query, count] = bodyText.split('|').map(v => v.trim());
    count = count ? parseInt(count) : 5;
    if (count > 10) count = 10;
    if (count < 1) count = 5;

    try {
      // 🎬 React أول ما الأمر يشتغل
      await sock.sendMessage(chatId, { react: { text: '⌛', key: m.key } });

      // رسالة البحث
      await sock.sendMessage(chatId, {
        text: `> 🖼 Searching ${count} images for: ${query}`
      }, { quoted: m });

      // ===== استدعاء API =====
      let results = [];
      try {
        const res = await axios.get(
          `http://www.emam-api.web.id/home/sections/Search/api/api/pinterest/image?query=${encodeURIComponent(query)}`
        );
        results = res.data?.result || [];
      } catch {}

      if (!results.length) {
        try {
          const res2 = await axios.get(
            `https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`
          );
          results = res2.data?.data || [];
        } catch {}
      }

      if (!results.length) {
        await sock.sendMessage(chatId, { react: { text: '❌', key: m.key } });
        return sock.sendMessage(chatId, {
          text: `> ❌ لا توجد نتائج لـ: "${query}".`
        }, { quoted: m });
      }

      const selected = results.sort(() => 0.5 - Math.random()).slice(0, count);

      async function makeImage(url) {
        const { imageMessage } = await generateWAMessageContent(
          { image: { url } },
          { upload: sock.waUploadToServer }
        );
        return imageMessage;
      }

      const cards = [];
      for (let i = 0; i < selected.length; i++) {
        const item = selected[i];
        const imageUrl = item.image_url || item;
        const pinUrl = item.pin || item;

        cards.push({
          body: proto.Message.InteractiveMessage.Body.fromObject({
            text: `> 🔎 ${query}\n> 📸 Result #${i + 1}/${count}`
          }),
          header: proto.Message.InteractiveMessage.Header.fromObject({
            hasMediaAttachment: true,
            imageMessage: await makeImage(imageUrl)
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [
              {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                  display_text: 'Open on Pinterest',
                  url: pinUrl
                })
              }
            ]
          })
        });
      }

      // ===== إرسال Carousel =====
      const finalMsg = generateWAMessageFromContent(chatId, {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
              body: { text: `> ✨ Pinterest Results\n> 🔎 Query: ${query}\n> 📦 Count: ${selected.length}` },
              carouselMessage: { cards }
            })
          }
        }
      }, { quoted: m });

      await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
      await sock.relayMessage(chatId, finalMsg.message, { messageId: finalMsg.key.id });

    } catch (err) {
      console.error('> Pinterest Carousel Error:', err.message);
      await sock.sendMessage(chatId, { text: '> ❌ حدث خطأ أثناء جلب الصور.' }, { quoted: m });
    }
  }
};
