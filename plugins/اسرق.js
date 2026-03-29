const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');

/**
 * توليد معرف فريد للملصق
 */
function generateStickerID() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * بناء بافر الـ EXIF للحقوق المطلوبة
 */
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
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ]);

  const exif = Buffer.concat([header, dataBuf]);
  exif.writeUIntLE(dataBuf.length, 14, 4);
  return exif;
}

/**
 * دمج الحقوق في ملف الويب بي (ثابت أو متحرك)
 */
async function addExifToWebp(webpBuffer, packname, author) {
  try {
    const img = new webp.Image();
    await img.load(webpBuffer);
    const id = generateStickerID();
    const exif = buildExifBuffer(packname, author, id);
    img.exif = exif;
    return await img.save(null);
  } catch (e) {
    console.error('Exif Error:', e);
    return webpBuffer; 
  }
}

module.exports = {
  command: 'اسرق',
  async execute(sock, m) {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    try {
      const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
      const args = text.split(/\s+/);
      const contextInfo = m.message?.extendedTextMessage?.contextInfo;
      const quoted = contextInfo?.quotedMessage;
      const sticker = quoted?.stickerMessage;

      // الحقوق المطلوبة بالضبط
      const PACK = '╭┄┄┄┄┄┄┄┄┄┄┄┄╮\n' +
                   '𝙽𝚊𝚖𝚎 : 𝑒𝑥𝑡𝑣𝑖𝑎𝑛 • 𝑏𝑜𝑡\n' +
                   '𓏲ִ𝚃𝙷𝙴 𝚂𝚃𝙸𝙲𝙺𝙴𝚁 ⊹₊˚𖥔⸼\n' +
                   '𝙾𝚠𝚗𝚎𝚛 : 𝑴𝑶𝑹𝑨 𝄢\n' +
                   '╰┄┄┄┄┄┄┄┄┄┄┄┄╯\n⏱︎';

      const AUTHOR = '⏱︎ \n' +
                     '╭┄┄┄┄┄┄┄┄┄┄┄┄╮\n' +
                     '꯭✿꯭᪲୭𓍢ִ  𝙱𝚈 →  🐉⸽⃕❬ 𝑒𝑥𝑡𝑣𝑖𝑎𝑛 • 𝑏𝑜𝑡 ❭ - 🧸🍃⃨፝⃕✰\n' +
                     '╰┄┄┄┄┄┄┄┄┄┄┄┄╯';

      if (!quoted || !sticker) {
        return await sock.sendMessage(m.key.remoteJid, { text: '❌ رد على ملصق (ثابت أو متحرك) لسرقته.' }, { quoted: m });
      }

      const stream = await downloadContentFromMessage(sticker, 'sticker');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      if (!buffer.length) {
        return await sock.sendMessage(m.key.remoteJid, { text: '❌ فشل تحميل الملصق.' }, { quoted: m });
      }

      const isTazbeet = args.some(arg => arg.includes('تظبيط'));

      if (isTazbeet) {
        const inputPath = path.join(tempDir, `in-${Date.now()}.webp`);
        const outputPath = path.join(tempDir, `out-${Date.now()}.webp`);
        fs.writeFileSync(inputPath, buffer);

        // تم إصلاح مسار FFmpeg وإعدادات الفريمات للمتحرك
        const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" -loop 0 -fps_mode vfr -c:v libwebp -lossless 0 -qscale 40 "${outputPath}"`;

        exec(ffmpegCmd, async (error) => {
          if (error) {
            console.error('FFmpeg Error:', error);
            const stickerWithExif = await addExifToWebp(buffer, PACK, AUTHOR);
            await sock.sendMessage(m.key.remoteJid, { sticker: stickerWithExif }, { quoted: m });
          } else {
            const processedBuffer = fs.readFileSync(outputPath);
            const stickerWithExif = await addExifToWebp(processedBuffer, PACK, AUTHOR);
            await sock.sendMessage(m.key.remoteJid, { sticker: stickerWithExif }, { quoted: m });
          }
          cleanupFiles(inputPath, outputPath);
        });

      } else {
        // الحقن المباشر للحقوق (يحافظ على الحركة الأصلية 100%)
        const stickerWithExif = await addExifToWebp(buffer, PACK, AUTHOR);
        await sock.sendMessage(m.key.remoteJid, { sticker: stickerWithExif }, { quoted: m });
      }

    } catch (err) {
      console.error('Global Error:', err);
      await sock.sendMessage(m.key.remoteJid, { text: '❌ حدث خطأ غير متوقع.' }, { quoted: m });
    }
  }
};

function cleanupFiles(...files) {
  files.forEach(f => {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
  });
}

