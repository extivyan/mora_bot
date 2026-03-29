const { getPlugins } = require('../handlers/plugins.js');

module.exports = {
  status: "on",
  name: 'Bot Commands',
  command: ['سجلات'],
  category: 'tools',
  description: 'قائمة الأوامر بحسب الفئة مع Forored من القناة',
  hidden: false,
  version: '3.2',

  async execute(sock, msg) {
    try {
      const body =
        msg.message?.extendedTextMessage?.text ||
        msg.message?.conversation ||
        '';

      const args = body.trim().split(' ').slice(1);
      const plugins = getPlugins();
      const categories = {};

      // تجميع الأوامر حسب الفئة
      Object.values(plugins).forEach((plugin) => {
        if (plugin.hidden) return;

        const category = plugin.category?.toLowerCase() || 'others';
        if (!categories[category]) categories[category] = [];

        let commandDisplay = '';

        if (Array.isArray(plugin.command) && plugin.command.length > 1) {
          commandDisplay = `- ${plugin.command.map(cmd => `\`${cmd}\``).join(' - ')}`;
        } else {
          const cmd = Array.isArray(plugin.command)
            ? plugin.command[0]
            : plugin.command;
          commandDisplay = `- \`${cmd}\``;
        }

        if (plugin.description) {
          commandDisplay += `\nالوصف: \`\`\`${plugin.description}\`\`\``;
        }

        categories[category].push(commandDisplay + '\n');
      });

      // بناء المنيو
      let menu = '┏━❀ *𝐄𝐗𝐓𝐕𝐈𝐀𝐍 𝓋𝟹* ❀━┓\n\n';

      if (args.length === 0) {
        menu += '╭─── *الفئات المتوفرة:*\n';
        for (const cat of Object.keys(categories)) {
          menu += `│ ◦ \`${cat}\`\n`;
        }
        menu += '╰──────────────\n';
        menu += '\nاكتب `.سجلات [فئة]` لعرض أوامرها.\n';
      } else {
        const requestedCategory = args.join(' ').toLowerCase();

        if (!categories[requestedCategory]) {
          return await sock.sendMessage(
            msg.key.remoteJid,
            {
              text: `❌ الفئة *${requestedCategory}* غير موجودة.\nاكتب \`.سجلات\` لعرض الفئات.`,
              contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: '120363426138973414@newsletter',
                  newsletterName: ' ๋࣭⋆˚𓂅𝐄𝐗𝐕𝐈𝐀𝐍𓏲֗  ๋࣭⋆˚',
                  serverMessageId: 970
                }
              }
            },
            { quoted: msg }
          );
        }

        menu += `╭─❒ *${requestedCategory.toUpperCase()}*\n`;
        menu += categories[requestedCategory].join('\n');
        menu += '╰──\n';
      }

      menu += '\n┗━❀ *𝐄𝐗𝐕𝐈𝐀𝐍* ❀━┛';

      // 🔥 إرسال المنيو فقط مع Forored من القناة
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: menu,
          contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363426138973414@newsletter',
              newsletterName: ' ๋࣭⋆˚𓂅𝐄𝐗𝐕𝐈𝐀𝐍𓏲֗  ๋࣭⋆˚',
              serverMessageId: 970
            }
          }
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error('❌ Menu Error:', error);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ حصل خطأ أثناء إنشاء قائمة الأوامر.' },
        { quoted: msg }
      );
    }
  }
};
