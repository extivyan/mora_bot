const fs = require('fs');
const path = require('path');
const { extractPureNumber } = require('../haykala/elite');

module.exports = {
  command: 'بروفايل',
  category: 'إدارة',
  description: '📌 عرض معلومات الشخص أو من تم منشنه أو كتابة رقمه.',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    // رابط صورة افتراضية شغال وموثوق
    const defaultPfp = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

    try {
      const requesterJid = msg.key.participant || msg.key.remoteJid;
      const requesterNumber = requesterJid.replace(/@s\.whatsapp\.net$/, '');
      const requesterName = msg.pushName || requesterNumber;

      let requesterPp = defaultPfp;
      try {
        const url = await sock.profilePictureUrl(requesterJid, 'image');
        if (url) requesterPp = url;
      } catch {
        requesterPp = defaultPfp;
      }

      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      const contextParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const parts = text.trim().split(/\s+/);

      let target;
      if (mentioned?.length) target = mentioned[0];
      else if (contextParticipant) target = contextParticipant;
      else if (parts[1] && parts[1].replace(/\D/g,'').length >= 5) {
        target = extractPureNumber(parts[1]) + '@s.whatsapp.net';
      } else {
        target = requesterJid;
      }

      const number = target.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');

      const countryCodes = {
        '966': '🇸🇦 السعودية', '20': '🇪🇬 مصر', '213': '🇩🇿 الجزائر',
        '218': '🇱🇾 ليبيا', '964': '🇮🇶 العراق', '965': '🇰🇼 الكويت',
        '971': '🇦🇪 الإمارات', '962': '🇯🇴 الأردن', '973': '🇧🇭 البحرين',
        '974': '🇶🇦 قطر', '961': '🇱🇧 لبنان', '90': '🇹🇷 تركيا',
        '1': '🇺🇸 أمريكا/كندا', '44': '🇬🇧 بريطانيا', '33': '🇫🇷 فرنسا'
      };

      const sortedCodes = Object.keys(countryCodes).sort((a, b) => b.length - a.length);
      let country = "❔ لم تُحدّد الدولة";
      for (let code of sortedCodes) {
        if (number.startsWith(code)) {
          country = countryCodes[code];
          break;
        }
      }

      let ppUrl = defaultPfp;
      try { 
        const url = await sock.profilePictureUrl(target, 'image');
        if (url) ppUrl = url;
      } catch {}

      let about = "❌ لا توجد نبذة";
      let status = "⏳ غير متوفّر";
      try {
        const userInfo = await sock.fetchStatus(target);
        about = userInfo.status?.trim() || about;
        if (userInfo.setAt) {
          const date = new Date(userInfo.setAt * 1000);
          status = date.toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' });
        }
      } catch {}

      const caption = `
╮━⪩ 👤 معلومات الحساب ⪨━╭

📱 الرقم: @${number}
🌍 الدولة: ${country}
💬 النبذة: ${about}
🕓 تحديث النبذة: ${status}

╰────────────⧉
⛨ مقدّم من: 𝐄𝐗𝐓𝐕Ｉ𝐀𝐍 𝓋𝟹
`;

      const fakeQuoted = {
        key: { fromMe: false, remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", id: "BAE5F1AA7B228B" },
        message: {
          extendedTextMessage: {
            text: requesterName,
            contextInfo: {
              externalAdReply: {
                title: requesterName,
                body: "رسالة موثقة",
                mediaType: 1,
                thumbnailUrl: requesterPp,
                renderLargerThumbnail: true,
                showAdAttribution: true,
                sourceUrl: "https://chat.whatsapp.com/XXXX"
              }
            }
          }
        }
      };

      await sock.sendMessage(
        chatId,
        {
          image: { url: ppUrl },
          caption,
          mentions: [target],
          contextInfo: {
            externalAdReply: {
              title: requesterName,
              body: " ⚶ ⊹ 𝑬𝑿𝑻𝑽𝑰𝑨𝑵 𝄢 ⊹",
              mediaType: 1,
              thumbnailUrl: requesterPp,
              sourceUrl: "https://t.me/YourChannel"
            }
          }
        },
        { quoted: fakeQuoted }
      );

    } catch (err) {
      console.error("خطأ في أمر بروفايل:", err);
      await sock.sendMessage(chatId, { text: "⚠️ حدث خطأ أثناء معالجة الطلب." }, { quoted: msg });
    }
  }
};

