const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../data/warnings.json');

let warnings = {};
if (fs.existsSync(warningsPath)) {
  warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
}

module.exports = {
  command: 'التحذيرات',
  category: 'admin', // ✅ بقى أدمن
  description: 'عرض عدد التحذيرات لجميع أعضاء المجموعة (للمشرفين فقط).',
  group: true,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;

    // جلب بيانات الجروب
    let groupMetadata;
    try {
      groupMetadata = await sock.groupMetadata(chatId);
    } catch (e) {
      return sock.sendMessage(chatId, { text: '❌ فشل جلب بيانات المجموعة.' }, { quoted: msg });
    }

    const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
    const senderObj = groupMetadata.participants.find(p => p.id === sender);

    // ✅ تحقق إن اللي بيطلب أدمن
    if (!senderObj || (senderObj.admin !== 'admin' && senderObj.admin !== 'superadmin')) {
      return sock.sendMessage(chatId, {
        text: '❌ هذا الأمر مخصص للمشرفين فقط.'
      }, { quoted: msg });
    }

    if (!warnings[chatId]) {
      return await sock.sendMessage(chatId, {
        text: '📋 لا يوجد أي تحذيرات مسجلة في هذه المجموعة.',
      }, { quoted: msg });
    }

    const groupWarnings = warnings[chatId];
    const participants = groupMetadata.participants;

    let reply = '📋 قائمة التحذيرات:\n\n';
    let mentions = [];

    for (const member of participants) {
      const id = member.id;
      const count = groupWarnings[id] || 0;
      if (count > 0) {
        reply += `🔸 @${id.split('@')[0]}: ${count} تحذير\n`;
        mentions.push(id);
      }
    }

    if (mentions.length === 0) {
      reply += '✅ لا يوجد أعضاء لديهم تحذيرات.';
    }

    await sock.sendMessage(chatId, {
      text: reply,
      mentions
    }, { quoted: msg });
  }
};
