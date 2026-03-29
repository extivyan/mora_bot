// File: plugins/lens.js
// Feature: Pinterest Lens
// Developers: izana x radio (format by EXT)

const axios = require('axios');
const FormData = require('form-data');
const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  proto,
  downloadMediaMessage
} = require('@whiskeysockets/baileys');

async function uploadToCatbox(buffer) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', buffer, { filename: 'image.jpg' });

  const res = await axios.post(
    'https://catbox.moe/user/api.php',
    form,
    { headers: form.getHeaders() }
  );
  return res.data;
}

module.exports = {
  command: ['عدسة'],
  category: 'downloader',
  description: 'سيرش بنترست عن طريق الرد ع صوره',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    const quoted =
      msg.message &&
      msg.message.extendedTextMessage &&
      msg.message.extendedTextMessage.contextInfo &&
      msg.message.extendedTextMessage.contextInfo.quotedMessage;

    if (!quoted || !quoted.imageMessage) {
      return sock.sendMessage(
        chatId,
        { text: 'رد ع صوره الاول عشان اعمل سيرش عنها.' },
        { quoted: msg }
      );
    }

    try {
      await sock.sendMessage(
        chatId,
        { text: '> Searching image...' },
        { quoted: msg }
      );

      const buffer = await downloadMediaMessage(
        {
          message: quoted,
          key: msg.key
        },
        'buffer',
        {},
        {
          logger: sock.logger,
          reuploadRequest: sock.updateMediaMessage
        }
      );

      if (!buffer || !buffer.length) {
        throw new Error('> downloading failed ): ');
      }

      const imageUrl = await uploadToCatbox(buffer);

      const { data } = await axios.get(
        'https://blackwave-api.vercel.app/api/v1/search/pinlens?imageUrl=' +
          encodeURIComponent(imageUrl)
      );

      if (!data || !data.status || !data.results || !data.results.length) {
        return sock.sendMessage(
          chatId,
          { text: '> No results found ): .' },
          { quoted: msg }
        );
      }

      const results = data.results.slice(0, 5);
      const cards = [];

      async function makeImage(url) {
        const res = await generateWAMessageContent(
          { image: { url: url } },
          { upload: sock.waUploadToServer }
        );
        return res.imageMessage;
      }

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (!r.image) continue;

        const caption =
          '> Result #' + (i + 1) + '\n' +
          '> Title: ' + (r.title || 'N/A') + '\n' +
          '> User: ' + ((r.pinner && r.pinner.username) || 'N/A') + '\n' +
          '> Board: ' + ((r.board && r.board.name) || 'N/A');

        cards.push({
          body: proto.Message.InteractiveMessage.Body.fromObject({
            text: caption
          }),
          header: proto.Message.InteractiveMessage.Header.fromObject({
            hasMediaAttachment: true,
            imageMessage: await makeImage(r.image)
          }),
          nativeFlowMessage:
            proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
              buttons: [
                {
                  name: 'cta_url',
                  buttonParamsJson: JSON.stringify({
                    display_text: 'Open on Pinterest',
                    url: r.pinLink || 'https://pinterest.com'
                  })
                }
              ]
            })
        });
      }

      const finalMsg = generateWAMessageFromContent(
        chatId,
        {
          viewOnceMessage: {
            message: {
              interactiveMessage:
                proto.Message.InteractiveMessage.fromObject({
                  body: { text: '> pinterest lens results.' },
                  carouselMessage: { cards: cards }
                })
            }
          }
        },
        { quoted: msg }
      );

      await sock.relayMessage(chatId, finalMsg.message, {
        messageId: finalMsg.key.id
      });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(
        chatId,
        { text: '> Error while processing image.' },
        { quoted: msg }
      );
    }
  }
};
