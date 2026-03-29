module.exports = {
  command: "زواج",
  description: "يزوّج اتنين من الجروب عشوائيًا 😆",
  category: "fun",

  async execute(sock, m) {
    const chatId = m.key.remoteJid;

    if (!chatId.endsWith("@g.us")) {
      return sock.sendMessage(chatId, { text: "❌ هذا الأمر يعمل فقط في الجروبات." }, { quoted: m });
    }

    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata.participants
      .filter(p => !p.admin && p.id !== sock.user.id);

    if (participants.length < 3) {
      return sock.sendMessage(chatId, { text: "❌ لازم يكون فيه 3 أعضاء على الأقل عشان نعمل حفلة الزواج!" }, { quoted: m });
    }

    const shuffled = participants.sort(() => 0.5 - Math.random());
    const [groom, bride, officiant] = shuffled;

    const groomId = groom.id;
    const brideId = bride.id;
    const officiantId = officiant.id;

    const mahrList = [
      "مهره 10 قلوب حب ❤️",
      "مهره 5 كيلو شوكولاتة 🍫",
      "مهره 100 كرتونة بيبسي 🥤",
      "مهره سبيس تون 24/7 📺",
      "مهره جولة في كوكب الناميك 🌌",
      "مهره لايكات يومية لمدة سنة 👍",
      "مهره كوفي يومي لمدة شهر ☕",
      "مهره حفظ أنمي ناروتو كامل 🎥",
      "مهره بيت في عالم ون بيس 🏝️",
      "مهره 100 وردة من الحب الحقيقي 🌹"
    ];

    const selectedMahr = mahrList[Math.floor(Math.random() * mahrList.length)];

    const message = `
💍 تم عقد قران جديد داخل المجموعة!

👰‍♀️ العروسة: @${brideId.split("@")[0]}
🤵‍♂️ العريس: @${groomId.split("@")[0]}

📜 المأذون: المعروف بـ @${officiantId.split("@")[0]}

🎁 المهر: ${selectedMahr}

🎊 ألف مبروك للزوجين السعيدين!
🔔 يلا استعدوا لشهر عسل في كوكب الناميك 🌚
😂 ما تنسوش تدفعوا المهر قبل ما العروسة تهرب ✨

#حفلـة_زواج_أسطورية 🎉
`;

    await sock.sendMessage(chatId, {
      text: message,
      mentions: [groomId, brideId, officiantId]
    }, { quoted: m });
  }
};
