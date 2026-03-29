const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  command: 'انستا',
  category: 'download',
  description: 'تحميل إنستغرام',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      "";

    const instaRegex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories)\/[^\s?]+/i;
    const match = body.match(instaRegex);

    if (!match) {
      return sock.sendMessage(
        chatId,
        { text: '❌ حط رابط إنستغرام صحيح.\nمثال:\n.انستا https://instagram.com/...' },
        { quoted: msg }
      );
    }

    const reactKey = msg.key;

    // ⏳ رياكت بداية
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
    const outDir = './downloads/insta';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const cmd = `yt-dlp -f best --no-playlist -o "${outDir}/%(id)s.%(ext)s" "${url}"`;

    exec(cmd, async (error) => {
      if (error) {
        console.error('Insta Error:', error);

        // ❌ رياكت فشل
        await sock.sendMessage(chatId, {
          react: { text: '❌', key: reactKey }
        });

        return sock.sendMessage(
          chatId,
          { text: '❌ فشل التحميل (رابط خاص أو منتهي)' },
          { quoted: msg }
        );
      }

      const files = fs.readdirSync(outDir);
      if (!files.length) {
        // ❌ رياكت فشل
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

        if (file.endsWith('.mp4')) {
          await sock.sendMessage(
            chatId,
            {
              video: fs.readFileSync(filePath),
              caption: 'Done ✨\n\n> انا لا اتحمل ذنوب ما تشاهد..'
            },
            { quoted: msg }
          );
        } else {
          await sock.sendMessage(
            chatId,
            {
              image: fs.readFileSync(filePath),
              caption: 'Done ✨\n\n> انا لا اتحمل ذنوب ما تشاهد..'
            },
            { quoted: msg }
          );
        }

        fs.unlinkSync(filePath); // تنظيف
      }
    });
  }
};
