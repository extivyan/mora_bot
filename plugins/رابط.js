// ملف: plugins/لينك.js
// • Feature : Group Invite Link (Admins Only)
// • Developers : EXT Team

module.exports = {
  command: "لينك",
  category: "إدارة",
  description: "البوت بيرد بـ لينك الجروب (للأدمن فقط)",

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ جروب فقط
    if (!chatId.endsWith("@g.us")) {
      return sock.sendMessage(
        chatId,
        { text: "❌ الأمر ده شغال في الجروبات بس." },
        { quoted: msg }
      );
    }

    try {
      // ✅ التحقق إن اللي كتب الأمر أدمن
      const metadata = await sock.groupMetadata(chatId);
      const isAdmin = metadata.participants.some(
        p =>
          p.id === sender &&
          (p.admin === "admin" || p.admin === "superadmin")
      );

      if (!isAdmin) {
        return sock.sendMessage(
          chatId,
          { text: "الامر ده للادمن بس يشحات👨🏼‍🦯." },
          { quoted: msg }
        );
      }

      // 🔗 جلب كود الدعوة
      const inviteCode = await sock.groupInviteCode(chatId);
      const groupLink = `https://chat.whatsapp.com/${inviteCode}`;

      // 🧿 Fake WhatsApp Style (زي القناة / الحالة)
      const fakeQuoted = {
        key: {
          fromMe: false,
          remoteJid: "status@broadcast",
          participant: "0@s.whatsapp.net",
          id: "BAE5F1AA7B228B"
        },
        message: {
          videoMessage: {
            gifPlayback: true,
            caption: "֗  ๋࣭⋆˚𓂅𝐄𝐗𝐕𝐈𝐀𝐍𓏲֗  ๋࣭⋆˚",
            mimetype: "video/mp4",
            url: "https://media.tenor.com/GfSX-u7VGM4AAAAC/loading.gif",
            contextInfo: {
              externalAdReply: {
                title: "WhatsApp Channel",
                body: "System Message",
                mediaType: 2,
                renderLargerThumbnail: false,
                showAdAttribution: true,
                sourceUrl: "https://www.whatsapp.com"
              }
            }
          }
        }
      };

      // 📤 إرسال اللينك
      await sock.sendMessage(
        chatId,
        {
          text: `⚕︎ *لينك الجروب يسطاا :*\n\n${groupLink}`
        },
        { quoted: fakeQuoted }
      );

    } catch (err) {
      console.error("Error fetching group link:", err);
      await sock.sendMessage(
        chatId,
        { text: "❌ حصل خطأ أثناء جلب رابط الجروب." },
        { quoted: msg }
      );
    }
  }
};
