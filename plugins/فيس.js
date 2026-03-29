const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  command: 'فيس',
  category: 'download',
  description: 'تحميل فيسبوك + رياكت حالة',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      "";

    const fbRegex = /https?:\/\/(www\.)?(facebook|fb)\.com\/[^\s]+/i;
    const match = body.match(fbRegex);

    if (!match) {
      return sock.sendMessage(
        chatId,
        { text: '❌ حط رابط فيسبوك صحيح.\nمثال:\n.فيس https://facebook.com/...' },
        { quoted: msg }
      );
    }

    const reactKey = msg.key;

    // ⏳ رياكت بداية
    await sock.sendMessage(chatId, {
      react: { text: '⏳', key: reactKey }
    });

    // 📝 رسالة التحميل
    await sock.sendMessage(
      chatId,
      { text: 'جاري التحميل..⏳' },
      { quoted: msg }
    );

    const url = match[0];
    const outDir = './downloads/facebook';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const cmd = `yt-dlp -f best --no-playlist -o "${outDir}/%(id)s.%(ext)s" "${url}"`;

    exec(cmd, async (error) => {
      if (error) {
        console.error('Facebook Error:', error);

        // ❌ رياكت فشل
        await sock.sendMessage(chatId, {
          react: { text: '❌', key: reactKey }
        });

        return sock.sendMessage(
          chatId,
          { text: '❌ فشل التحميل (الرابط خاص أو الفيديو محذوف)' },
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
              document: fs.readFileSync(filePath),
              fileName: file,
              mimetype: 'application/octet-stream'
            },
            { quoted: msg }
          );
        }

        fs.unlinkSync(filePath); // تنظيف
      }
    });
  }
};
