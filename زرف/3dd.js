const { getUniqueKicked } = require('../haykala/dataUtils');
const { isFounder, isOwnerbot, isDeveloper } = require('../haykala/developer');

module.exports = {
  command: 'عدد',
  usage: '.عدد',

  async execute(sock, msg) {
    const senderId = msg.key.participant || msg.key.remoteJid;
    if (!isFounder(senderId) && !isOwnerbot(senderId) && !isDeveloper(senderId)) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ هذا الأمر مخصص للمطور والمؤسس والمالك فقط!'
      }, { quoted: msg });
      return;
    }

    const kickedSet = getUniqueKicked();
    const total = kickedSet.size;

    const levels = [
      { threshold: 0, emoji: '🥉' },       // برونزي
      { threshold: 50, emoji: '🥈' },      // فضي
      { threshold: 100, emoji: '🥇' },     // ذهبي
      { threshold: 200, emoji: '💎' },     // ماسي
      { threshold: 400, emoji: '👑' },     // ملكي
      { threshold: 800, emoji: '🔥' },     // ناري
      { threshold: 1600, emoji: '⚡' },    // كهربائي
      { threshold: 3200, emoji: '🌌' },    // كوني
      { threshold: 6400, emoji: '🛡️' },   // أسطوري حماية
      { threshold: 12800, emoji: '⚔️' },  // أسطوري قتال
      { threshold: 25600, emoji: '🌟' },   // نجومي
      { threshold: 51200, emoji: '🚀' },   // صاروخي
      { threshold: 102400, emoji: '🪐' },  // كوكبي
      { threshold: 204800, emoji: '☯️' },  // يِن يانغ (توازن)
      { threshold: 409600, emoji: '👾' },  // مخلوق خارق
      { threshold: 819200, emoji: '♻️' },  // لانهائي/تجديد
      { threshold: 1638400, emoji: '♾️' }  // لانهائي
    ];

    let level = 0;
    let emoji = '🔶';

    for (let i = levels.length - 1; i >= 0; i--) {
      if (total >= levels[i].threshold) {
        level = i;
        emoji = levels[i].emoji;
        break;
      }
    }

    const message = `
┏━━━━━━━━━━━━━━━━━━━┓
┃   ✨ عدد التصفية ✨
┃━━━━━━━━━━━━━━━━━━━┃
┃ 🎯 المستوى : ${level} ${emoji}
┃ 📊 عدد المطروودين : ${total}
┗━━━━━━━━━━━━━━━━━━━┛

⚡ الحقوق محفوظة لـ FHS ⚡
    `;

    await sock.sendMessage(msg.key.remoteJid, {
      text: message
    }, { quoted: msg });
  }
};