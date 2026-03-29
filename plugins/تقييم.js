module.exports = {
    command: 'تقييم',
    category: 'FUN', // حطّناه هنا ضمن فئة التسلية
    description: '🎲 تقييم شخص من منشن بنسبة عشوائية',

    async execute(sock, m) {
        const chatId = m.key.remoteJid;

        if (!chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, { text: `🚫 هذا الأمر يعمل فقط في *المجموعات*!` });
        }

        const mentionedJids = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (mentionedJids.length === 0) {
            return sock.sendMessage(chatId, { text: `❌ استخدم الأمر مع منشن لشخص! مثال: *•تقييم @الاسم*` });
        }

        const target = mentionedJids[0];
        const targetName = `@${target.split('@')[0]}`;

        const types = [
            "الجمال 💅",
            "الذكاء 🧠",
            "الشر 😈",
            "البراءة 😇",
            "الهيبة 😎",
            "الجنون 🤪",
            "الدراما 🎭",
            "الطيبة ❤️",
            "الكسل 😴",
            "حب الناس 😍",
            "الشطارة 📚",
            "الفهاوة 😵",
            "الرزانة 🧘",
            "العظمة 👑",
            "الرومانسية 💘",
            "العناد 😤"
        ];

        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomPercentage = Math.floor(Math.random() * 101);

        const result = `🤖 البوت يقيم ${targetName} في *${randomType}* بنسبة: *${randomPercentage}%*.\n\n📝 تقييم عشوائي لكن ممكن يطلع صح!`;

        await sock.sendMessage(chatId, {
            text: result,
            mentions: [target]
        });
    }
};
