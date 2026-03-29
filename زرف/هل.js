const { jidDecode } = require('@whiskeysockets/baileys');
const { getUniqueKicked } = require('../haykala/dataUtils');
const { isFounder, isOwnerbot, isDeveloper } = require('../haykala/developer');

const decode = jid => (jidDecode(jid)?.user || jid?.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
  command: ['هل'],
  usage: '.هل [منشن | رقم | رد]',
  async execute(sock, msg, args) {
    try {
      const groupJid = msg.key.remoteJid;
      const sender = decode(msg.key.participant || msg.key.remoteJid);
      
      if (!isFounder(sender) && !isOwnerbot(sender) && !isDeveloper(sender)) {
        return await sock.sendMessage(groupJid, {
          text: '❌ هذا الأمر مخصص للمطور والمؤسس والمالك فقط!'
        }, { quoted: msg });
      }

      let targetJid;
      let showNumber = false;

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
      const mentionedJid = contextInfo.mentionedJid;
      const quotedParticipant = contextInfo.participant;

      if (Array.isArray(mentionedJid) && mentionedJid.length > 0) {
        targetJid = mentionedJid[0];
      } else if (args?.[0]) {
        const cleaned = args[0].replace(/\D/g, '');
        if (!cleaned) throw new Error('❌ لم تحدد رقمًا صحيحًا.');
        targetJid = `${cleaned}@s.whatsapp.net`;
        showNumber = true;
      } else if (quotedParticipant) {
        targetJid = decode(quotedParticipant);
      } else {
        targetJid = sender;
      }

      const number = parseInt(targetJid.split('@')[0], 10);
      const kickedSet = getUniqueKicked();

      const isKicked = kickedSet.has(number);

      const response = showNumber
        ? (isKicked
            ? `✅ نعم، الرقم (${number}) تم زرفه مسبقًا.`
            : `❌ لا، الرقم (${number}) لم يتم زرفه.`)
        : (isKicked
            ? '✅ نعم، تم زرفه مسبقًا'
            : '❌ لا، لم يتم زرفه');

      const finalMsg = `${response}\n\n⚡ الحقوق محفوظة لـ FHS ⚡`;

      await sock.sendMessage(groupJid, {
        text: finalMsg
      }, { quoted: msg });

    } catch (error) {
      console.error('❌ خطأ في أمر هل:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ حدث خطأ أثناء تنفيذ الأمر:\n${error.message || error.toString()}`
      }, { quoted: msg });
    }
  }
};