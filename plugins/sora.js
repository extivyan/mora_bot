const fetch = require('node-fetch');

module.exports = {
  status: "on",
  name: 'AI Draw',
  command: ['ارسم'],
  category: 'ai',
  description: 'تحويل نص إلى صورة أو فيديو بالذكاء الصناعي',
  hidden: false,
  version: '2.2',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;

    try {
      const body =
        msg.message?.extendedTextMessage?.text ||
        msg.message?.conversation ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        '';

      const args = body.trim().split(/\s+/).slice(1);
      const type = args.shift(); // صورة | فيديو
      const prompt = args.join(' ');

      // 🧠 Validation
      if (!['صورة', 'فيديو'].includes(type)) {
        return sock.sendMessage(
          chatId,
          {
            text:
              '❗ الاستخدام الصحيح:\n' +
              '.ارسم صورة <وصف>\n' +
              '.ارسم فيديو <وصف>'
          },
          { quoted: msg }
        );
      }

      if (!prompt) {
        return sock.sendMessage(
          chatId,
          { text: '⚠️ اكتب وصف بعد الأمر يا فنان.' },
          { quoted: msg }
        );
      }

      const endpoint = type === 'صورة' ? 'text2img' : 'text2vid';

      await sock.sendMessage(
        chatId,
        {
          text: `⏳ جاري ${type === 'صورة' ? 'توليد الصورة' : 'إنشاء الفيديو'}...`
        },
        { quoted: msg }
      );

      const apiUrl =
        `https://blackwave-api.vercel.app/api/v1/ai/draw/${endpoint}` +
        `?prompt=${encodeURIComponent(prompt)}`;

      // 🌐 Fetch with backbone
      const res = await fetch(apiUrl);

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const json = await res.json();

      // 🪵 Debug (وقت اللزوم)
      // console.log('AI RESPONSE:', json);

      // 🔥 Context من القناة
      const channelContext = {
        contextInfo: {
          isForwarded: true,
          forwardingScore: 1,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363426138973414@newsletter',
            newsletterName: ' ๋࣭⋆˚𓂅𝐄𝐗𝐕𝐈𝐀𝐍𓏲֗  ๋࣭⋆˚',
            serverMessageId: 970
          }
        }
      };

      // 🖼️ صورة
      if (type === 'صورة') {
        if (!json.imageUrl) {
          console.log('INVALID IMAGE RESPONSE:', json);
          throw new Error('API لم يرجع رابط صورة');
        }

        return sock.sendMessage(
          chatId,
          {
            image: { url: json.imageUrl },
            caption:
              `🎨 *AI IMAGE GENERATED*\n\n` +
              `📜 الوصف:\n${prompt}`
          },
          { ...channelContext, quoted: msg }
        );
      }

      // 🎬 فيديو
      if (type === 'فيديو') {
        if (!json.videoUrl) {
          console.log('INVALID VIDEO RESPONSE:', json);
          throw new Error('API لم يرجع رابط فيديو');
        }

        return sock.sendMessage(
          chatId,
          {
            video: { url: json.videoUrl },
            caption:
              `🎬 *AI VIDEO GENERATED*\n\n` +
              `📜 الوصف:\n${prompt}`
          },
          { ...channelContext, quoted: msg }
        );
      }

    } catch (error) {
      console.error('❌ Draw Error:', error);

      await sock.sendMessage(
        chatId,
        {
          text:
            `❌ حصل خطأ أثناء تنفيذ أمر الذكاء الصناعي.\n\n` +
            `📛 السبب الحقيقي:\n${error?.message || error}`
        },
        { quoted: msg }
      );
    }
  }
};
