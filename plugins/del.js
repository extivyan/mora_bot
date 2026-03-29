// ملف: plugins/حذف.js
// • Feature : delete replied message + command message + contact موثق
// • Developers : EXT Team

module.exports = {
    command: "امسح",
    aliases: ["del", "مسح"],
    description: "بيمسح الرساله الي انت رديت عليها مع رسالتك (للادمن بس)",
    category: "group",

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid;

            // ✅ التأكد أن البوت في جروب
            if (!chatId.endsWith("@g.us")) {
                return sock.sendMessage(chatId, {
                    text: "❌ الأمر ده شغال في الجروبات بس."
                }, { quoted: m });
            }

            // ✅ التأكد إن في رسالة مردود عليها
            const contextInfo = m.message?.extendedTextMessage?.contextInfo;
            if (!contextInfo?.quotedMessage) {
                return sock.sendMessage(chatId, {
                    text: "⚠️ لازم ترد على رسالة وتكتب .امسح"
                }, { quoted: m });
            }

            // ✅ التحقق إن المستخدم أدمن
            const metadata = await sock.groupMetadata(chatId);
            const isAdmin = metadata.participants.some(p =>
                p.id === sender &&
                (p.admin === "admin" || p.admin === "superadmin")
            );

            if (!isAdmin) {
                return sock.sendMessage(chatId, {
                    text: "❌ الامر ده للادمن بس يا شحات."
                }, { quoted: m });
            }

            // 🗑️ حذف الرسالة اللي تم الرد عليها
            const quotedKey = {
                remoteJid: chatId,
                fromMe: contextInfo.participant === sock.user.id,
                id: contextInfo.stanzaId,
                participant: contextInfo.participant
            };

            await sock.sendMessage(chatId, { delete: quotedKey });
            await sock.sendMessage(chatId, { delete: m.key });

            // 📇 Fake Contact باسم صاحب الأمر + صورة تظهر جنب الاسم
            const senderName = m.pushName || "Contact";

            // ✅ دمج مع الشكل القديم للـ fakeQuoted
            const fakeQuoted = {
                key: {
                    fromMe: false,
                    remoteJid: "status@broadcast", // الشكل القديم
                    participant: "0@s.whatsapp.net", // الشكل القديم
                    id: "BAE5F1AA7B228B" // الشكل القديم
                },
                message: {
                    contactMessage: {
                        displayName: senderName, // يظهر اسم صاحب الأمر
                        vcard: `BEGIN:VCARD
VERSION:3.0
FN:${senderName}
TEL;type=CELL;type=VOICE;waid=0:0
END:VCARD`
                    }
                }
            };

            // ✅ إرسال Contact فقط (الصورة تظهر جنب الاسم تلقائيًا)
            await sock.sendMessage(
                chatId,
                {
                    text: "✅ تم مسح الرسائل بنجاح"
                },
                { quoted: fakeQuoted }
            );

        } catch (err) {
            console.error("❌ Delete Error:", err);
            await sock.sendMessage(chatId, {
                text: "❌ حصل خطأ أثناء تنفيذ أمر الحذف."
            }, { quoted: m });
        }
    }
};
