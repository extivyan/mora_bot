const axios = require("axios");

module.exports = {
  name: "رواية",
  command: ["رواية"],

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    
    try {
      const text = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text || "";

      const args = text.split(" ");
      const query = args.slice(1).join(" ");

      if (!query) {
        return await sock.sendMessage(chatId, {
          text: "📚 *يرجى كتابة اسم الرواية*\nمثال: `.رواية الفيل الأزرق`"
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { text: "🔎 جاري البحث في الأرشيف المفتوح..." }, { quoted: msg });

      // استخدام Open Library API بدلاً من Google
      const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Compatible; Bot/1.1)' // تغيير الهيدر لتجنب الحظر
        }
      });

      if (!response.data.docs || response.data.docs.length === 0) {
        return await sock.sendMessage(chatId, {
          text: "❌ لم أجد نتائج لهذه الرواية في الأرشيف."
        }, { quoted: msg });
      }

      const book = response.data.docs[0];
      const title = book.title || "غير متوفر";
      const author = book.author_name ? book.author_name.join(", ") : "غير معروف";
      const publishYear = book.first_publish_year || "غير محدد";
      const editionCount = book.edition_count || 0;
      
      // جلب رابط الغلاف باستخدام ID الكتاب
      const coverId = book.cover_i;
      const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;

      // تنسيق الرسالة
      let caption = `📚 *نتيجة البحث من Open Library:*\n\n`;
      caption += `✨ *العنوان:* ${title}\n`;
      caption += `✍️ *المؤلف:* ${author}\n`;
      caption += `📅 *أول سنة نشر:* ${publishYear}\n`;
      caption += `📖 *عدد الطبعات:* ${editionCount}\n\n`;
      caption += `🔗 *رابط الكتاب:* https://openlibrary.org${book.key}\n\n`;
      caption += `📥 *للبحث عن نسخة PDF:* \nhttps://www.google.com/search?q=تحميل+${encodeURIComponent(title)}+pdf`;

      if (coverUrl) {
        await sock.sendMessage(chatId, {
          image: { url: coverUrl },
          caption: caption
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
      }

    } catch (err) {
      console.error("OpenLibrary API Error:", err);
      await sock.sendMessage(chatId, {
        text: "❌ حدث خطأ في الاتصال بالمكتبة البديلة."
      }, { quoted: msg });
    }
  }
};

