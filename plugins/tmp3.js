const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const { writeFile, unlink } = require('fs/promises');
const { tmpdir } = require('os');
const { join } = require('path');

module.exports = {
  command: "ساوند",
  aliases: ["لصوت", "mp3"],
  category: "tools",
  description: "⬇️ تحويل الفيديو إلى ملف صوتي (MP3)",

  async execute(sock, msg, args = []) {
    const chatId = msg.key.remoteJid;

    const reply = (text) => sock.sendMessage(chatId, { text }, { quoted: msg });

    // التأكد من الرد على رسالة فيديو
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return reply("⚠️ يرجى الرد على رسالة فيديو لتحويلها.");

    const videoMessage = quoted.videoMessage;
    if (!videoMessage) return reply("❌ الرسالة التي قمت بالرد عليها ليست فيديو.");

    await reply("📥 جاري تحميل الفيديو...");

    try {
      const stream = await downloadContentFromMessage(videoMessage, 'video');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const tempVideoPath = join(tmpdir(), `${Date.now()}.mp4`);
      const tempAudioPath = join(tmpdir(), `${Date.now()}.mp3`);

      await writeFile(tempVideoPath, buffer);

      await reply("🔄 جاري تحويل الفيديو إلى صوت...");

      exec(`ffmpeg -i "${tempVideoPath}" -q:a 0 -map a "${tempAudioPath}"`, async (error) => {
        await unlink(tempVideoPath).catch(e => console.error("فشل حذف ملف الفيديو المؤقت:", e));

        if (error) {
          console.error("FFMPEG Error:", error);
          return await reply("❌ حدث خطأ أثناء عملية التحويل.");
        }

        await sock.sendMessage(chatId, {
          audio: { url: tempAudioPath },
          mimetype: 'audio/mpeg',
          ptt: false
        }, { quoted: msg });

        await unlink(tempAudioPath).catch(e => console.error("فشل حذف ملف الصوت المؤقت:", e));
      });

    } catch (e) {
      console.error("Error in tomp3 command:", e);
      await reply("❌ فشل تحميل الفيديو أو معالجته.");
    }
  }
};
