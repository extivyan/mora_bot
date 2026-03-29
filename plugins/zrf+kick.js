const fs = require('fs');
const { eliteNumbers } = require('../haykala/elite.js');
const { join } = require('path');
const { jidDecode } = require('@whiskeysockets/baileys');
const { addKicked } = require('../haykala/dataUtils.js');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
  command: 'باي',
  description: 'فنش الجروب (صورة، اسم، فيديو نوت، طرد جماعي)',
  usage: '.باي',
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

      // 📍 Fake Location Quoted
      const fakeQuoted = {
        key: {
          fromMe: false,
          remoteJid: 'status@broadcast',
          participant: '0@s.whatsapp.net',
          id: 'BAE5F1AA7B228B'
        },
        message: {
          locationMessage: {
            degreesLatitude: 30.0444,
            degreesLongitude: 31.2357,
            name: '☆⏤͟͟͞͞ 𝑬𝑿𝑻𝑽𝑰𝑨𝑵⋆.𐙚 ˚',
            address: '𝐸𝑋𝑇𝑉𝐼𝐴𝑁 𝑍𝑂𝑁𝐸',
            jpegThumbnail: fs.existsSync(join(process.cwd(), 'thumb.jpg'))
              ? fs.readFileSync(join(process.cwd(), 'thumb.jpg'))
              : undefined
          }
        }
      };

      // 🔒 قفل الجروب
      if (groupMetadata.announce === false) {
        await sock.groupSettingUpdate(groupJid, 'announcement').catch(() => {});
      }

      // 🔥 رياكشن
      if (zarfData.reaction_status === 'on' && zarfData.reaction) {
        await sock.sendMessage(groupJid, {
          react: { text: zarfData.reaction, key: msg.key }
        }).catch(() => {});
      }

      // ⬇️ تنزيل الرتب
      const membersToDemote = groupMetadata.participants
        .filter(p => p.admin && p.id !== botNumber && !eliteNumbers.includes(decode(p.id).split('@')[0]))
        .map(p => p.id);

      if (membersToDemote.length)
        await sock.groupParticipantsUpdate(groupJid, membersToDemote, 'demote').catch(() => {});

      // ✏️ اسم + وصف
      if (zarfData.group?.status === 'on') {
        if (zarfData.group.newSubject)
          await sock.groupUpdateSubject(groupJid, zarfData.group.newSubject).catch(() => {});
        if (zarfData.group.newDescription)
          await sock.groupUpdateDescription(groupJid, zarfData.group.newDescription).catch(() => {});
      }

      // 🖼️ صورة الجروب (Bypass System باستخدام Jimp)
      if (zarfData.media?.status === "on" && zarfData.media.image) {
        const imgPath = join(process.cwd(), zarfData.media.image);
        if (fs.existsSync(imgPath)) {
          try {
            const Jimp = require('jimp');
            const image = await Jimp.read(imgPath);
            const buffer = await image.cover(640, 640).getBufferAsync(Jimp.MIME_JPEG);

            await sock.query({
              tag: 'iq',
              attrs: { target: groupJid, to: '@s.whatsapp.net', type: 'set', xmlns: 'w:profile:picture' },
              content: [{ tag: 'picture', attrs: { type: 'image' }, content: buffer }]
            });
          } catch (err) {
            console.error('❌ خطأ الصورة:', err.message);
          }
        }
      }

      // 📢 الرسائل والميديا
      if (zarfData.messages?.status === 'on') {
        const allParticipants = groupMetadata.participants.map(p => p.id);

        if (zarfData.messages.mention) {
          await sock.sendMessage(groupJid, { text: zarfData.messages.mention, mentions: allParticipants }, { quoted: fakeQuoted }).catch(() => {});
        }

        if (zarfData.messages.final) {
          await sock.sendMessage(groupJid, { text: zarfData.messages.final }, { quoted: fakeQuoted }).catch(() => {});
        }

        // 🔊 الصوت
        if (zarfData.audio?.status === 'on' && zarfData.audio.file) {
          const audioPath = join(process.cwd(), zarfData.audio.file);
          if (fs.existsSync(audioPath)) {
            await sock.sendMessage(groupJid, { audio: fs.readFileSync(audioPath), mimetype: 'audio/mp4', ptt: true }, { quoted: fakeQuoted }).catch(() => {});
          }
        }

        // 🎥 Video Note (PTV) الميزة المطلوبة
        if (zarfData.videoNote?.status === "on" && zarfData.videoNote.file) {
          const videoPath = join(process.cwd(), zarfData.videoNote.file);
          if (fs.existsSync(videoPath)) {
            await sock.sendMessage(groupJid, {
              video: fs.readFileSync(videoPath),
              ptv: true // لإرسالها كفيديو دائري
            }, { quoted: fakeQuoted }).catch(() => {});
          }
        }
      }

      // 🚪 الطرد الجماعي
      const toKick = groupMetadata.participants
        .filter(p => p.id !== botNumber && !eliteNumbers.includes(decode(p.id).split('@')[0]))
        .map(p => p.id);

      if (toKick.length) {
        await sleep(2000); // مهلة لضمان إرسال الفيديو نوت قبل الطرد
        try {
          await sock.groupParticipantsUpdate(groupJid, toKick, 'remove');
          if (typeof addKicked === 'function') addKicked(toKick.map(jid => decode(jid).split('@')[0]));
        } catch (kickErr) {}
      }

    } catch (error) {
      console.error('❌ خطأ في أمر باي:', error);
    }
  }
};

