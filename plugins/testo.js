const fs = require('fs');
const path = require('path');
const os = require('os');

// ===== إصدار البوت الحقيقي من package.json =====
const botVersion = require('../package.json').version;

// ===== وقت تشغيل البوت =====
const botStartTime = Date.now();

module.exports = {
  command: 'تستو',
  description: 'تست البوت 2',
  category: 'tools',

  async execute(sock, msg) {
    try {
      const chatJid = msg.key.remoteJid;

      // ===== حساب عدد الأوامر =====
      const pluginsPath = __dirname;
      const commandFiles = fs
        .readdirSync(pluginsPath)
        .filter(file => file.endsWith('.js'));
      const commandsCount = commandFiles.length;

      // ===== مدة التشغيل =====
      const uptimeMs = Date.now() - botStartTime;
      const uptimeSeconds = Math.floor(uptimeMs / 1000);
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;
      const uptimeText = `${days}ي ${hours}س ${minutes}د ${seconds}ث`;

      // ===== نظام التشغيل =====
      const platform = os.platform();

      // ===== نص معلومات البوت =====
      const decoratedText = `╭─〔 ⚙️ 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢 〕─╮
┃ 🐊 الاسم: *𝐸𝑋𝑻𝑽𝐼𝐴𝑁_𝐁𝐎𝐓*
┃ 📦 الأوامر: *${commandsCount}*
┃ 🛠️ الإصدار: *v${botVersion}*
┃ 👑 المطور: *𝐄𝐗𝐓𝐕𝐈𝐀𝐍 🕸️*
┃ ⏱️ مدة التشغيل: *${uptimeText}*
┃ 🧠 اللغة: *Node.js (Baileys)*
┃ 💻 النظام: *${platform}*
╰━━━━━━━━━━━━━╯`;

      // ===== اقتباس القناة =====
      const channelQuoted = {
        key: {
          fromMe: false,
          remoteJid: 'status@broadcast',
          participant: '0@s.whatsapp.net'
        },
        message: {
          extendedTextMessage: {
            text: '𝑬𝑿𝑻𝑽𝑰𝐴𝑵_𝐁𝐎𝐓⛧',
            contextInfo: {
              forwardedNewsletterMessageInfo: {
                newsletterJid: '120363426138973414@newsletter',
                newsletterName: '𝑬𝑿𝑻𝑽𝑰𝐴𝑵_𝑩𝑶𝑻⛧',
                serverMessageId: 970
              }
            }
          }
        }
      };

      // ===== إرسال الرسالة (بصورة من لينك مباشر) =====
      await sock.sendMessage(
        chatJid,
        {
          text: decoratedText,
          contextInfo: {
            externalAdReply: {
              title: '𝐸𝑋𝑻𝑽𝐼𝐴𝑁_𝐁𝐎𝐓',
              body: '☆⏤͟͟͞͞𝐸𝑋𝑻𝑽𝐼𝐴𝑁⋆.𐙚 ˚',
              mediaType: 1,
              thumbnailUrl:
                'https://i.postimg.cc/Mpv37ssQ/149a2338115e9a149af52e719fa425e0.jpg',
              renderLargerThumbnail: true,
              sourceUrl: 'https://t.me/YourChannel'
            }
          }
        },
        { quoted: channelQuoted }
      );

    } catch (error) {
      console.error(error);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ Error: ${error.message || error.toString()}` },
        { quoted: msg }
      );
    }
  }
};
