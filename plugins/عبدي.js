const fs = require('fs')
const path = require('path');
const { eliteNumbers } = require('../haykala/elite.js');

const dataPath = path.join(__dirname, '..', 'data');
const bannedFile = path.join(dataPath, 'bannedUsers.json');

if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true });
if (!fs.existsSync(bannedFile)) fs.writeFileSync(bannedFile, JSON.stringify({}));

const loadBanned = () => {
  try { return JSON.parse(fs.readFileSync(bannedFile)); }
  catch { return {}; }
};

const saveBanned = (data) => {
  fs.writeFileSync(bannedFile, JSON.stringify(data, null, 2));
};

const timers = {};
const intervals = {};

module.exports = {
  command: ['عبدي'],
  category: 'إدارة',
  description: 'الشخص الي تقوم بمنشنه يصير عبد عند اكستڤيان',

  async execute(sock, msg) {
    try {
      const jid = msg.key.remoteJid;
      if (!jid.endsWith('@g.us')) return;

      const sender = msg.key.participant || msg.key.remoteJid;
      if (!eliteNumbers.includes(sender.split('@')[0])) return;

      const mentions =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

      if (!mentions.length) {
        return sock.sendMessage(jid, {
          text: '⚠️ يرجي الإشارة للشخص.'
        }, { quoted: msg });
      }

      const target = mentions[0];
      const targetNumber = target.split('@')[0];

      // ⏱️ مدة افتراضية 4 دقائق
      let totalSeconds = 240;
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text || '';

      const timeArg = text.match(/(\d{1,2}),(\d{1,2})/);
      if (timeArg) {
        totalSeconds = (+timeArg[1] * 60) + +timeArg[2];
      }

      const startTime = Date.now();
      const endTime = startTime + totalSeconds * 1000;

      const banned = loadBanned();
      banned[jid] = { target, startTime, endTime };
      saveBanned(banned);

      // 📨 رسالة العداد (نفس النص الأصلي)
      const countdownMsg = await sock.sendMessage(jid, {
        text:
`🫦 @${targetNumber} الان انت صرت عبد عند عمك اكستڤيان.
اذا فكرت تكتب أي شي راح يتم طردك.

⏳ باقي ${Math.floor(totalSeconds / 60)} دقيقة و ${totalSeconds % 60} ثانية.`,
        mentions: [target]
      }, { quoted: msg });

      // 🔄 تحديث الرسالة
      intervals[jid] = setInterval(async () => {
        const remaining = Math.floor((endTime - Date.now()) / 1000);
        if (remaining <= 0) return;

        const min = Math.floor(remaining / 60);
        const sec = remaining % 60;

        try {
          await sock.sendMessage(jid, {
            edit: countdownMsg.key,
            text:
`🫦 @${targetNumber} الان انت صرت عبد عند عمك اكستڤيان.
اذا فكرت تكتب أي شي راح يتم طردك.

⏳ باقي ${min} دقيقة و ${sec} ثانية.`,
            mentions: [target]
          });
        } catch {}
      }, 1000);

      // 🚫 لو كتب = طرد
      const listener = async (update) => {
        const message = update.messages?.[0];
        if (!message || message.key.remoteJid !== jid) return;

        const author = message.key.participant;
        if (author !== target) return;

        await sock.sendMessage(jid, {
          text:
`أوف.. ي العبد خلفت قانون عمك اكستڤيان.
مع السلامه ي عبد عمك اكستڤيان 🫦`,
          mentions: [target]
        });

        await sock.groupParticipantsUpdate(jid, [target], 'remove');

        clearInterval(intervals[jid]);
        delete banned[jid];
        saveBanned(banned);
        sock.ev.off('messages.upsert', listener);
      };

      sock.ev.on('messages.upsert', listener);

      // ✅ انتهاء الوقت
      timers[jid] = setTimeout(async () => {
        clearInterval(intervals[jid]);
        delete banned[jid];
        saveBanned(banned);

        await sock.sendMessage(jid, {
          text:
`🥵 لقد انتهى الوقت يا عبد اكستڤيان،
الآن صرت حر ولكن لا تعيدها مرة ثانية 🫦`,
          mentions: [target]
        });

        sock.ev.off('messages.upsert', listener);
      }, totalSeconds * 1000);

    } catch (e) {
      console.error('❌ خطأ أمر اسكت:', e);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ حصل خطأ أثناء تنفيذ الأمر.'
      }, { quoted: msg });
    }
  }
};
