const { spawn } = require('child_process');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');

// 🟢 Channel Admin Invite (970)
const channelInfo = {
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363426138973414@newsletter',
    newsletterName: ' ๋࣭⋆˚𓂅𝐄𝐗𝐕𝐈𝐀𝐍𓏲֗  ๋࣭⋆˚',
    serverMessageId: 970
  }
};

module.exports = {
  command: ['اغنيه'],
  category: 'media',
  description: 'تحميل أغنية MP3 من يوتيوب وإرسالها كصوت',
  status: 'on',
  version: '4.0',

  async execute(sock, msg) {
    try {
      const groupJid = msg.key.remoteJid;

      // 📥 استخراج النص
      const body = (
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        ''
      ).trim();

      const parts = body.split(/\s+/);
      if (parts.length <= 1) {
        return await sock.sendMessage(
          groupJid,
          { text: '❌ اكتب اسم الأغنية بعد الأمر.' },
          { quoted: msg }
        );
      }

      parts.shift();
      const query = parts.join(' ');

      // 🔍 البحث
      const searchResult = await ytSearch(query);
      if (!searchResult || searchResult.videos.length === 0) {
        return await sock.sendMessage(
          groupJid,
          { text: '❌ لم يتم العثور على أي نتيجة.' },
          { quoted: msg }
        );
      }

      const video = searchResult.videos[0];

      // 🧾 معلومات
      const caption = `🎶 العنوان: ${video.title}
⏱️ المدة: ${video.timestamp}
👤 القناة: ${video.author.name}
👁 المشاهدات: ${video.views}
🔗 الرابط: ${video.url}`;

      if (video.thumbnail) {
        await sock.sendMessage(
          groupJid,
          {
            image: { url: video.thumbnail },
            caption,
            contextInfo: channelInfo
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          groupJid,
          {
            text: caption,
            contextInfo: channelInfo
          },
          { quoted: msg }
        );
      }

      // 📁 تجهيز الفولدر
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const fileName = `${Date.now()}.mp3`;
      const filePath = path.join(tempDir, fileName);

      // ⚡ تحميل باستخدام yt-dlp (نسخة قوية)
      const ytdlpPath = "/data/data/com.termux/files/usr/bin/yt-dlp";

      const args = [
        "-x",
        "--audio-format", "mp3",
        "--remote-components", "ejs:github",
        "--no-playlist",
        "--geo-bypass",
        "-o", filePath,
        video.url
      ];

      const process = spawn(ytdlpPath, args);

      process.stderr.on("data", (data) => {
        console.log("yt-dlp:", data.toString());
      });

      process.on("close", async (code) => {
        // ❌ لو فشل
        if (code !== 0 || !fs.existsSync(filePath)) {

          // 🔁 fallback
          const fallback = spawn(ytdlpPath, [
            "-f", "bestaudio",
            "-o", filePath,
            video.url
          ]);

          fallback.on("close", async (code2) => {
            if (code2 !== 0 || !fs.existsSync(filePath)) {
              return await sock.sendMessage(
                groupJid,
                { text: "❌ فشل تحميل الأغنية." },
                { quoted: msg }
              );
            }

            await sendAudio(sock, groupJid, filePath, msg);
          });

        } else {
          await sendAudio(sock, groupJid, filePath, msg);
        }
      });

      // 🎧 إرسال الصوت
      async function sendAudio(sock, jid, filePath, msg) {
        await sock.sendMessage(
          jid,
          {
            audio: { url: filePath },
            mimetype: "audio/mpeg",
            ptt: false
          },
          { quoted: msg }
        );

        try { fs.unlinkSync(filePath); } catch {}
      }

    } catch (err) {
      console.error('❌ خطأ عام:', err);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ حدث خطأ أثناء تنفيذ الأمر.' },
        { quoted: msg }
      );
    }
  }
};
