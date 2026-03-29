const { eliteNumbers } = require('../haykala/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    command: 'اخرج',
    aliases: ['غادر', 'leave'],
    category: 'group',
    description: 'يجعل البوت يغادر المجموعة الحالية.',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = decode(msg.key.participant || groupJid);

            if (!groupJid.endsWith('@g.us'))
                return sock.sendMessage(groupJid, { text: '🚫 هذا الأمر يعمل فقط في المجموعات.' }, { quoted: msg });

            const metadata = await sock.groupMetadata(groupJid);
            const participants = metadata.participants;
            const botNumber = decode(sock.user.id);

            // ✅ تحقق صلاحيات: أدمن أو Elite
            const isAdmin = participants.some(p =>
                decode(p.id) === sender && (p.admin === 'admin' || p.admin === 'superadmin')
            );

            const senderLid = sender.split('@')[0];
            const isElite = eliteNumbers.includes(senderLid);

            if (!isAdmin && !isElite)
                return sock.sendMessage(groupJid, { text: '❌ هذا الأمر مخصص لمشرفي المجموعة النخبة فقط.' }, { quoted: msg });

            // ⏳ تأخير قبل الخروج
            await sleep(2000);

            await sock.sendMessage(groupJid, { text: '👋 تم تنفيذ الأمر. البوت يغادر الآن.' }, { quoted: msg });
            await sock.groupLeave(groupJid);

        } catch (error) {
            console.error('❌ خطأ في اخرج.js:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ حصل خطأ أثناء تنفيذ الأمر.' }, { quoted: msg });
        }
    }
};
