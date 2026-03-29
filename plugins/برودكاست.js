// File: plugins/broadcast.js
const { eliteNumbers } = require('../haykala/elite.js');

module.exports = {
  command: 'برودكاست',
  description: '📢 إذاعة رسالة لكل الجروبات (نخبة فقط)',
  category: 'developer',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = sender.split('@')[0];

    // نخبة فقط
    if (!eliteNumbers.includes(senderNumber)) {
      return await sock.sendMessage(
        chatId,
        { text: '❌ هذا الأمر مخصص للنخبة فقط.' },
        { quoted: msg }
      );
    }

    const fullText =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '';

    // أي نص بعد .برودكاست
    const body = fullText.replace('.برودكاست', '').trim();

    if (!body) {
      return await sock.sendMessage(
        chatId,
        { text: '⚠️ مثال:\n.برودكاست هاي' },
        { quoted: msg }
      );
    }

    try {
      const startTime = Date.now();
      const groups = await sock.groupFetchAllParticipating();
      const groupIds = Object.keys(groups);

      const header = '*رساله من المطور⚡️*';
      const finalText = `${header}\n${body}`;

      await sock.sendMessage(
        chatId,
        { text: `📢 جاري الإذاعة في ${groupIds.length.toLocaleString('en-US')} جروب...` },
        { quoted: msg }
      );

      for (const id of groupIds) {
        await sock.sendMessage(id, { text: finalText });
        await new Promise((r) => setTimeout(r, 1500)); // anti-ban
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const now = new Date();

      await sock.sendMessage(
        chatId,
        {
          text:
            `✅ تمت الإذاعة بنجاح\n\n` +
            `🕒 الوقت: ${now.toLocaleTimeString('en-US')}\n` +
            `📅 التاريخ: ${now.toLocaleDateString('en-US')}\n` +
            `⏱️ المدة: ${duration.toLocaleString('en-US')} ثانية`,
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error('Broadcast Error:', err);
      await sock.sendMessage(
        chatId,
        { text: '❌ حدث خطأ أثناء تنفيذ الإذاعة.' },
        { quoted: msg }
      );
    }
  },
};