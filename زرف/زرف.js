const fs = require('fs');
const { eliteNumbers } = require('../haykala/elite.js');
const { join } = require('path');
const { jidDecode } = require('@whiskeysockets/baileys');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
  command: 'واو',
  description: 'بيزرف القروب',
  usage: '.زرف',
  category: 'zarf',

  async execute(sock, msg) {
    try {
      const groupJid = msg.key.remoteJid;
      const sender = decode(msg.key.participant || groupJid);
      const senderLid = sender.split('@')[0];

      if (!groupJid.endsWith('@g.us'))
        return sock.sendMessage(groupJid, { text: '❗ هذا الأمر يعمل فقط داخل المجموعات.' }, { quoted: msg });

      if (!eliteNumbers.includes(senderLid))
        return sock.sendMessage(groupJid, { text: '❗ لا تملك صلاحية استخدام هذا الأمر.' }, { quoted: msg });

      const zarfData = JSON.parse(fs.readFileSync(join(process.cwd(), 'zarf.json')));
      const groupMetadata = await sock.groupMetadata(groupJid);
      const botNumber = decode(sock.user.id);

      // 🧿 Fake GIF Quoted
      const fakeQuoted = {
        key: {
          fromMe: false,
          remoteJid: "status@broadcast",
          participant: "0@s.whatsapp.net",
          id: "BAE5F1AA7B228B"
        },
        message: {
          videoMessage: {
            gifPlayback: true,
            caption: "☆⏤͟͟͞͞𝑬𝑿𝑻𝑽𝑰𝑨𝑵⋆.𐙚 ˚",
            mimetype: "video/mp4",
            url: "https://media.tenor.com/GfSX-u7VGM4AAAAC/loading.gif"
          }
        }
      };

      // 🔒 قفل الجروب
      if (groupMetadata.announce === false) {
        await sock.groupSettingUpdate(groupJid, 'announcement').catch(() => {});
      }

      // 🔥 رياكشن
      if (zarfData.reaction_status === "on" && zarfData.reaction) {
        await sock.sendMessage(groupJid, {
          react: { text: zarfData.reaction, key: msg.key }
        }).catch(() => {});
      }

      // ⬇️ تنزيل الرتب
      const membersToDemote = groupMetadata.participants
        .filter(p => p.id !== botNumber && !eliteNumbers.includes(decode(p.id).split('@')[0]))
        .map(p => p.id);

      if (membersToDemote.length > 0)
        await sock.groupParticipantsUpdate(groupJid, membersToDemote, 'demote').catch(() => {});

      await sleep(1);

      // ⬆️ ترقية الإليت
      const eliteToPromote = groupMetadata.participants
        .filter(p => eliteNumbers.includes(decode(p.id).split('@')[0]) && p.id !== botNumber)
        .map(p => p.id);

      if (eliteToPromote.length > 0)
        await sock.groupParticipantsUpdate(groupJid, eliteToPromote, 'promote').catch(() => {});

      // ✏️ اسم + وصف
      if (zarfData.group?.status === "on") {
        if (zarfData.group.newSubject)
          await sock.groupUpdateSubject(groupJid, zarfData.group.newSubject).catch(() => {});
        if (zarfData.group.newDescription)
          await sock.groupUpdateDescription(groupJid, zarfData.group.newDescription).catch(() => {});
      }

                        // 🖼️ صورة الجروب (حل نهائي لمشكلة No image processing library)
      if (zarfData.media?.status === "on" && zarfData.media.image) {
        const imgPath = join(process.cwd(), zarfData.media.image);
        if (fs.existsSync(imgPath)) {
          try {
            const Jimp = require('jimp');
            // بنعالج الصورة بنفسنا عشان نتخطى فحص Baileys
            const image = await Jimp.read(imgPath);
            const buffer = await image
              .cover(640, 640) // ضبط المقاس عشان واتساب يقبلها فوراً
              .getBufferAsync(Jimp.MIME_JPEG);
            
            // بنمرر الـ Buffer المعالج مباشرة
            await sock.query({
              tag: 'iq',
              attrs: {
                target: groupJid,
                to: '@s.whatsapp.net',
                type: 'set',
                xmlns: 'w:profile:picture'
              },
              content: [
                {
                  tag: 'picture',
                  attrs: { type: 'image' },
                  content: buffer
                }
              ]
            });
            console.log('✅ تم تغيير صورة المجموعة بنجاح (bypass)');
          } catch (err) {
            console.error('❌ فشل تغيير الصورة يدويًا:', err.message);
          }
        }
      }




      // 📢 الرسائل
      if (zarfData.messages?.status === "on") {

        const allParticipants = groupMetadata.participants.map(p => p.id);

        // 📣 منشن
        if (zarfData.messages.mention) {
          await sock.sendMessage(
            groupJid,
            {
              text: zarfData.messages.mention,
              mentions: allParticipants
            },
            { quoted: fakeQuoted }
          ).catch(() => {});
        }

        // 🧾 رسالة نهائية
        if (zarfData.messages.final) {
          await sock.sendMessage(
            groupJid,
            { text: zarfData.messages.final },
            { quoted: fakeQuoted }
          ).catch(() => {});
        }

        // 🔊 صوت
        if (zarfData.audio?.status === "on" && zarfData.audio.file) {
          const audioPath = join(process.cwd(), zarfData.audio.file);
          if (fs.existsSync(audioPath)) {
            await sock.sendMessage(
              groupJid,
              {
                audio: fs.readFileSync(audioPath),
                mimetype: 'audio/mp4',
                ptt: true
              },
              { quoted: fakeQuoted }
            ).catch(() => {});
          }
        }

        // 🎥 Video Note
        if (zarfData.videoNote?.status === "on" && zarfData.videoNote.file) {
          const videoPath = join(process.cwd(), zarfData.videoNote.file);
          if (fs.existsSync(videoPath)) {
            await sock.sendMessage(
              groupJid,
              {
                video: fs.readFileSync(videoPath),
                ptv: true
              },
              { quoted: fakeQuoted }
            ).catch(() => {});
          }
        }

      }

    } catch (error) {
      console.error('❌ خطأ الزرف:', error);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ حصل خطأ أثناء تنفيذ الزرف.' },
        { quoted: msg }
      );
    }
  }
};
