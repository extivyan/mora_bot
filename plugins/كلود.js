// ملف: plugins/سبارك.js
// • Feature : Spark AI (Free AI - Pollinations)
// • Developers : EXT Team

const axios = require("axios");
const baileys = require("@whiskeysockets/baileys");
const { generateWAMessageFromContent } = baileys;

module.exports = {
    command: 'سبارك',
    description: 'تفاعل مع Spark AI ⚡ (مجاني 100%)',
    category: 'ai',

    async execute(sock, m) {
        const chatId = m.key.remoteJid;

        const messageText =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            '';

        // إزالة الأمر من الرسالة
        const text = messageText.replace(/^\.?سبارك\s*/i, "").trim();

        if (!text) {
            return sock.sendMessage(
                chatId,
                {
                    text: `⚡ *Spark AI جاهز*\n\nاكتب سؤالك بعد الأمر\n\nمثال:\nسبارك اشرح الذكاء الاصطناعي`,
                    contextInfo: {
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363426138973414@newsletter',
                            newsletterName: ' ๋࣭⋆˚𓂅𝐄𝐗𝐕𝐈𝐀𝐍𓏲֗  ๋࣭⋆˚',
                            serverMessageId: 970
                        }
                    }
                },
                { quoted: m }
            );
        }

        try {
            // Typing effect
            await sock.sendPresenceUpdate('composing', chatId);

            const res = await axios.get(
                `https://text.pollinations.ai/${encodeURIComponent(text)}`,
                { timeout: 20000 }
            );

            if (!res.data) {
                return sock.sendMessage(
                    chatId,
                    { text: "⚠️ سبارك مش سامع دلوقتي… جرّب تاني." },
                    { quoted: m }
                );
            }

            const message = generateWAMessageFromContent(
                chatId,
                {
                    extendedTextMessage: {
                        text: `⚡ *Spark AI*\n\n${res.data}`,
                        contextInfo: {
                            isForwarded: true,
                            forwardingScore: 1,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363426138973414@newsletter',
                                newsletterName: ' ๋࣭⋆˚𓂅𝐄𝐗𝐕𝐈𝐀𝐍𓏲֗  ๋࣭⋆˚',
                                serverMessageId: 970
                            }
                        }
                    }
                },
                { quoted: m }
            );

            await sock.relayMessage(
                chatId,
                message.message,
                { messageId: message.key.id }
            );

        } catch (err) {
            console.error('❌ Spark AI Error:', err);

            await sock.sendMessage(
                chatId,
                {
                    text: "❌ سبارك وقع… السيرفر بيلتقط أنفاسه. ارجع كمان شوية ⚡",
                    contextInfo: {
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363426138973414@newsletter',
                            newsletterName: ' ๋࣭⋆˚𓂅𝐄𝐗𝐕𝐈𝐀𝐍𓏲֗  ๋࣭⋆˚',
                            serverMessageId: 970
                        }
                    }
                },
                { quoted: m }
            );
        }
    }
};
