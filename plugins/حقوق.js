const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');

function generateStickerID() {
  return crypto.randomBytes(16).toString('hex');
}

function buildExifBuffer(packname, author, id, emojis = ['✨']) {
  const raw = {
    'sticker-pack-id': id,
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    emojis
  };
  const data = JSON.stringify(raw);
  const dataBuf = Buffer.from(data, 'utf8');
  const header = Buffer.from([
    0x49,0x49,0x2a,0x00,0x08,0x00,0x00,0x00,
    0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,
    0x00,0x00,0x16,0x00,0x00,0x00
  ]);

  const exif = Buffer.concat([header, dataBuf]);
  exif.writeUIntLE(dataBuf.length, 14, 4);
  return exif;
}

async function addExifToWebp(webpBuffer, packname, author) {
  const img = new webp.Image();
  await img.load(webpBuffer);
  const id = generateStickerID();
  const exif = buildExifBuffer(packname, author, id);
  img.exif = exif;
  return await img.save(null);
}

module.exports = {
  command: 'حقوقي,
  async execute(sock, m) {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    try {
      const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
      const args = text.trim().split(/\s+/);

      const contextInfo = m.message?.extendedTextMessage?.contextInfo;
      const quoted = contextInfo?.quotedMessage;
      const sticker = quoted?.stickerMessage;

      if (args[0] === '.حقوقي' && !quoted) {
        const menu = '📌 **أوامر تعديل الملصق:**\n' +
                     '━━━━━━━━━━━━━━━━━━\n' +
                     '🔧 `.حقوقي`\n' +
                     '   ╰ يغير حقوق الملصق\n\n' +
                     '🔧 `.حقوقي نص`\n' +
                     '   ╰ يغير الحقوق للنص المطلوب\n\n' +
                     '📐 `.حقوقي تظبيط`\n' +
                     '   ╰ يضبط الملصق للمقاس\n\n' +
                     '📐 `.حقوقي تظبيط نص`\n' +
                     '   ╰ يضبط مع حقوق جديدة';
        return await sock.sendMessage(m.key.remoteJid, { text: menu }, { quoted: m });
      }

      if (!quoted || !sticker) {
        return await sock.sendMessage(m.key.remoteJid, { text: '❌ الرجاء الرد على ملصق' }, { quoted: m });
      }

      let rightsText = '';
      let isTazbeet = false;

      if (args.length > 1 && args[1] === 'تظبيط') {
        isTazbeet = true;
        rightsText = args.slice(2).join(' ');
      } else if (args.length > 1) {
        rightsText = args.slice(1).join(' ');
      }

      const stream = await downloadContentFromMessage(sticker, 'sticker');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      if (!buffer.length) {
        return await sock.sendMessage(m.key.remoteJid, { text: '❌ فشل تحميل الملصق' }, { quoted: m });
      }

      const inputPath = path.join(tempDir, `temp-input-${Date.now()}.webp`);
      const outputPath = path.join(tempDir, `temp-output-${Date.now()}.webp`);
      fs.writeFileSync(inputPath, buffer);

      const watermarkText = '';

      let ffmpegCmd = '';
      if (isTazbeet) {
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,drawtext=text='${watermarkText}':fontcolor=white:fontsize=35:x=w-text_w-10:y=h-text_h-10:shadowcolor=black:shadowx=2:shadowy=2:box=1:boxcolor=black@0.4:boxborderw=3" -c:v libwebp -preset default -an -lossless 0 -qscale 50 "${outputPath}"`;
      } else {
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vf "drawtext=text='${watermarkText}':fontcolor=white:fontsize=35:x=w-text_w-10:y=h-text_h-10:shadowcolor=black:shadowx=2:shadowy=2:box=1:boxcolor=black@0.4:boxborderw=3" -c:v libwebp -preset default -an -lossless 0 -qscale 50 "${outputPath}"`;
      }

      console.log('Running ffmpeg:', ffmpegCmd);

      exec(ffmpegCmd, async (error) => {
        if (error) {
          console.error('FFmpeg error:', error);
          try { fs.unlinkSync(inputPath); } catch(e) {}
          try { fs.unlinkSync(outputPath); } catch(e) {}
          return await sock.sendMessage(m.key.remoteJid, { text: '❌ خطأ في معالجة الملصق' }, { quoted: m });
        }

        if (!fs.existsSync(outputPath)) {
          try { fs.unlinkSync(inputPath); } catch(e) {}
          return await sock.sendMessage(m.key.remoteJid, { text: '❌ تعذر إنشاء الملصق' }, { quoted: m });
        }

        try {
          const webpBuffer = fs.readFileSync(outputPath);

          const PACK = '';

          const AUTHOR = '⏱︎ 𝙱𝚈 →❬ 𝑒𝑥𝑡𝑣𝑖𝑎𝑛 • 𝑏𝑜𝑡 ❭';

          const stickerBuffer = await addExifToWebp(webpBuffer, PACK, AUTHOR);
          await sock.sendMessage(m.key.remoteJid, { sticker: stickerBuffer }, { quoted: m });

        } catch (sendError) {
          console.error('Send error:', sendError);
          await sock.sendMessage(m.key.remoteJid, { text: '❌ خطأ في الإرسال' }, { quoted: m });
        } finally {
          try { fs.unlinkSync(inputPath); } catch(e) {}
          try { fs.unlinkSync(outputPath); } catch(e) {}
        }
      });

    } catch (err) {
      console.error('Unhandled error:', err);
      await sock.sendMessage(m.key.remoteJid, { text: ' ❌ خطأ غير متوقع' }, { quoted: m });
    }
  }
};
