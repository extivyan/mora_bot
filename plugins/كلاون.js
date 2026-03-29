// ملف: plugins/كلاون.js
// • Feature : Clown AI 🤡 (Pollinations - Free Forever + قناة)
// • Developers : EXT Team

const axios = require("axios");
const baileys = require("@whiskeysockets/baileys");
const { generateWAMessageFromContent } = baileys;

module.exports = {
    command: 'كلاون',
    description: 'كلاون AI 🤡 — ذكي ودمه خفيف (مجاني 100%)',
    category: 'ai',

    async execute(sock, m) {
        const chatId = m.key.remoteJid;

        const messageText =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            '';

        const text = messageText.replace(/^\.?كلاون\s*/i, "").trim();

        if (!text) {
            return sock.sendMessage(
                chatId,
                {
                    text: `🤡 *Clown AI*\n\nقولي عايز ايه\n\nمثال:\nكلاون احكي نكتة عن البرمجة`,
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
            // typing indicator
            await sock.sendPresenceUpdate('composing', chatId);

            const prompt = `جاوب بأسلوب ساخر وخفيف دم بدون قلة أدب:\n${text}`;

            const res = await axios.get(
                `https://text.pollinations.ai/${encodeURIComponent(prompt)}`,
                { timeout: 20000 }
            );

            if (!res.data) {
                throw new Error("No response");
            }

            const message = generateWAMessageFromContent(
                chatId,
                {
                    extendedTextMessage: {
                        text: `🤡 *Clown AI*\n\n${res.data}`,
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
            console.error('❌ Clown Error:', err);

            await sock.sendMessage(
                chatId,
                {
                    text: "🤡 دماغي علّقت ثانية… جرب تاني 😂",
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
