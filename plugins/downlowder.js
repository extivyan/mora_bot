const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  command: 'تحميل',
  category: 'download',
  description: 'تحميل فيديو أو صوت من تيك توك',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      "";

    // 🧠 تقسيم الأمر
    let type = 'video';
    let text = body;

    if (body.startsWith('.تحميل صوت')) {
      type = 'audio';
      text = body.replace('.تحميل صوت', '').trim();
    } else if (body.startsWith('.تحميل فيديو')) {
      type = 'video';
      text = body.replace('.تحميل فيديو', '').trim();
    } else if (body.startsWith('.تحميل')) {
      type = 'video';
      text = body.replace('.تحميل', '').trim();
    }

    const tiktokRegex = /https?:\/\/(www\.)?(vm|vt|m)?\.?tiktok\.com\/[^\s]+/i;
    const match = text.match(tiktokRegex);

    if (!match) {
      return sock.sendMessage(
        chatId,
        {
          text:
            '❌ حط رابط تيك توك صحيح\n\n' +
            'أمثلة:\n' +
            '.تحميل https://vm.tiktok.com/xxx\n' +
            '.تحميل فيديو https://vm.tiktok.com/xxx\n' +
            '.تحميل صوت https://vm.tiktok.com/xxx'
        },
        { quoted: msg }
      );
    }

    const reactKey = msg.key;

    // ⏳ رياكت البداية
    await sock.sendMessage(chatId, {
      react: { text: '⏳', key: reactKey }
    });

    // 📝 رسالة تحميل
    await sock.sendMessage(
      chatId,
      { text: 'جاري التحميل..⏳' },
      { quoted: msg }
    );

    const url = match[0];
    const outDir = './downloads/media';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // 🎯 أوامر yt-dlp
    const cmd =
      type === 'audio'
        ? `yt-dlp -x --audio-format mp3 --no-playlist -o "${outDir}/%(id)s.%(ext)s" "${url}"`
        : `yt-dlp -f best --no-playlist -o "${outDir}/%(id)s.%(ext)s" "${url}"`;

    exec(cmd, async (error) => {
      if (error) {
        console.error('Download Error:', error);

        await sock.sendMessage(chatId, {
          react: { text: '❌', key: reactKey }
        });

        return sock.sendMessage(
          chatId,
          { text: '❌ فشل التحميل (رابط خاص / محظور / منتهي)' },
          { quoted: msg }
        );
      }

      const files = fs.readdirSync(outDir);
      if (!files.length) {
        await sock.sendMessage(chatId, {
          react: { text: '❌', key: reactKey }
        });

        return sock.sendMessage(
          chatId,
          { text: '❌ لم يتم العثور على ملفات.' },
          { quoted: msg }
        );
      }

      // ✅ رياكت نجاح
      await sock.sendMessage(chatId, {
        react: { text: '✅', key: reactKey }
      });

      for (const file of files) {
        const filePath = path.join(outDir, file);

        // 🎬 فيديو
        if (file.endsWith('.mp4')) {
          await sock.sendMessage(
            chatId,
            {
              video: fs.readFileSync(filePath),
              caption: 'Done ✨\n\n> انا لا اتحمل ذنوب ما تشاهد..'
            },
            { quoted: msg }
          );
        }

        // 🎧 صوت
        else if (file.endsWith('.mp3')) {
          await sock.sendMessage(
            chatId,
            {
              audio: fs.readFileSync(filePath),
              mimetype: 'audio/mpeg',
              ptt: false
            },
            { quoted: msg }
          );
        }

        fs.unlinkSync(filePath); // 🧹 تنظيف
      }
    });
  }
};

