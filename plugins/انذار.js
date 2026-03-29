const fs = require('fs');
const path = require('path');

const WARNINGS_FILE = path.join(__dirname, '../data/warnings.json');

// تحميل بيانات الإنذارات
function loadWarnings() {
  if (!fs.existsSync(WARNINGS_FILE)) {
    fs.mkdirSync(path.dirname(WARNINGS_FILE), { recursive: true });
    fs.writeFileSync(WARNINGS_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(WARNINGS_FILE));
}

// حفظ بيانات الإنذارات
function saveWarnings(data) {
  fs.writeFileSync(WARNINGS_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  command: 'انذار',
  category: 'admin',
  description: 'إعطاء إنذار لأحد أعضاء المجموعة (للمشرفين فقط).',

  async execute(sock, msg, args = []) {
    const chatId = msg.key.remoteJid;

    if (!chatId.endsWith('@g.us')) {
      return sock.sendMessage(chatId, { text: '❌ هذا الأمر يعمل فقط في المجموعات.' }, { quoted: msg });
    }

    let groupMetadata;
    try {
      groupMetadata = await sock.groupMetadata(chatId);
    } catch (e) {
      return sock.sendMessage(chatId, { text: '❌ لم أتمكن من جلب بيانات المجموعة.' }, { quoted: msg });
    }

    const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

    const senderObj = groupMetadata.participants.find(p => p.id === sender);
    if (!senderObj || (senderObj.admin !== 'admin' && senderObj.admin !== 'superadmin')) {
      return sock.sendMessage(chatId, { text: '❌ يجب أن تكون مشرفًا لتنفيذ هذا الأمر.' }, { quoted: msg });
    }

    let target;

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const contextParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (mentioned?.length > 0) {
      target = mentioned[0];
    } else if (contextParticipant) {
      target = contextParticipant;
    } else if (args.length > 0) {
      const number = args[0].replace(/[^0-9]/g, '');
      target = number + '@s.whatsapp.net';
    } else {
      return sock.sendMessage(chatId, { text: '❌ يجب منشن العضو أو الرد عليه أو كتابة رقمه.' }, { quoted: msg });
    }

    const targetObj = groupMetadata.participants.find(p => p.id === target);
    if (!targetObj) {
      return sock.sendMessage(chatId, { text: '❌ العضو غير موجود في المجموعة.' }, { quoted: msg });
    }

    if (targetObj.admin === 'admin' || targetObj.admin === 'superadmin') {
      return sock.sendMessage(chatId, { text: '❌ لا يمكنك إعطاء إنذار للمشرفين.' }, { quoted: msg });
    }

    let warnings = loadWarnings();
    if (!warnings[chatId]) warnings[chatId] = {};
    if (!warnings[chatId][target]) warnings[chatId][target] = 0;

    warnings[chatId][target]++;
    saveWarnings(warnings);

    const count = warnings[chatId][target];
    const reason = args.slice(1).join(' ') || 'بدون سبب';

    const warnMsg = `⚠️ تم إعطائك إنذارًا\n📌 السبب: ${reason}\n⚠️ عدد الإنذارات: ${count} / 3`;

    await sock.sendMessage(chatId, {
      text: warnMsg,
      mentions: [target]
    }, { quoted: msg });

    if (count >= 3) {
      await sock.sendMessage(chatId, {
        text: `🚫 تم طرد @${target.split('@')[0]} بسبب تجاوز 3 إنذارات.`,
        mentions: [target]
      }, { quoted: msg });

      try {
        await sock.groupParticipantsUpdate(chatId, [target], 'remove');
        warnings[chatId][target] = 0;
        saveWarnings(warnings);
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ فشل طرد العضو: ${err.message}` }, { quoted: msg });
      }
    }
  }
};
