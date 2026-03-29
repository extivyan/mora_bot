const fs = require("fs");
const path = require("path");

module.exports = {
    command: ["اضافه"],
    description: "إضافة أوامر ديناميكياً",
    usage: ".اضافه اسم_الأمر",
    category: "developer",
    developer: true,

    async execute(sock, msg) {
        try {
            const chatId = msg.key.remoteJid;
            const text = msg.message?.conversation 
                || msg.message?.extendedTextMessage?.text;

            const args = text?.split(" ").slice(1) || [];
            const cmdName = args[0];

            if (!cmdName) {
                return sock.sendMessage(chatId, {
                    text: "❌ اكتب اسم الأمر اللي هيتضاف."
                }, { quoted: msg });
            }

            // جلب محتوى الرسالة المردود عليها
            const quoted =
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            const content =
                quoted?.conversation ||
                quoted?.extendedTextMessage?.text;

            if (!content) {
                return sock.sendMessage(chatId, {
                    text: "❌ لازم ترد على رسالة فيها كود الأمر."
                }, { quoted: msg });
            }

            const pluginsDir = path.join("./plugins");
            if (!fs.existsSync(pluginsDir)) {
                fs.mkdirSync(pluginsDir, { recursive: true });
            }

            const filePath = path.join(pluginsDir, `${cmdName}.js`);

            if (fs.existsSync(filePath)) {
                return sock.sendMessage(chatId, {
                    text: "❌ الأمر ده موجود بالفعل."
                }, { quoted: msg });
            }

            fs.writeFileSync(filePath, content.trim());

            await sock.sendMessage(chatId, {
                text: `✅ تم إنشاء الأمر: .${cmdName}\n♻️ أعد تشغيل البوت لتفعيله.`
            }, { quoted: msg });

        } catch (error) {
            console.error("❌ خطأ في أمر اضافه:", error);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حصل خطأ:\n${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};
