import { isSelfMode, isAllowedWhenSelf } from './System/selfmode.js'
import './config.js';
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import util from 'util';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import crypto from 'crypto';
import moment from 'moment-timezone';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import baileys from '@itsukichan/baileys';

const {
    downloadContentFromMessage,
    proto,
    generateWAMessage,
    getContentType,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    GroupSettingChange,
    areJidsSameUser
} = baileys;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = promisify(exec);

import {
    smsg,
    tanggal,
    getTime,
    isUrl,
    sleep,
    clockString,
    runtime,
    fetchJson,
    getBuffer,
    jsonformat,
    format,
    parseMention,
    getRandom,
    getGroupAdm,
    generateProfilePicture
} from './System/message.js';

import Case from './Library/system.js';
import { runPassiveHandlers } from './Plugins-ESM/_pluginmanager.mjs';

const OWNER_PATH = './data/Own.json';
const PREMIUM_PATH = './data/Prem.json';

const Morela = async (Morela, m, chatUpdate, store) => {
    try {
        let body = '';
        
        
        if (m.message?.interactiveResponseMessage) {
            const interactiveResponse = m.message.interactiveResponseMessage;
            const nativeFlowResponse = interactiveResponse.nativeFlowResponseMessage;
            
            if (nativeFlowResponse) {
                try {
                    const paramsJson = JSON.parse(nativeFlowResponse.paramsJson);
                    body = paramsJson.id || '';
                } catch (e) {
                    console.error('Error parsing interactive response:', e);
                    body = '';
                }
            }
        }
        
        else if (m.message?.listResponseMessage) {
            body = m.message.listResponseMessage.singleSelectReply?.selectedRowId || '';
        }
        
        else if (m.message?.buttonsResponseMessage) {
            body = m.message.buttonsResponseMessage.selectedButtonId || '';
        }
        
        else {
            const messageTypes = {
                conversation: m.message?.conversation || '',
                imageMessage: m.message?.imageMessage?.caption || '',
                videoMessage: m.message?.videoMessage?.caption || '',
                audioMessage: m.message?.audioMessage?.caption || '',
                stickerMessage: m.message?.stickerMessage?.caption || '',
                documentMessage: m.message?.documentMessage?.fileName || '',
                extendedTextMessage: m.message?.extendedTextMessage?.text || '',
            };

            if (m.mtype && messageTypes[m.mtype]) {
                body = messageTypes[m.mtype];
            } else if (m.text) {
                body = m.text;
            } else {
                body = '';
            }
        }

        const budy = (typeof m.text === 'string' ? m.text : '');
        const prefixPattern = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi;
        const prefixMatch = body.match(prefixPattern);
        const prefix = global.prefa ? (prefixMatch ? prefixMatch[0] : "") : (global.prefa ?? global.prefix);

        let Owner = [];
        let Premium = [];

        try {
            if (fs.existsSync(OWNER_PATH)) {
                Owner = JSON.parse(await fsPromises.readFile(OWNER_PATH, 'utf-8'));
            }
        } catch (error) {
            console.error('Error loading owner data:', error);
        }

        try {
            if (fs.existsSync(PREMIUM_PATH)) {
                Premium = JSON.parse(await fsPromises.readFile(PREMIUM_PATH, 'utf-8'));
            }
        } catch (error) {
            console.error('Error loading premium data:', error);
        }

        const CMD = body.startsWith(prefix);
        const command = CMD ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const args = CMD ? body.slice(prefix.length).trim().split(' ').slice(1) : [];
        const text = args.join(' ');

        const BotNum = await Morela.decodeJid(Morela.user.id);
        const botJid = BotNum.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        const senderJid = m.sender.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        const isOwn = Owner
            .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
            .includes(senderJid) || botJid === senderJid;

        const isPrem = Premium
            .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
            .includes(senderJid) || botJid === senderJid;

        const fatkuns = m.quoted || m;
        let quoted = m.quoted || null;

        if (fatkuns.mtype === 'buttonsMessage') {
            quoted = fatkuns[Object.keys(fatkuns)[1]];
        } else if (fatkuns.mtype === 'templateMessage') {
            quoted = fatkuns.hydratedTemplate?.[Object.keys(fatkuns.hydratedTemplate)[1]];
        } else if (fatkuns.mtype === 'product') {
            quoted = fatkuns[Object.keys(fatkuns)[0]];
        }

        const from = m.key.remoteJid;
        const sender = m.isGroup ? (m.key.participant || m.participant) : m.key.remoteJid;
        const pushname = m.pushName || "No Name";

        let groupMetadata = null;
        let groupName = "";
        let participants = [];
        let groupAdmin = [];
        let botAdmin = false;
        let isAdmin = false;

        if (m.isGroup) {
            try {
                groupMetadata = await Morela.groupMetadata(from);
                groupName = groupMetadata.subject || "";
                participants = groupMetadata.participants || [];
                groupAdmin = await getGroupAdm(participants);
                botAdmin = groupAdmin.includes(botJid);
                isAdmin = groupAdmin.includes(senderJid);
            } catch (error) {
                console.error('Error fetching group metadata:', error);
            }
        }

        const reply = (teks) => {
            Morela.sendMessage(m.chat, {
                text: teks
            }, { quoted: m });
        };

        const time = moment().tz("Asia/Jakarta").format("HH:mm:ss");
        let ucapanWaktu = "🌆𝐒𝐞𝐥𝐚𝐦𝐚𝐭 𝐒𝐮𝐛𝐮𝐡";

        if (time >= "19:00:00" && time < "23:59:59") {
            ucapanWaktu = "🌃𝐒𝐞𝐥𝐚𝐦𝐚𝐭 𝐌𝐚𝐥𝐚𝐦";
        } else if (time >= "15:00:00" && time < "19:00:00") {
            ucapanWaktu = "🌄𝐒𝐞𝐥𝐚𝐦𝐚𝐭 𝐒𝐨𝐫𝐞";
        } else if (time >= "11:00:00" && time < "15:00:00") {
            ucapanWaktu = "🏞️𝐒𝐞𝐥𝐚𝐦𝐚𝐭 𝐒𝐢𝐚𝐧𝐠";
        } else if (time >= "06:00:00" && time < "11:00:00") {
            ucapanWaktu = "🏙️𝐒𝐞𝐥𝐚𝐦𝐚𝐭 𝐏𝐚𝐠𝐢";
        }

        const todayDateWIB = new Date().toLocaleDateString('id-ID', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const RunTime = `_${runtime(process.uptime())}_`;

        const pickRandom = (arr) => {
            return arr[Math.floor(Math.random() * arr.length)];
        };

        
        try {
            await runPassiveHandlers(m, {
                Morela,
                isOwn,
                isPrem,
                isAdmin,
                botAdmin
            });
        } catch (passiveError) {
            console.error(chalk.red('[PASSIVE HANDLERS ERROR]:'), passiveError.message);
        }

        if (command && !m.message?.reactionMessage) {
            const logBox = (title, color, items) => {
                const boxTop = `╭${'─'.repeat(58)}╮`;
                const boxBottom = `╰${'─'.repeat(58)}╯`;

                console.log(chalk.hex(color).bold(boxTop));
                console.log(chalk.hex(color).bold(`│ ${title.padEnd(56)} │`));
                console.log(chalk.hex(color).bold(`├${'─'.repeat(58)}┤`));

                items.forEach(item => {
                    console.log(chalk.hex(color).bold(`│ ${item.padEnd(56)} │`));
                });

                console.log(chalk.hex(color).bold(boxBottom));
            };

            const logItems = [
                `📅 ${chalk.cyan('Date')}    : ${todayDateWIB}`,
                `🕐 ${chalk.cyan('Time')}    : ${time}`,
                `💬 ${chalk.cyan('Type')}    : ${m.mtype}`,
                `🗣️ ${chalk.cyan('Sender')}  : ${pushname}`,
                `🤖 ${chalk.cyan('Bot')}     : ${BotNum}`,
                `📝 ${chalk.cyan('Command')} : ${chalk.yellow(command)}`,
                `📋 ${chalk.cyan('Args')}    : ${args.length > 0 ? chalk.green(args.join(' ')) : chalk.gray('None')}`
            ];

            if (m.isGroup) {
                logItems.splice(3, 0, `🌍 ${chalk.cyan('Group')}   : ${groupName}`);
                logItems.splice(4, 0, `🔑 ${chalk.cyan('Chat ID')} : ${m.chat}`);
                logBox(`📱 GROUP MESSAGE • ${groupName}`, '#3498db', logItems);
            } else {
                logBox(`🔒 PRIVATE MESSAGE • ${pushname}`, '#9b59b6', logItems);
            }
        }

        const handleDataesm = { 
            Morela, 
            text, 
            args, 
            isOwn, 
            isPrem, 
            CMD, 
            command, 
            reply, 
            m, 
            botAdmin, 
            isAdmin, 
            groupAdmin,
            downloadContentFromMessage 
        };

        
        if (!Morela.public && !isOwn) {
            return;
        }

        
        if (isSelfMode() && !isAllowedWhenSelf(m)) {
            return;
        }

        
        try {
            const { runPassiveHandlers } = await import('./Plugins-ESM/_pluginmanager.mjs');
            await runPassiveHandlers(m, {
                Morela,
                isOwn,
                isPrem,
                isAdmin,
                botAdmin,
                downloadContentFromMessage
            });
        } catch (error) {
            console.error('[Passive Handlers Error]:', error.message);
        }

        let pluginHandled = false;
        if (CMD) {
            try {
                const { default: handleMessage } = await import('./Library/handle.mjs');
                pluginHandled = await handleMessage(m, command, handleDataesm);
            } catch (error) {
                console.error('Plugin handler error:', error);
            }
        }

        if (!pluginHandled) {
            switch (command) {
                case "getcase": {
                    if (!isOwn) return reply("❌ Owner only!");
                    if (!text) return reply("❌ Masukkan nama case!\n\nContoh: .getcase menu");
                    try {
                        let hasil = Case.get(text);
                        reply(`📄 *Case: ${text}*\n\n\`\`\`js\n${hasil}\n\`\`\``);
                    } catch (e) {
                        reply(`❌ ${e.message}`);
                    }
                }
                break;

                case "addcase": {
                    if (!isOwn) return reply("❌ Owner only!");
                    if (!text) return reply("❌ Masukkan code case!\n\nContoh:\n```case \"test\": {\n  reply('Hello!');\n  break;\n}```");
                    try {
                        Case.add(text);
                        reply("✅ Case berhasil ditambahkan.");
                    } catch (e) {
                        reply(`❌ ${e.message}`);
                    }
                }
                break;

                case "delcase": {
                    if (!isOwn) return reply("❌ Owner only!");
                    if (!text) return reply("❌ Masukkan nama case!\n\nContoh: .delcase test");
                    try {
                        Case.delete(text);
                        reply(`✅ Case "${text}" berhasil dihapus.`);
                    } catch (e) {
                        reply(`❌ ${e.message}`);
                    }
                }
                break;

                case "listcase": {
                    if (!isOwn) return reply("❌ Owner only!");
                    try {
                        reply("📜 *List Case:*\n\n" + Case.list());
                    } catch (e) {
                        reply(`❌ ${e.message}`);
                    }
                }
                break;

                case "case2plugin": {
                    let textInput = args.join(" ") || (quoted && quoted.text);
                    if (!textInput) return reply("❌ Kirim code case atau reply case!\n\nContoh:\n```case \"test\": {\n  reply('Hello!');\n  break;\n}```");

                    function convertCaseToHandler(code) {
                        let nameMatch = code.match(/case\s+["'](.+?)["']:/);
                        let cmd = nameMatch ? nameMatch[1] : "cmd";

                        let bodyCode = code
                            .replace(/case\s+["'](.+?)["']:\s*/g, "")
                            .replace(/break/g, "")
                            .trim();

                        return `const handler = async (m, { text, args, reply, Morela }) => {
${bodyCode}
}

handler.help = ['${cmd}']
handler.tags = ['tools']
handler.command = ["${cmd}"]

export default handler`;
                    }

                    let result = convertCaseToHandler(textInput);
                    await reply(`✅ *CASE → HANDLER ESM*\n\n\`\`\`js\n${result}\n\`\`\``);
                }
                break;

                case "cjs2esm": {
                    let textInput = args.join(" ") || (quoted && quoted.text);
                    if (!textInput) return reply("❌ Kirim kode CJS atau reply file JS!\n\nContoh:\n.cjs2esm const fs = require('fs')");

                    function convertCJS(code) {
                        let result = code;

                        result = result.replace(
                            /const\s+(\w+)\s*=\s*require\(['"](.+?)['"]\)/g,
                            "import $1 from '$2'"
                        );

                        result = result.replace(
                            /module\.exports\s*=\s*/g,
                            "export default "
                        );

                        result = result.replace(
                            /exports\.(\w+)\s*=\s*/g,
                            "export const $1 = "
                        );

                        return result;
                    }

                    let esmCode = convertCJS(textInput);
                    await reply(`✅ *CJS → ESM Converted*\n\n\`\`\`js\n${esmCode}\n\`\`\``);
                }
                break;

                case 'esm2cjs': {
                    const q = m.quoted ? m.quoted : m;
                    const textInput = (q.msg && (q.msg.text || q.msg.caption)) || q.text || '';
                    if (!textInput) return reply('❌ Kirim/quote kode ESM yang ingin di-convert.');

                    try {
                        function convertEsmToCjs(code) {
                            let result = code;

                            result = result.replace(
                                /import\s+(\w+)\s+from\s+['"](.+?)['"]/g,
                                "const $1 = require('$2')"
                            );

                            result = result.replace(
                                /export\s+default\s+/g,
                                "module.exports = "
                            );

                            result = result.replace(
                                /export\s+const\s+(\w+)\s*=/g,
                                "exports.$1 ="
                            );

                            return result;
                        }

                        let converted = convertEsmToCjs(textInput);

                        const buffer = Buffer.from(converted, 'utf8');
                        await Morela.sendMessage(m.chat, {
                            document: buffer,
                            fileName: 'converted.cjs',
                            mimetype: 'text/javascript'
                        }, { quoted: m });

                    } catch (err) {
                        console.error(err);
                        reply('Gagal convert: ' + err.message);
                    }
                    break;
                }

                default:
                    if (budy.startsWith('=>') && isOwn) {
                        try {
                            const code = budy.slice(2);
                            const result = await eval(`(async () => { return ${code} })()`);
                            const formattedResult = util.format(result);
                            await m.reply(formattedResult);
                        } catch (error) {
                            await m.reply(`❌ Error:\n${error.message}`);
                        }
                    }

                    else if (budy.startsWith('>') && isOwn) {
                        try {
                            const code = budy.slice(1);
                            let evaled = await eval(code);
                            if (typeof evaled !== 'string') {
                                evaled = util.inspect(evaled, { depth: 1 });
                            }
                            await m.reply(evaled);
                        } catch (error) {
                            await m.reply(`❌ Error:\n${error.message}`);
                        }
                    }

                    else if (budy.startsWith('$') && isOwn) {
                        execPromise(budy.slice(1))
                            .then(({ stdout, stderr }) => {
                                if (stderr) {
                                    return m.reply(`⚠️ stderr:\n${stderr}`);
                                }
                                if (stdout) {
                                    return m.reply(`📤 stdout:\n${stdout}`);
                                }
                                return m.reply('✅ Command executed (no output)');
                            })
                            .catch(error => {
                                return m.reply(`❌ Error:\n${error.message}`);
                            });
                    }
                    break;
            }
        }

    } catch (error) {
        console.error(chalk.red.bold('Error in message handler:'), error);

        if (m && m.chat) {
            try {
                await Morela.sendMessage(m.chat, {
                    text: `❌ Error occurred:\n${error.message}\n\nPlease contact the bot owner if this persists.`
                }, { quoted: m });
            } catch (sendError) {
                console.error('Failed to send error message:', sendError);
            }
        }
    }
};

const currentFile = __filename;
fs.watchFile(currentFile, () => {
    fs.unwatchFile(currentFile);
    console.log(chalk.green(`✔ ${path.basename(currentFile)} updated! Reloading...`));
});

export default Morela;
