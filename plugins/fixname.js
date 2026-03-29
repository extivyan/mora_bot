// ملف: plugins/fixname.js
// • Feature : Replace Old API Links
// • Developers : EXT Team

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

module.exports = {
  status: "on",
  name: 'Fix Name',
  command: ['fixname', 'تغير'],
  category: 'tools',
  description: 'استبدال روابط API القديمة داخل ملفات البلجنز',
  hidden: false,
  version: '1.0',

  async execute(sock, msg) {
    try {
      const body =
        msg.message?.extendedTextMessage?.text ||
        msg.message?.conversation ||
        '';

      const args = body.trim().split(' ').slice(1);

      const folder = path.join(__dirname); // plugins folder
      const oldNames = [
        'https://blackwave-api.vercel.app/',
      ];
      const newName = 'https://blackwave-api.vercel.app/';

      let count = 0;

      const files = (await fsp.readdir(folder)).filter(f => f.endsWith('.js'));

      for (const file of files) {
        const filePath = path.join(folder, file);
        const content = await fsp.readFile(filePath, 'utf8');
        let replaced = content;

        for (const name of oldNames) {
          const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escaped, 'giu');
          replaced = replaced.replace(regex, newName);
        }

        if (replaced !== content) {
          await fsp.writeFile(filePath, replaced, 'utf8');
          count++;
        }
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `✅ تم استبدال الروابط في ${count} ملف${count !== 1 ? 'ات' : ''}.`
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error('❌ FixName Error:', err);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ حصل خطأ أثناء تنفيذ الأمر.' },
        { quoted: msg }
      );
    }
  }
};
