const fs = require('fs');
const path = require('path');
const hay = require('../haykala/developer');

const dbDir = path.join(__dirname, '..', 'db');
const dbFile = path.join(dbDir, 'disabledChats.json');

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, '{}');

function loadDisabledChats() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch {
    return {};
  }
}

function saveDisabledChats(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

module.exports = {
  command: ['جروب'],
  usage: '.جروب تشغيل/ايقاف',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const lidSender = hay.toLid(senderJid);

    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const args = body.trim().split(/\s+/).slice(1);
    
    if (args.length === 0) {
      const helpText = `⚙️ *أمر التحكم بالمجموعة*\n\n🔧 *الوصف:*\nتشغيل أو إيقاف البوت في هذه المحادثة\n\n📝 *الاستخدام:*\n• .جروب تشغيل - تفعيل البوت\n• .جروب ايقاف - تعطيل البوت\n\n👑 *الصلاحية:*\nالمطور • الأونر بوت`;
      
      await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
      return;
    }

    if (!(hay.isFounder(lidSender) || hay.isOwnerbot(lidSender) || hay.isDeveloper(lidSender))) {
      return;
    }

    const action = args[0].toLowerCase();
    const disabledChats = loadDisabledChats();

    if (action === 'تشغيل') {
      if (!disabledChats[chatId]) {
        await sock.sendMessage(chatId, {
          text: '✅ البوت مفعل بالفعل في هذه المحادثة.'
        }, { quoted: msg });
        return;
      }

      delete disabledChats[chatId];
      saveDisabledChats(disabledChats);

      await sock.sendMessage(chatId, {
        text: '✅ تم تشغيل البوت في هذه المحادثة بنجاح.'
      }, { quoted: msg });

    } else if (action === 'ايقاف') {
      if (disabledChats[chatId]) {
        await sock.sendMessage(chatId, {
          text: '⭕ البوت متوقف بالفعل في هذه المحادثة.'
        }, { quoted: msg });
        return;
      }

      disabledChats[chatId] = true;
      saveDisabledChats(disabledChats);

      await sock.sendMessage(chatId, {
        text: '⭕ تم إيقاف البوت في هذه المحادثة.\nاكتب \`.جروب تشغيل\` لإعادة التفعيل.'
      }, { quoted: msg });

    } else {
      await sock.sendMessage(chatId, {
        text: '❌ الاستخدام الصحيح:\n• .جروب تشغيل\n• .جروب ايقاف'
      }, { quoted: msg });
    }
  }
};