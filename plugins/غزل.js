const fs = require('fs');

module.exports = {
    command: 'غزل',
    category: 'love', // حطّناه هنا ضمن فئة الحب
    description: '💌 إرسال رسالة غزل عشوائية لشخص تم منشنه',

    async execute(sock, m) {
        const chatId = m.key.remoteJid;
        const sender = m.key.participant || m.participant || m.key.remoteJid;

        if (!chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, { text: `🚫 هذا الأمر يعمل فقط في *المجموعات*!` });
        }

        const mentionedJids = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (mentionedJids.length === 0) {
            return sock.sendMessage(chatId, { text: `❌ استخدم الأمر مع منشن لشخص معين! مثال: *•تحرش @الشخص*` });
        }

        const target = mentionedJids[0];

        const flirtQuotes = [
            "🫦 هل أنتِ قمر؟ لأنك تنيرين طريقي.",
            "🫦 هل أنتِ بحر؟ لأني أغرق في تأملكِ.",
            "🫦 هل أنتِ وردة؟ لأنكِ تملئين عالمي بعطركِ.",
            "🫦 هل أنتِ نجم؟ لأنك تضيئين سمائي.",
            "🫦 هل أنتِ الشمس؟ لأنكِ تمنحينني الدفء.",
            "🫦 هل أنتِ غيمة؟ لأنكِ تلطفين كل لحظة.",
            "🫦 هل أنتِ ملاك؟ لأنكِ تملئين حياتي بالنور.",
            "🫦 هل أنتِ فراشة؟ لأنكِ ترفرفين في كل مكان.",
            "🫦 هل أنتِ لؤلؤة؟ لأنكِ تتألقين في البحر."
        ];

        const daringQuotes = [
            "🫦 هل أنتِ حورية بحر؟ لأنني أرغب في الغرق فيكِ.",
            "🫦 هل أنتِ سراب؟ لأنني لا أستطيع أن أتمالك نفسي من التفكير فيكِ.",
            "🫦 هل أنتِ نهر؟ لأنني أريد أن أغرق في أعماقكِ.",
            "🫦 هل أنتِ فاكهة؟ لأنني لا أستطيع مقاومة لذاذتكِ.",
            "🫦 هل أنتِ سماء؟ لأنني أرغب في الطيران إليكِ.",
            "🫦 هل أنتِ زهرة؟ لأنني أريد أن أقطفكِ وأنتِ أجمل من الجميع."
        ];

        const boldQuotes = [
            "🫦 هل أنتِ سكر؟ لأنكِ تجعلينني أذوب فيكِ.",
            "🫦 هل أنتِ مشهد؟ لأنكِ تجعلينني لا أستطيع أن أغمض عيني عنكِ.",
            "🫦 هل أنتِ ثلج؟ لأنكِ تبردين مشاعري.",
            "🫦 هل أنتِ مطر؟ لأنني أغرق فيكِ.",
            "🫦 هل أنتِ موسيقى؟ لأنكِ تجعلينني أرقص معكِ في كل لحظة."
        ];

        const allQuotes = [...flirtQuotes, ...daringQuotes, ...boldQuotes];
        const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)];

        const loveMessage = `💍؟ @${target.split('@')[0]}, ${randomQuote}`;
        await sock.sendMessage(chatId, { text: loveMessage, mentions: [target] });
    }
};
