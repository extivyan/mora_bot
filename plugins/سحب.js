const { extractPureNumber, isElite } = require('../haykala/elite');

module.exports = {
  command: 'سحب',
  description: 'يسحب الإشراف من كل المشرفين ماعدا البوت ومنفذ الأمر، ويرفع منفذ الأمر إلى مشرف أولاً.',
  category: 'zarf', // ضمن كارج ZARF
  usage: '.سحب',

  async execute(sock, msg) {
    const senderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
    const senderNumber = extractPureNumber(senderJid);

    const isGroup = msg.key.remoteJid.endsWith('@g.us');
    if (!isGroup) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: '*❗ هذا الأمر يعمل فقط داخل القروبات.*'
      }, { quoted: msg });
    }

    if (!await isElite(senderNumber)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: '*🚫 هذا الأمر مخصص فقط للنخبة.*'
      }, { quoted: msg });
    }

    try {
      const groupId = msg.key.remoteJid;
      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

      // تأكد أن منفذ الأمر مشرف أولًا
      await sock.groupParticipantsUpdate(groupId, [senderJid], 'promote');
      await sock.sendMessage(groupId, {
        text: `🛡️ *تم ترقية منفذ الأمر (@${senderNumber}) إلى مشرف.*`,
        mentions: [senderJid]
      }, { quoted: msg });

      const metadata = await sock.groupMetadata(groupId);
      const participants = metadata.participants;

      const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

      const toDemote = admins
        .filter(p => p.id !== botJid && p.id !== senderJid)
        .map(p => p.id);

      if (toDemote.length > 0) {
        await sock.groupParticipantsUpdate(groupId, toDemote, 'demote');
        await sock.sendMessage(groupId, {
          text: `✅ *تم سحب الإشراف من ${toDemote.length} عضو.*`
        }, { quoted: msg });
      } else {
        await sock.sendMessage(groupId, {
          text: '⚠️ لا يوجد مشرفين يمكن سحب إشرافهم (كلهم مستثنين).'
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('خطأ في تنفيذ أمر سحب:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '⚠️ حدث خطأ أثناء تنفيذ أمر سحب الإشراف.'
      }, { quoted: msg });
    }
  }
};
