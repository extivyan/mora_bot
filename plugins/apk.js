const fetch = require('node-fetch');

module.exports = {
    command: 'apk',
    category: 'downloader',
    description: '📦 Busca y descarga aplicaciones APK desde Aptoide',

    async execute(sock, m) {
        const chatId = m.key.remoteJid;
        const text =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            "";

        const args = text.trim().split(/\s+/).slice(1);
        const query = args.join(" ");

        if (!query) {
            return sock.sendMessage(chatId, {
                text: "📱 *Descarga APKs desde Aptoide*\n\nEjemplo:\n.apk free fire"
            }, { quoted: m });
        }

        // لو باكدج مباشر
        if (/^com\./i.test(query)) {
            await sock.sendMessage(chatId, {
                text: "⏬ Descargando aplicación..."
            }, { quoted: m });

            try {
                const info = await apkinfo(query);
                const res = await apk(query);

                if (Number(res.size) > 2000000000)
                    throw new Error('Archivo demasiado grande.');

                await sock.sendMessage(chatId, {
                    image: { url: info.icon },
                    caption:
                        `📦 *Nombre:* ${info.name}\n` +
                        `🧩 *Paquete:* ${info.packageN}\n` +
                        `💾 *Descargando archivo...*`
                }, { quoted: m });

                await sock.sendMessage(chatId, {
                    document: { url: res.download },
                    mimetype: res.mimetype,
                    fileName: res.fileName
                }, { quoted: m });

                if (info.obb) {
                    await sock.sendMessage(chatId, {
                        text: `📂 Descargando archivo OBB...`
                    }, { quoted: m });

                    await sock.sendMessage(chatId, {
                        document: { url: info.obb_link },
                        mimetype: 'application/zip',
                        fileName: info.obb_link.split('/').pop()
                    }, { quoted: m });
                }

            } catch (err) {
                console.error(err);
                await sock.sendMessage(chatId, {
                    text: "❌ Error al descargar el APK."
                }, { quoted: m });
            }
            return;
        }

        // بحث عادي
        await sock.sendMessage(chatId, {
            text: "🔍 Buscando aplicaciones..."
        }, { quoted: m });

        try {
            const apps = await searchApkList(query);

            if (!apps.length)
                return sock.sendMessage(chatId, {
                    text: "❌ No se encontraron aplicaciones."
                }, { quoted: m });

            let lista = `📱 *Resultados para:* ${query}\n\n`;

            for (let i = 0; i < Math.min(apps.length, 5); i++) {
                lista += `🔹 *${apps[i].name}*\n📦 ${apps[i].package}\n\n`;
            }

            lista += `💡 Usa *.apk nombre_del_paquete* para descargar.`;

            await sock.sendMessage(chatId, {
                text: lista
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await sock.sendMessage(chatId, {
                text: "❌ Error al buscar aplicaciones."
            }, { quoted: m });
        }
    }
};

// ====== Helpers ======

async function searchApkList(query) {
    const res = await fetch(
        'https://ws75.aptoide.com/api/7/apps/search?query=' +
        encodeURIComponent(query) +
        '&limit=10'
    );

    const json = await res.json();

    return json.datalist.list.map(app => ({
        name: app.name,
        package: app.package
    }));
}

async function apkinfo(packageName) {
    const res = await fetch(
        'https://ws75.aptoide.com/api/7/apps/search?query=' +
        encodeURIComponent(packageName) +
        '&limit=1'
    );

    const json = await res.json();
    const app = json.datalist.list[0];
    if (!app) throw new Error('App not found');

    return {
        obb: !!app.obb?.main?.path,
        obb_link: app.obb?.main?.path || null,
        name: app.name,
        icon: app.icon,
        packageN: app.package
    };
}

async function apk(packageName) {
    const res = await fetch(
        'https://ws75.aptoide.com/api/7/apps/search?query=' +
        encodeURIComponent(packageName) +
        '&limit=1'
    );

    const json = await res.json();
    const app = json.datalist.list[0];

    const download = app.file.path;
    const fileName = app.package + '.apk';

    const head = await fetch(download, { method: 'HEAD' });
    const size = head.headers.get('content-length');
    const mimetype = head.headers.get('content-type');

    return { fileName, mimetype, download, size };
}