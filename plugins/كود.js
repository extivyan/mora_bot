const fs = require('fs');
const path = require('path');
const { eliteNumbers } = require('../haykala/elite.js');

// دالة لحساب المسافة بين الكلمات (Levenshtein Distance)
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// دالة لإيجاد أقرب اسم
function findClosestMatch(input, options, maxDistance = 3) {
  let closest = null;
  let minDistance = Infinity;

  for (const option of options) {
    const distance = levenshteinDistance(input.toLowerCase(), option.toLowerCase());
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      closest = option;
    }
  }

  return closest;
}

module.exports = {
  command: ['كود'],
  description: '📁 جلب ملف من مجلد الإضافات بالاسم أو الرقم.',
  category: 'developer',

  async execute(sock, msg) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = sender.split('@')[0];
    if (!eliteNumbers.includes(senderNumber)) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ هذا الأمر مخصص للنخبة فقط.',
      }, { quoted: msg });
    }

    const pluginsDir = path.resolve('./plugins');
    const pluginFiles = fs.readdirSync(pluginsDir)
      .filter(file => file.endsWith('.js') && !file.startsWith('_'));

    const pluginNames = pluginFiles.map(v => v.replace('.js', ''));

    const fullText =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '';

    const commandName = fullText.split(' ')[0]?.toLowerCase();
    const inputText = fullText.slice(commandName.length).trim();

    if (!inputText) {
      const pluginList = pluginNames.map((v, index) =>
        `${(index + 1).toString().padEnd(3)}. ${v}`
      ).join('\n');

      return await sock.sendMessage(msg.key.remoteJid, {
        text: `
📁 قائمة ملفات البوت
━━━━━━━━━━━━━━━━
🔢 الإجمالي: ${pluginNames.length} ملف
━━━━━━━━━━━━━━━━
${pluginList}
━━━━━━━━━━━━━━━━
✍️ أرسل الرقم أو الاسم للحصول على الملف.
        `.trim()
      }, { quoted: msg });
    }

    let selectedPlugin = '';

    if (/^\d+$/.test(inputText)) {
      const index = parseInt(inputText) - 1;
      if (index >= 0 && index < pluginNames.length) {
        selectedPlugin = pluginNames[index];
      } else {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ الرقم غير صحيح! الرجاء إدخال رقم بين 1 و ${pluginNames.length}`
        }, { quoted: msg });
      }
    } else {
      if (pluginNames.includes(inputText)) {
        selectedPlugin = inputText;
      } else {
        const closestMatch = findClosestMatch(inputText, pluginNames);

        let replyMsg = `⚠️ *الملف "${inputText}" غير موجود!*`;
        if (closestMatch) replyMsg += `\n🔎 ربما تقصد: *${closestMatch}*`;
        replyMsg += `\n\n📂 استخدم الأمر مرة أخرى بدون اسم لعرض القائمة.`;

        return await sock.sendMessage(msg.key.remoteJid, { text: replyMsg }, { quoted: msg });
      }
    }

    try {
      const filePath = path.join(pluginsDir, `${selectedPlugin}.js`);
      const content = fs.readFileSync(filePath, 'utf-8');

      await sock.sendMessage(msg.key.remoteJid, {
        document: fs.readFileSync(filePath),
        mimetype: 'application/javascript',
        fileName: `${selectedPlugin}.js`
      }, { quoted: msg });

      const chunks = content.match(/[\s\S]{1,4000}/g) || [];

      for (let i = 0; i < chunks.length; i++) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `📄 *${selectedPlugin}.js* (جزء ${i + 1}/${chunks.length}):\n\n${chunks[i]}`
        }, { quoted: msg });
      }

    } catch (error) {
      console.error(error);
      return await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ حدث خطأ أثناء تحميل الملف: ${error.message}`,
      }, { quoted: msg });
    }
  }
};
