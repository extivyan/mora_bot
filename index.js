const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🤖 Mora Bot is running!");
});

app.listen(PORT, () => {
  console.log("Web server running on port " + PORT);
});

const { fork } = require('child_process');
const { join } = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

const maxRetries = 3;
const retryDelay = 5000;

let isRunning = false;
let retryCount = 0;

function showLoadingAnimation() {
    const frames = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    
    let i = 0;
    let colorIndex = 0;
    
    const interval = setInterval(() => {
        const color = colors[colorIndex % colors.length];
        process.stdout.write(`\r${chalk.hex('#FF6B6B')('┌')}${chalk.hex(color)(frames[i])}${chalk.hex('#FF6B6B')('┐')} ${chalk.hex('#00FFFF').bold('FHS BOT LOADER')} ${chalk.hex('#FFFF00')('STARTING')} ${chalk.hex('#87CEEB')(frames[i])}`);
        
        i = (i + 1) % frames.length;
        if (i === 0) colorIndex++;
    }, 100);
    
    return interval;
}

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

function handleConnection(retry = 0) {
    if (isRunning) return;
    isRunning = true;
    
    showWelcomeMessage();
    const loadingInterval = showLoadingAnimation();

    const child = fork(join(__dirname, 'main.js'), [], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        env: {
            ...process.env,
            CONNECTION_FOLDER: join(process.cwd(), 'ملف_الاتصال')
        }
    });

    child.on('message', (data) => {
        if (data === 'ready') {
            clearInterval(loadingInterval);
            process.stdout.write('\n\n');
            console.log(chalk.hex('#4ECDC4').bold('╔════════════════════════════════════╗'));
            console.log(chalk.hex('#4ECDC4').bold('   ✅ MAIN SYSTEM LOADED SUCCESSFULLY'));
            console.log(chalk.hex('#4ECDC4').bold('╚════════════════════════════════════╝\n'));
            console.log(chalk.hex('#FFD700')('🚀 Bot is now running...'));
            console.log(chalk.hex('#00BFFF')('📱 Waiting for WhatsApp connection...\n'));
            retryCount = 0;
        } else if (data === 'reset') {
            clearInterval(loadingInterval);
            child.kill();
            setTimeout(() => handleConnection(0), 2000);
        } else if (data === 'uptime') {
            child.send(process.uptime());
        }
    });

    child.on('exit', async (code) => {
        clearInterval(loadingInterval);
        isRunning = false;

        if (code === 0) {
            console.log(chalk.hex('#96CEB4')('\n🔄 Bot stopped gracefully\n'));
            process.exit(0);
            return;
        }

        if (code === 429) {
            console.log(chalk.hex('#FFEAA7')('\n⚠ Rate limited, waiting 10 seconds...\n'));
            await delay(10000);
            return handleConnection(retry);
        }

        if (retry < maxRetries) {
            retry++;
            console.log(chalk.hex('#DDA0DD')(`\n🔄 Restarting... (Attempt ${retry}/${maxRetries})\n`));
            await delay(retryDelay);
            handleConnection(retry);
        } else {
            console.log(chalk.hex('#FF6B6B')('\n❌ Max retries reached. Exiting...\n'));
            process.exit(1);
        }
    });

    child.on('error', (err) => {
        clearInterval(loadingInterval);
        console.log(chalk.hex('#FF6B6B')(`\n⚠ Error: ${err.message}\n`));
        isRunning = false;
        if (retry < maxRetries) {
            retry++;
            setTimeout(() => handleConnection(retry), retryDelay);
        }
    });

    setTimeout(() => {
        if (!child.connected) {
            clearInterval(loadingInterval);
            child.kill();
            handleConnection(retry + 1);
        }
    }, 10000);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

process.on('SIGINT', () => {
    console.log(chalk.hex('#FF6B6B')('\n\n👋 Shutting down gracefully...\n'));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.hex('#FF6B6B')('\n\n🔚 Termination signal received\n'));
    process.exit(0);
});

console.clear();
handleConnection();

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Bot is running 🚀");
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
