// ملف: plugins/منشن-ادمن.js
// • Feature : Mention Admins Only (line by line)
// • Developers : EXT Team

module.exports = {
    command: 'منشن-ادمن',
    aliases: ['mention'],
    category: 'group',
    description: '📢 منشن مشرفين الجروب فقط',

    async execute(sock, m) {
        const chatId = m.key.remoteJid;

        // جروب فقط
        if (!chatId.endsWith('@g.us')) return;

        const text =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            '';

        // لازم ".منشن ادمن"
        if (!text.includes('ادمن')) return;

        // بيانات الجروب
        const metadata = await sock.groupMetadata(chatId);

        // الأدمنز
        const admins = metadata.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.id);

        if (admins.length === 0) return;

        // منشنات تحت بعض
        const mentionsText = admins
            .map(id => `@${id.split('@')[0]}`)
            .join('\n');

        await sock.sendMessage(chatId, {
            text: mentionsText,
            mentions: admins
        }, { quoted: m });
    }
};
