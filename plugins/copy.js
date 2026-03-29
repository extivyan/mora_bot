const fs = require('fs-extra');
const path = require('path');

const backupDir = path.join(process.cwd(), 'data', 'group_backups');
fs.ensureDirSync(backupDir);

module.exports = {
    command: ['كوبي'],
    aliases: ['copy'],
    category: 'group',
    description: "إدارة نسخ المجموعات (نسخ، لصق، عرض، حذف).",
    group: true,
    status: 'on',
    version: '2.5',

    async execute(sock, msg, args, isDeveloper) {
        try {
            const groupJid = msg.key.remoteJid;

            // استخراج النص
            const body = (
                msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                msg.message?.imageMessage?.caption ||
                msg.message?.videoMessage?.caption ||
                ''
            ).trim();

            // تقسيم الأمر
            const parts = body.split(/\s+/);
            parts.shift(); // إزالة "كوبي"

            const subCommand = parts[0]?.toLowerCase();
            const backupName = parts[1];

            // ============= رسالة المساعدة =============
            if (!subCommand) {
                const helpMessage = `
*╔═════ 「 إدارة النسخ 」 ═════╗*
*║ 📋 .كوبي نسخ <اسم>*
*║ 📥 .كوبي لصق <اسم>*
*║ 📂 .كوبي عرض*
*║ 🔎 .كوبي عرض <اسم>*
*║ 🗑️ .كوبي حذف <اسم>*
*╚══════════════════╝*
                `;
                return sock.sendMessage(groupJid, { text: helpMessage }, { quoted: msg });
            }

            // ============= التحقق من صلاحيات المستخدم =============
            const metadata = await sock.groupMetadata(groupJid);
            const senderId = msg.key.participant;
            const sender = metadata.participants.find(p => p.id === senderId);
            const isAdmin = sender?.admin === 'admin' || sender?.admin === 'superadmin';

            if (!isAdmin && !isDeveloper) {
                return sock.sendMessage(groupJid, { text: "❌ هذا الأمر للمشرفين والمطور فقط." }, { quoted: msg });
            }

            const requiresBackupName = ['نسخ', 'لصق', 'حذف'];
            if (requiresBackupName.includes(subCommand) && !backupName) {
                return sock.sendMessage(groupJid, { text: `📂 لازم تكتب اسم النسخة.\nمثال:\n.كوبي ${subCommand} سولو` }, { quoted: msg });
            }

            const backupPath = backupName ? path.join(backupDir, `${backupName}.json`) : null;

            // ============= تنفيذ الأوامر =============
            switch (subCommand) {

                // ==================== نسخ ====================
                case 'نسخ': {
                    await sock.sendMessage(groupJid, { text: `🔄 جاري حفظ نسخة "${backupName}"...` }, { quoted: msg });

                    try {
                        const currentMetadata = await sock.groupMetadata(groupJid);
                        const backupData = {
                            name: currentMetadata.subject,
                            desc: currentMetadata.desc?.toString() || 'لا يوجد وصف.',
                            copiedBy: msg.pushName,
                            timestamp: new Date().toISOString()
                        };

                        fs.writeJsonSync(backupPath, backupData, { spaces: 2 });

                        const text = `*✅ تم حفظ النسخة!*\n\n*🔖 الاسم:* ${backupData.name}\n*📝 الوصف:*\n\`\`\`${backupData.desc}\`\`\``;
                        return sock.sendMessage(groupJid, { text }, { quoted: msg });

                    } catch (e) {
                        return sock.sendMessage(groupJid, { text: `❌ خطأ أثناء الحفظ:\n${e.message}` }, { quoted: msg });
                    }
                }

                // ==================== لصق ====================
                case 'لصق': {
                    if (!fs.existsSync(backupPath)) {
                        return sock.sendMessage(groupJid, { text: `❌ مفيش نسخة بهذا الاسم: "${backupName}".` }, { quoted: msg });
                    }

                    await sock.sendMessage(groupJid, { text: `🔄 جاري تطبيق النسخة "${backupName}"...` }, { quoted: msg });

                    try {
                        const backupData = fs.readJsonSync(backupPath);

                        await sock.groupUpdateSubject(groupJid, backupData.name);
                        await sock.sendMessage(groupJid, { text: `📝 تم تغيير اسم الجروب.` }, { quoted: msg });

                        if (backupData.desc) {
                            await sock.groupUpdateDescription(groupJid, backupData.desc);
                            await sock.sendMessage(groupJid, { text: `ℹ️ تم تغيير الوصف.` }, { quoted: msg });
                        }

                        return sock.sendMessage(groupJid, { text: `✅ تم تطبيق النسخة "${backupName}" !` }, { quoted: msg });

                    } catch (e) {
                        if (e.message.includes('not-admin')) {
                            return sock.sendMessage(groupJid, { text: "❌ البوت لازم يكون أدمن." }, { quoted: msg });
                        }
                        return sock.sendMessage(groupJid, { text: `❌ خطأ أثناء اللصق:\n${e.message}` }, { quoted: msg });
                    }
                }

                // ==================== عرض ====================
                case 'عرض': {

                    // ---- عرض نسخة محددة ----
                    if (backupName) {
                        if (!fs.existsSync(backupPath)) {
                            return sock.sendMessage(groupJid, { text: `❌ النسخة "${backupName}" مش موجودة.` }, { quoted: msg });
                        }

                        const backupData = fs.readJsonSync(backupPath);
                        const text = `*🔎 تفاصيل النسخة: ${backupName}*\n\n*🔖 الاسم:* ${backupData.name}\n*📝 الوصف:*\n\`\`\`${backupData.desc}\`\`\`\n\n*👤 النسّاخ:* ${backupData.copiedBy}\n*📅 التاريخ:* ${new Date(backupData.timestamp).toLocaleDateString('ar-EG')}`;

                        return sock.sendMessage(groupJid, { text }, { quoted: msg });
                    }

                    // ---- عرض كل النسخ ----
                    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));

                    if (!files.length) {
                        return sock.sendMessage(groupJid, { text: "🗂️ مفيش نسخ محفوظة." }, { quoted: msg });
                    }

                    let text = "*📂 النسخ المحفوظة:*\n\n";
                    files.forEach((file, i) => {
                        text += `*${i + 1}.* \`${file.replace('.json', '')}\`\n`;
                    });

                    text += "\nللتفاصيل:\n.كوبي عرض <اسم>";

                    return sock.sendMessage(groupJid, { text }, { quoted: msg });
                }

                // ==================== حذف ====================
                case 'حذف': {
                    if (!fs.existsSync(backupPath)) {
                        return sock.sendMessage(groupJid, { text: `❌ النسخة "${backupName}" غير موجودة.` }, { quoted: msg });
                    }

                    fs.removeSync(backupPath);
                    return sock.sendMessage(groupJid, { text: `🗑️ تم حذف النسخة "${backupName}".` }, { quoted: msg });
                }

                default:
                    return sock.sendMessage(groupJid, { text: `❌ أمر "${subCommand}" غير معروف.` }, { quoted: msg });
            }

        } catch (err) {
            console.error("❌ خطأ:", err);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ حصل خطأ غير متوقع.' }, { quoted: msg });
        }
    }
};
