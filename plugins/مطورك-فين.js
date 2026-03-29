module.exports = {
    command: 'مطورك-فين',
    description: 'يرد برسالة ساخرة عن المطور',
    usage: '.مطورك-فين',
    category: 'BOT',

    async execute(sock, msg) {
        try {
            const chatId = msg.key.remoteJid;

            const reply = 'المطور نايم🙂🫸🏻';

            await sock.sendMessage(chatId, {
                text: reply
            }, { quoted: msg });

        } catch (error) {
            console.error('❌ خطأ في أمر مطورك-فين:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حصل خطأ:\n${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};
