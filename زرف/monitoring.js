const fs = require('fs');
const path = require('path');
const { isFounder, isOwnerbot, isDeveloper, getDevData } = require('../haykala/developer.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const dataDir = path.join(__dirname, '..', 'data');
const monitorFile = path.join(dataDir, 'monitorState.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(monitorFile)) fs.writeFileSync(monitorFile, JSON.stringify({}));

const loadMonitorState = () => {
  try {
    return JSON.parse(fs.readFileSync(monitorFile));
  } catch (err) {
    console.error("❌ خطأ في قراءة ملف المراقبة:", err);
    return {};
  }
};

const saveMonitorState = (data) => {
  try {
    fs.writeFileSync(monitorFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ خطأ في حفظ ملف المراقبة:", err);
  }
};

let handlerAttached = false;

module.exports = {
  command: 'راقب',
  async execute(sock, m) {
    const groupId = m.key.remoteJid;
    const sender = m.key.participant || m.participant;

    if (!groupId.endsWith('@g.us')) {                         return sock.sendMessage(groupId, {                        text: '❌ هذا الأمر يعمل فقط داخل المجموعات.'         }, { quoted: m });                                    }
                                                            if (!isFounder(sender) && !isOwnerbot(sender) && !isDeveloper(sender)) {
      return sock.sendMessage(groupId, {                        text: '❌ هذا الأمر مخصص للمطور والمؤسس والمالك فقط!'
      }, { quoted: m });                                    }                                                   
    const state = loadMonitorState();

    if (state[groupId]) {                                     delete state[groupId];                                  saveMonitorState(state);
      return sock.sendMessage(groupId, {                        text: '✅ تم إلغاء المراقبة عن المجموعة.\n\n⚡ الحقوق محفوظة لـ FHS ⚡'
      }, { quoted: m });                                    }                                                   
    state[groupId] = true;                                  saveMonitorState(state);                                sock.sendMessage(groupId, {
      text: '✅ تم تفعيل نظام المراقبة بنجاح.\n\n⚡ الحقوق محفوظة لـ FHS ⚡'                                        }, { quoted: m });

    if (handlerAttached) return;
                                                            sock.ev.on('group-participants.update', async (update) => {
      const activeState = loadMonitorState();                 const isMonitored = activeState[update.id];       
      if (!isMonitored || (update.action !== 'demote' && update.action !== 'remove')) return;                   
      try {                                                     const devData = getDevData();                           const founderNumbers = devData.founder || [];
        const ownerNumbers = devData.ownerbot || [];            const developerNumbers = devData.developers || [];

        const protectedJids = [
          ...founderNumbers.map(num => num.replace('@lid', '@s.whatsapp.net')),                                           ...ownerNumbers.map(num => num.replace('@lid', '@s.whatsapp.net')),                                             ...developerNumbers.map(num => num.replace('@lid', '@s.whatsapp.net'))
        ];                                                                                                              const protectedUser = update.participants.find(participant =>                                                     protectedJids.includes(participant)                   );
                                                                if (protectedUser) {                                      await sock.sendMessage(update.id, {
            text: update.action === 'demote'
              ? '🚨 *تم تنزيل أحد المطورين/المالكين/المؤسس من الإدمن!*\n\n⚠️ جاري تنفيذ فنش القروب...\n\n⚡ الحقوق محفوظة لـ FHS ⚡'                                                   : '🚨 *تم طرد أحد المطورين/المالكين/المؤسس من المجموعة!*\n\n⚠️ جاري تنفيذ فنش القروب...\n\n⚡ الحقوق محفوظة لـ FHS ⚡'                                               });
                                                                  delete activeState[update.id];                          saveMonitorState(activeState);
                                                                  const metadata = await sock.groupMetadata(update.id);
          const botNumber = jidDecode(sock.user.id)?.user + '@s.whatsapp.net';                                  
          const zarfData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'zarf.json')));
                                                                  const excludedNumbers = [                                 botNumber,
            ...protectedJids                                      ];                                            
          const uniqueExcluded = [...new Set(excludedNumbers.filter(Boolean))];                                 
          const membersToDemote = metadata.participants             .filter(p => p.admin && !uniqueExcluded.includes(p.id))
            .map(p => p.id);                                                                                              if (membersToDemote.length > 0) {
            await sock.groupParticipantsUpdate(update.id, membersToDemote, 'demote').catch(() => {});
          }                                                                                                               if (zarfData.reaction_status === "on" && zarfData.reaction) {                                                     await sock.sendMessage(update.id, {                       react: { text: zarfData.reaction, key: m.key }                                                                }).catch(() => {});                                   }
                                                                  if (zarfData.group?.status === "on") {                    if (zarfData.group.newSubject)
              await sock.groupUpdateSubject(update.id, zarfData.group.newSubject).catch(() => {});                          if (zarfData.group.newDescription)
              await sock.groupUpdateDescription(update.id, zarfData.group.newDescription).catch(() => {});
          }                                                                                                               if (zarfData.media?.status === "on" && zarfData.media.image) {                                                    const imgPath = path.join(process.cwd(), zarfData.media.image);
            if (fs.existsSync(imgPath)) {                             const imageBuffer = fs.readFileSync(imgPath);
              await sock.updateProfilePicture(update.id, imageBuffer).catch(() => {});                                      }
          }                                                                                                               if (zarfData.messages?.status === "on") {
            const allParticipants = metadata.participants.map(p => p.id);
            if (zarfData.messages.mention) {                          await sock.sendMessage(update.id, {                       text: zarfData.messages.mention,
                mentions: allParticipants                             }).catch(() => {});                                   }
            if (zarfData.messages.final) {                            await sock.sendMessage(update.id, {                       text: `${zarfData.messages.final}\n\n⚡ الحقوق محفوظة لـ FHS ⚡`                                              }).catch(() => {});                       
              if (zarfData.audio?.status === "on" && zarfData.audio.file) {                                                     const audioPath = path.join(process.cwd(), zarfData.audio.file);
                if (fs.existsSync(audioPath)) {
                  const audioBuffer = fs.readFileSync(audioPath);                                                                 await sock.sendMessage(update.id, {
                    audio: audioBuffer,                                     mimetype: 'audio/mp4',                                  ptt: true
                  }).catch(() => {});                                   }                                                     }
            }                                                     }                                             
          const toKick = metadata.participants                      .filter(p => !uniqueExcluded.includes(p.id))            .map(p => p.id);

          if (toKick.length > 0) {
            await sock.groupParticipantsUpdate(update.id, toKick, 'remove').catch(() => {});                              }
        }                                                                                                             } catch (err) {
        console.error("❌ خطأ أثناء تنفيذ الأمر:", err);      }                                                     });
                                                            handlerAttached = true;                               }
