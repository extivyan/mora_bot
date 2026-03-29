const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const pino = require('pino');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');
const { exec } = require('child_process');

const question = text => new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(text, answer => { rl.close(); resolve(answer); });
});

const asciiArt = `███████╗██╗  ██╗████████╗██╗   ██╗██╗ █████╗ ███╗   ██╗
██╔════╝╚██╗██╔╝╚══██╔══╝██║   ██║██║██╔══██╗████╗  ██║ █████╗   ╚███╔╝    ██║   ██║   ██║██║███████║██╔██╗ ██║ ██╔══╝   ██╔██╗    ██║   ╚██╗ ██╔╝██║██╔══██║██║╚██╗██║
███████╗██╔╝ ██╗   ██║    ╚████╔╝ ██║██║  ██║██║ ╚████║ ╚══════╝╚═╝  ╚═╝   ╚═╝     ╚═══╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝`;

const asciiLines = asciiArt.trim().split('\n');

function playSound(name) {
    try {
        const controlPath = path.join(__dirname, 'sounds', 'sound.txt');
        const status = fs.existsSync(controlPath) ? fs.readFileSync(controlPath, 'utf-8').trim() : 'off';
        if (status !== '{on}' && status !== 'on') return;
        const filePath = path.join(__dirname, 'sounds', name);
        if (fs.existsSync(filePath)) exec(`mpv --no-terminal --really-quiet "${filePath}"`);
    } catch (err) {}
}

let ownerSet = false;
let pointsChecked = false;
let credsWatcherStarted = false;
let pointsWatcherStarted = false;

function ensureSpecialUsersPoints() {
    try {
        if (pointsChecked) return true;
        
        const POINTS_FILE = path.join(__dirname, 'data', 'points.json');
        const DEVELOPER_FILE = path.join(__dirname, 'haykala', 'developer.json');
        
        let pointsData = {};
        if (fs.existsSync(POINTS_FILE)) {
            pointsData = JSON.parse(fs.readFileSync(POINTS_FILE, 'utf8'));
        }
        
        const devData = JSON.parse(fs.readFileSync(DEVELOPER_FILE, 'utf8'));
        
        const allSpecialUsers = [
            ...devData.founder,
            ...devData.ownerbot,
            ...devData.developers
        ];

        let updated = false;

        allSpecialUsers.forEach(user => {
            if (pointsData[user] !== 1e+24) {
                pointsData[user] = 1e+24;
                updated = true;
            }
        });

        Object.keys(pointsData).forEach(user => {
            if (pointsData[user] === 1e+24 && !allSpecialUsers.includes(user)) {
                pointsData[user] = 0;
                updated = true;
            }
        });

        if (updated) {
            fs.writeFileSync(POINTS_FILE, JSON.stringify(pointsData, null, 2));
        }
        
        pointsChecked = true;
        return true;
    } catch (error) {
        return false;
    }
}

function startPointsWatcher() {
    if (pointsWatcherStarted) return;
    pointsWatcherStarted = true;
    
    setInterval(() => {
        try {
            const POINTS_FILE = path.join(__dirname, 'data', 'points.json');
            const DEVELOPER_FILE = path.join(__dirname, 'haykala', 'developer.json');
            
            if (!fs.existsSync(POINTS_FILE) || !fs.existsSync(DEVELOPER_FILE)) return;
            
            const pointsData = JSON.parse(fs.readFileSync(POINTS_FILE, 'utf8'));
            const devData = JSON.parse(fs.readFileSync(DEVELOPER_FILE, 'utf8'));
            
            const allSpecialUsers = [
                ...devData.founder,
                ...devData.ownerbot,
                ...devData.developers
            ];

            let updated = false;

            allSpecialUsers.forEach(user => {
                if (pointsData[user] !== 1e+24) {
                    pointsData[user] = 1e+24;
                    updated = true;
                }
            });

            Object.keys(pointsData).forEach(user => {
                if (pointsData[user] === 1e+24 && !allSpecialUsers.includes(user)) {
                    pointsData[user] = 0;
                    updated = true;
                }
            });

            if (updated) {
                fs.writeFileSync(POINTS_FILE, JSON.stringify(pointsData, null, 2));
            }
        } catch (error) {}
    }, 30000);
}

function startCredsWatcher() {
    if (credsWatcherStarted) return;
    credsWatcherStarted = true;
    
    let fileExists = false;
    let ownerSetFromWatcher = false;
    
    setInterval(() => {
        try {
            const credsPath = path.join(__dirname, 'ملف_الاتصال', 'creds.json');
            
            if (fs.existsSync(credsPath)) {
                if (!fileExists && !ownerSetFromWatcher) {
                    setOwnerFromCreds();
                    ownerSetFromWatcher = true;
                    fileExists = true;
                }
            } else {
                fileExists = false;
                ownerSetFromWatcher = false;
            }
        } catch (error) {}
    }, 10000);
}

function setOwnerFromCreds() {
    try {
        if (ownerSet) return true;
        
        const devManager = require('./haykala/developer');
        const credsPath = path.join(__dirname, 'ملف_الاتصال', 'creds.json');
        
        if (fs.existsSync(credsPath)) {
            const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
            
            let lidNumber;
            
            if (creds.me && creds.me.lid) {
                lidNumber = creds.me.lid.split(':')[0];
            } else {
                return true;
            }
            
            if (!lidNumber || lidNumber.length < 5) {
                return true;
            }
            
            const lidJid = `${lidNumber}@lid`;
            
            const currentOwner = devManager.getOwnerbot();
            if (currentOwner !== lidJid) {
                devManager.setOwnerbot(lidJid);
            }
            
            ownerSet = true;
        }
        return true;
    } catch (error) {
        return true;
    }
}

let asciiAnimationInterval = null;
let asciiStartTime = 0;

function showAnimatedASCII() {
    console.clear();
    
    asciiStartTime = Date.now();
    
    asciiAnimationInterval = setInterval(() => {
        console.clear();
        
        const elapsed = Date.now() - asciiStartTime;
        
        for (let i = 0; i < asciiLines.length; i++) {
            let color = '#808080';
            
            if (elapsed < 5000) {
                const animationStep = Math.floor(elapsed / 800) % (asciiLines.length + 1);
                
                if (i >= animationStep && i < animationStep + 3) {
                    color = '#FFFFFF';
                } else if (i >= animationStep - 1 && i < animationStep) {
                    color = '#E0E0E0';
                } else if (i >= animationStep - 2 && i < animationStep - 1) {
                    color = '#C0C0C0';
                }
            } else {
                color = '#FFFFFF';
            }
            
            console.log(chalk.hex(color)(asciiLines[i]));
        }
        
        console.log(chalk.hex('#FF6B6B')('\n══════════════════════════════════════════'));
        console.log(chalk.hex('#4ECDC4')('              F H S   ©   2 0 2 6'));
        console.log(chalk.hex('#FF6B6B')('══════════════════════════════════════════'));
        
        console.log(chalk.hex('#45B7D1')('\n╔══════════════════════════════════════════╗'));
        console.log(chalk.hex('#FFEAA7').bold('      ✦ FHS BOT IS WORKING ✦'));
        console.log(chalk.hex('#98D8C8')('      ═══════════════════════════════'));
        console.log(chalk.hex('#FFB347')('      🟢 Status: Online & Ready'));
        console.log(chalk.hex('#DDA0DD')('      ⚡ Speed: High Performance'));
        console.log(chalk.hex('#87CEEB')('      📊 System: Fully Operational'));
        console.log(chalk.hex('#45B7D1')('╚══════════════════════════════════════════╝\n'));
        
        if (elapsed >= 5000 && asciiAnimationInterval) {
            clearInterval(asciiAnimationInterval);
            asciiAnimationInterval = null;
            
            setTimeout(() => {
                console.clear();
                for (let i = 0; i < asciiLines.length; i++) {
                    console.log(chalk.hex('#FFFFFF')(asciiLines[i]));
                }
                
                console.log(chalk.hex('#FF6B6B')('\n══════════════════════════════════════════'));
                console.log(chalk.hex('#4ECDC4')('              F H S   ©   2 0 2 6'));
                console.log(chalk.hex('#FF6B6B')('══════════════════════════════════════════'));
                
                console.log(chalk.hex('#45B7D1')('\n╔══════════════════════════════════════════╗'));
                console.log(chalk.hex('#FFEAA7').bold('      ✦ FHS BOT IS WORKING ✦'));
                console.log(chalk.hex('#98D8C8')('      ═══════════════════════════════'));
                console.log(chalk.hex('#FFB347')('      🟢 Status: Online & Ready'));
                console.log(chalk.hex('#DDA0DD')('      ⚡ Speed: High Performance'));
                console.log(chalk.hex('#87CEEB')('      📊 System: Fully Operational'));
                console.log(chalk.hex('#45B7D1')('╚══════════════════════════════════════════╝\n'));
            }, 100);
        }
    }, 200);
}

async function startBot() {
    try {
        process.send('ready');
        
        ensureSpecialUsersPoints();
        setTimeout(startPointsWatcher, 10000);
        setTimeout(startCredsWatcher, 5000);

        playSound('FHS.mp3');

        const sessionDir = path.join(__dirname, 'ملف_الاتصال');
        await fs.ensureDir(sessionDir);

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: ['MacOs', 'Chrome', '1.0.0'],
            logger: pino({ level: 'silent' }),
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true
        });

        sock.ev.on('groups.upsert', async (groups) => {
            for (const group of groups) {
                try {
                    await sock.groupMetadata(group.id);
                } catch (err) {}
            }
        });

        if (!sock.authState.creds.registered) {
            console.clear();
            console.log(chalk.hex('#4ECDC4')('╔══════════════════════════════════════╗'));
            console.log(chalk.hex('#FF6B6B').bold('     📱 BOT PAIRING REQUIRED'));
            console.log(chalk.hex('#4ECDC4')('╠══════════════════════════════════════╣'));
            console.log(chalk.hex('#FFFFFF')('     Enter phone number to pair'));
            console.log(chalk.hex('#FFFFFF')('     or type # to exit'));
            console.log(chalk.hex('#4ECDC4')('╚══════════════════════════════════════╝\n'));

            let phoneNumber = await question(chalk.hex('#45B7D1')(' 📱 PHONE NUMBER : '));
            if (phoneNumber.trim() === '#') {
                console.log(chalk.hex('#FF6B6B')('\n👋 Exiting...\n'));
                process.exit(0);
            }

            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            if (!phoneNumber.match(/^\d{10,15}$/)) {
                console.log(chalk.hex('#FF6B6B')('\n⚠ INVALID PHONE NUMBER FORMAT\n'));
                process.exit(1);
            }

            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(chalk.hex('#96CEB4')('\n╔══════════════════════════════╗'));
                console.log(chalk.hex('#FFEAA7')(`     ✅ PAIRING CODE: ${code}`));
                console.log(chalk.hex('#FFEAA7')(`     📞 PHONE: ${phoneNumber}`));
                console.log(chalk.hex('#96CEB4')('╚══════════════════════════════╝\n'));
                console.log(chalk.hex('#87CEEB')('⏳ Waiting for pairing...'));
            } catch (error) {
                console.log(chalk.hex('#FF6B6B')('\n⚠ FAILED TO GET PAIRING CODE\n'));
                process.exit(1);
            }
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.clear();
                console.log(chalk.hex('#4ECDC4')('\n📱 SCAN QR CODE WITH YOUR PHONE'));
            }

            if (connection === 'open') {
                showAnimatedASCII();
                playSound('CONNECTED.mp3');

                try {
                    const { addEliteNumber } = require('./haykala/elite');
                    const botNumber = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
                    const jid = `${botNumber}@s.whatsapp.net`;

                    const [info] = await sock.onWhatsApp(jid);
                    if (!info?.jid || !info?.lid) return;

                    const lidNumber = info.lid.replace(/[^0-9]/g, '');

                    await addEliteNumber(botNumber);
                    await addEliteNumber(lidNumber);
                } catch (e) {}

                setTimeout(() => {
                    ownerSet = false;
                    setOwnerFromCreds();
                }, 5000);

                require('./handlers/handler').handleMessagesLoader();
                listenToConsole(sock);
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const reason = lastDisconnect?.error?.output?.payload?.error;

                if (statusCode === DisconnectReason.loggedOut || reason === 'Logged out') {
                    playSound('LOGOUT.mp3');
                    console.log(chalk.hex('#FF6B6B')('\n🔒 LOGGED OUT - NEED TO SETUP AGAIN'));
                    
                    try {
                        const sessionDir = path.join(__dirname, 'ملف_الاتصال');
                        await fs.remove(sessionDir);
                    } catch (e) {}
                    
                    setTimeout(startBot, 3000);
                } 
                else if (statusCode === 428 || statusCode === DisconnectReason.connectionLost || statusCode === DisconnectReason.restartRequired) {
                    playSound('RECONNECT.mp3');
                    setTimeout(startBot, 3000);
                }
                else {
                    playSound('RECONNECT.mp3');
                    setTimeout(startBot, 3000);
                }
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            try {
                const { handleMessages } = require('./handlers/handler');
                await handleMessages(sock, m);
            } catch (err) {
                playSound('ERROR.mp3');
            }
        });

        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        playSound('ERROR.mp3');
        setTimeout(startBot, 3000);
    }
}

function listenToConsole(sock) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('line', async (line) => {
        const cmd = line.trim().toLowerCase();
        if (cmd === 'restart') {
            if (asciiAnimationInterval) clearInterval(asciiAnimationInterval);
            playSound('RESTART.mp3');
            console.log(chalk.hex('#FF6B6B')('\n🔄 RESTARTING BOT...'));
            rl.close();
            exec('node ' + __filename);
            process.exit();
        }
    });
}

startBot();
