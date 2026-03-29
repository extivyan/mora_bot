const express = require("express");
const app = express();

const { fork } = require('child_process');
const { join } = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

const PORT = process.env.PORT || 3000;

const maxRetries = 3;
const retryDelay = 5000;

let isRunning = false;
let retryCount = 0;

// 🌐 Web server (مهم عشان Railway)
app.get("/", (req, res) => {
    res.send("🤖 Mora Bot is running!");
});

app.listen(PORT, () => {
    console.log("Web server running on port " + PORT);
});

// 🎬 Loading Animation
function showLoadingAnimation() {
    const frames = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

    let i = 0;
    let colorIndex = 0;

    const interval = setInterval(() => {
        const color = colors[colorIndex % colors.length];
        process.stdout.write(
            `\r${chalk.hex('#FF6B6B')('┌')}${chalk.hex(color)(frames[i])}${chalk.hex('#FF6B6B')('┐')} ${chalk.hex('#00FFFF').bold('FHS BOT LOADER')} ${chalk.hex('#FFFF00')('STARTING')} ${chalk.hex('#87CEEB')(frames[i])}`
        );

        i = (i + 1) % frames.length;
        if (i === 0) colorIndex++;
    }, 100);

    return interval;
}

// 🎉 Welcome
function showWelcomeMessage() {
    console.clear();

    const welcomeArt = chalk.hex('#FF6B6B')`
╔══════════════════════════════════════════╗
║                                          ║
║      🚀 WELCOME TO FHS BOT LOADER       ║
║                                          ║
║     » Developer: FHS Team                ║
║     » Loading Main System...             ║
║                                          ║
╚══════════════════════════════════════════╝
`;

    console.log(welcomeArt);
}

// 🔌 تشغيل البوت
function handleConnection(retry = 0) {
    if (isRunning) return;
    isRunning = true;

    showWelcomeMessage();
    const loadingInterval = showLoadingAnimation();

    let child;

    try {
        child = fork(join(__dirname, 'main.js'), [], {
            stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
            env: {
                ...process.env,
                CONNECTION_FOLDER: join(process.cwd(), 'session') // ✔️ بدون عربي
            }
        });
    } catch (err) {
        console.log("❌ Error starting main.js:", err);
        isRunning = false;
        return;
    }

    child.on('message', (data) => {
        if (data === 'ready') {
            clearInterval(loadingInterval);
            console.log("\n✅ Bot started successfully\n");
            retryCount = 0;
        }
    });

    child.on('exit', async (code) => {
        clearInterval(loadingInterval);
        isRunning = false;

        console.log(`❌ Bot exited with code ${code}`);

        if (retry < maxRetries) {
            retry++;
            console.log(`🔄 Restarting... (${retry}/${maxRetries})`);
            await delay(retryDelay);
            handleConnection(retry);
        } else {
            console.log("❌ Max retries reached");
        }
    });

    child.on('error', (err) => {
        clearInterval(loadingInterval);
        console.log("⚠ Error:", err.message);
        isRunning = false;
    });
}

// ⏳ Delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 📴 Exit
process.on('SIGINT', () => {
    console.log("👋 Shutting down...");
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log("🔚 Terminated");
    process.exit(0);
});

// 🚀 Start
handleConnection();
