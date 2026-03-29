module.exports = {
    command: 'بوت',
    description: 'يرسل رسالة ترحيب عند كتابة كلمة بوت',
    usage: '.بوت',
    category: 'BOT',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;

            // نص الترحيب
            const welcomeText = `> ╭─────────────╮
> ‌
> ‌
> 𓏲 𝑬𝑿𝑻𝑽𝑰𝑨𝑵 𝑩𝑶𝑻 𝑰𝑵 𝑺𝑬𝑹𝑽𝑰𝑪𝑬 𝑵𝑶𝑾𓂅
> ‌
> ╰─────────────╯˖°˖`;

            await sock.sendMessage(groupJid, {
                text: welcomeText
            }, { quoted: msg });

        } catch (error) {
            console.error('❌ حدث خطأ أثناء إرسال رسالة الترحيب:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ أثناء إرسال رسالة الترحيب:\n\n${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};
