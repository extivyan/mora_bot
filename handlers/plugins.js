const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/console');
const chalk = require('chalk');

const GLOBAL_ZARF_FILE = path.join(__dirname, '../data/zarf_state_global.txt');
const GROUP_ZARF_FILE = path.join(__dirname, '../data/zarf_state_groups.json');
const OLD_ZARF_FILE = path.join(__dirname, '../data/zarf_state.json');

let loadedPlugins = {};

function createSearchAnimation(command, mode, isGroup, isBotDisabled, zarfStatus) {
    const waveFrames = [
        '▰▰▰▰▰▰▰▰▰▰',
        '▰▰▰▰▰▰▰▰▰▱',
        '▰▰▰▰▰▰▰▰▱▱',
        '▰▰▰▰▰▰▰▱▱▱',
        '▰▰▰▰▰▰▱▱▱▱',
        '▰▰▰▰▰▱▱▱▱▱',
        '▰▰▰▰▱▱▱▱▱▱',
        '▰▰▰▱▱▱▱▱▱▱',
        '▰▰▱▱▱▱▱▱▱▱',
        '▰▱▱▱▱▱▱▱▱▱',
        '▱▱▱▱▱▱▱▱▱▱',
        '▰▱▱▱▱▱▱▱▱▱',
        '▰▰▱▱▱▱▱▱▱▱',
        '▰▰▰▱▱▱▱▱▱▱',
        '▰▰▰▰▱▱▱▱▱▱',
        '▰▰▰▰▰▱▱▱▱▱',
        '▰▰▰▰▰▰▱▱▱▱',
        '▰▰▰▰▰▰▰▱▱▱',
        '▰▰▰▰▰▰▰▰▱▱',
        '▰▰▰▰▰▰▰▰▰▱'
    ];
    
    let i = 0;
    let interval;
    const mainColor = chalk.hex('#FFD700');
    
    return {
        start: () => {
            console.log(mainColor.bold('╔══════════════════════════════════╗'));
            console.log(mainColor.bold('      🚀 FHS BOT COMMAND SEARCH'));
            console.log(mainColor.bold('╚══════════════════════════════════╝'));
            console.log('');
            
            console.log(chalk.hex('#00BFFF')(`📋 Command: ${chalk.hex('#FFD700').bold(command)}`));
            console.log(chalk.hex('#FF6B8B')(`🎭 Mode: ${chalk.hex('#FFD700').bold(mode)}`));
            console.log(chalk.hex('#06D6A0')(`📌 Chat: ${isGroup ? 'Group' : 'Private'}`));
            
            if (isBotDisabled) {
                console.log(chalk.hex('#EF476F')(`⚠️ Bot: ${chalk.hex('#FFD700').bold('DISABLED')}`));
            } else {
                console.log(chalk.hex('#06D6A0')(`✅ Bot: ${chalk.hex('#FFD700').bold('ENABLED')}`));
            }
            
            console.log(chalk.hex('#118AB2')(`🌀 Zarf: ${zarfStatus ? chalk.hex('#06D6A0').bold('ENABLED') : chalk.hex('#EF476F').bold('DISABLED')}`));
            console.log('');
            
            interval = setInterval(() => {
                const frame = waveFrames[i];
                let coloredFrame = '';
                
                for (let j = 0; j < frame.length; j++) {
                    const colors = ['#FFD700', '#00BFFF', '#FF6B8B', '#06D6A0'];
                    const colorIndex = (j + i) % colors.length;
                    coloredFrame += chalk.hex(colors[colorIndex])(frame[j]);
                }
                
                process.stdout.write(`\r${coloredFrame} ${chalk.hex('#FFFFFF').bold('SEARCHING')} ${chalk.hex('#FFD700')('✦')}${chalk.hex('#00BFFF')('✦')}${chalk.hex('#FF6B8B')('✦')}`);
                
                i = (i + 1) % waveFrames.length;
            }, 50); 
        },
        stop: (success = true, result = '') => {
            clearInterval(interval);
            
            console.log('');
            if (success) {
                console.log(chalk.hex('#06D6A0').bold('╔══════════════════════════════════╗'));
                console.log(chalk.hex('#FFD700').bold(`   ✅ COMMAND EXECUTED SUCCESSFULLY`));
                console.log(chalk.hex('#06D6A0').bold('╚══════════════════════════════════╝'));
            } else {
                console.log(chalk.hex('#EF476F').bold('╔══════════════════════════════════╗'));
                console.log(chalk.hex('#FF6B8B').bold(`   ❌ COMMAND FAILED: ${result}`));
                console.log(chalk.hex('#EF476F').bold('╚══════════════════════════════════╝'));
            }
            console.log('');
        }
    };
}

async function loadPlugins() {
    try {
        const pluginsDir = path.join(__dirname, '../plugins');
        const zarfDir = path.join(__dirname, '../زرف');
        
        await fs.ensureDir(pluginsDir);
        await fs.ensureDir(zarfDir);

        let globalZarfEnabled = false;
        let groupZarfStates = {};
        
        if (fs.existsSync(GLOBAL_ZARF_FILE)) {
            try {
                const globalState = fs.readFileSync(GLOBAL_ZARF_FILE, 'utf8').trim();
                globalZarfEnabled = globalState === '[on]';
            } catch (err) {}
        }
        
        if (fs.existsSync(GROUP_ZARF_FILE)) {
            try {
                groupZarfStates = JSON.parse(fs.readFileSync(GROUP_ZARF_FILE, 'utf8'));
            } catch (err) {}
        }

        const pluginFiles = (await fs.readdir(pluginsDir)).filter(f => f.endsWith('.js'));
        for (const file of pluginFiles) {
            const pluginPath = path.join(pluginsDir, file);
            delete require.cache[require.resolve(pluginPath)];
        }

        loadedPlugins = {};
        
        for (const file of pluginFiles) {
            try {
                const pluginPath = path.join(pluginsDir, file);
                const plugin = require(pluginPath);

                if (plugin && typeof plugin.execute === 'function' && plugin.command) {
                    loadedPlugins[plugin.command] = plugin;
                }
            } catch (err) {}
        }

        const zarfFiles = (await fs.readdir(zarfDir)).filter(f => f.endsWith('.js'));
        for (const file of zarfFiles) {
            try {
                const pluginPath = path.join(zarfDir, file);
                delete require.cache[require.resolve(pluginPath)];
                const plugin = require(pluginPath);

                if (plugin && typeof plugin.execute === 'function' && plugin.command) {
                    plugin.isZarfPlugin = true;
                    loadedPlugins[plugin.command] = plugin;
                }
            } catch (err) {}
        }

        return loadedPlugins;
    } catch (err) {
        return {};
    }
}

function checkZarfStatus(groupJid) {
    try {
        let globalZarfEnabled = false;
        let groupZarfState = null;
        
        if (fs.existsSync(GLOBAL_ZARF_FILE)) {
            const globalState = fs.readFileSync(GLOBAL_ZARF_FILE, 'utf8').trim();
            globalZarfEnabled = globalState === '[on]';
        }
        
        if (fs.existsSync(GROUP_ZARF_FILE)) {
            const groupZarfStates = JSON.parse(fs.readFileSync(GROUP_ZARF_FILE, 'utf8'));
            groupZarfState = groupZarfStates[groupJid] || null;
        }
        
        if (groupZarfState) {
            return groupZarfState === '[on]';
        }
        
        return globalZarfEnabled;
    } catch (err) {
        return false;
    }
}

module.exports = {
    loadPlugins,
    getPlugins: () => loadedPlugins,
    checkZarfStatus,
    createSearchAnimation
};