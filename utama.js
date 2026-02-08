import './config.js';
import baileys from "@itsukichan/baileys";
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    jidDecode,
    proto,
    getAggregateVotesInPollMessage
} = baileys;

import chalk from 'chalk';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import readline from 'readline';
import PhoneNumber from 'awesome-phonenumber';
import path from 'path';
import { fileURLToPath } from 'url';
import { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } from './System/message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.clear();

const usePairingCode = true;

function question(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const Morela = makeWASocket({
        printQRInTerminal: !usePairingCode,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        generateHighQualityLinkPreview: true,
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }
            return message;
        },
        logger: pino({
            level: 'silent'
        }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino().child({
                level: 'silent',
                stream: 'store'
            })),
        }
    });

    if (!Morela.authState.creds.registered) {
        const phoneNumber = await question(chalk.blue(`Enter Your Number\nYour Number: `));
        const code = await Morela.requestPairingCode(phoneNumber.trim());
        console.log(chalk.green(`\nCode: ${code}`));
    }

    const store = makeInMemoryStore({
        logger: pino({ level: 'silent' }).child({ stream: 'store' })
    });

    store.bind(Morela.ev);

    Morela.ev.on('call', async (caller) => {
        console.log("CALL OUTGOING");
    });

    Morela.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    Morela.ev.on('messages.upsert', async chatUpdate => {
        try {
            let mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
            
            if (mek.key && mek.key.remoteJid && mek.key.remoteJid.includes('@newsletter')) {
                console.log(chalk.yellow('[FILTER] Newsletter message skipped'));
                return;
            }
            if (!Morela.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
            
            let m = smsg(Morela, mek, store);
            
            const { default: morelaHandler } = await import('./Morela.js');
            morelaHandler(Morela, m, chatUpdate, store);
        } catch (error) {
            console.error(chalk.red("❌ Error processing message upsert:"), error.message);
            
            if (process.env.DEBUG) {
                console.error(chalk.gray(error.stack));
            }
        }
    });

    Morela.getFile = async (PATH, save) => {
        let res;
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
        let type = await fileTypeFromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
        let filename = path.join(__dirname, new Date() * 1 + '.' + type.ext);
        if (data && save) await fs.promises.writeFile(filename, data);
        return { res, filename, size: await getSizeMedia(data), ...type, data };
    };

    
    
    
    Morela.downloadMediaMessage = async (message) => {
        try {
            
            if (!message || (!message.msg && !message.message)) {
                throw new Error("Invalid message object - no msg or message property");
            }

            let quoted = message.msg || message.message || message;
            let mime = (quoted.msg || quoted).mimetype || '';
            
            
            let messageType = message.mtype 
                ? message.mtype.replace(/Message/gi, '') 
                : mime.split('/')[0];

            
            if (!messageType || messageType === 'undefined' || messageType === '') {
                const types = ['image', 'video', 'sticker', 'audio', 'document'];
                for (const t of types) {
                    if (quoted[`${t}Message`] || mime.includes(t)) {
                        messageType = t;
                        break;
                    }
                }
            }

            
            console.log(chalk.cyan(`[DOWNLOAD] Attempting: type=${messageType}, mime=${mime}`));

            
            if (!messageType) {
                throw new Error("Cannot determine message type");
            }

            
            const stream = await downloadContentFromMessage(quoted, messageType);
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            
            if (!buffer || buffer.length === 0) {
                throw new Error("Downloaded buffer is empty");
            }

            console.log(chalk.green(`[DOWNLOAD] Success: ${buffer.length} bytes`));
            return buffer;

        } catch (error) {
            console.error(chalk.red("[DOWNLOAD] Error:"), error.message);
            
            
            try {
                const msg = message.msg || message.message || message;
                if (msg.url) {
                    console.log(chalk.yellow("[DOWNLOAD] Trying fallback method..."));
                    const response = await getBuffer(msg.url);
                    if (response && response.length > 0) {
                        console.log(chalk.green(`[DOWNLOAD] Fallback success: ${response.length} bytes`));
                        return response;
                    }
                }
            } catch (fallbackError) {
                console.error(chalk.red("[DOWNLOAD] Fallback failed:"), fallbackError.message);
            }

            throw new Error(`Failed to download media: ${error.message}`);
        }
    };

    
    
    
    Morela.downloadMedia = async (message, options = {}) => {
        const { 
            forceType = null,
            maxRetries = 3,
            retryDelay = 1000 
        } = options;

        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(chalk.cyan(`[DOWNLOAD-V2] Attempt ${attempt}/${maxRetries}`));
                
                let quoted = message.msg || message.message || message;
                let mime = (quoted.msg || quoted).mimetype || '';
                let messageType = forceType || (
                    message.mtype 
                        ? message.mtype.replace(/Message/gi, '') 
                        : mime.split('/')[0]
                );

                
                if (!messageType || messageType === 'undefined') {
                    const types = ['image', 'video', 'sticker', 'audio', 'document'];
                    for (const t of types) {
                        if (quoted[`${t}Message`] || mime.includes(t)) {
                            messageType = t;
                            break;
                        }
                    }
                }

                const stream = await downloadContentFromMessage(quoted, messageType);
                let buffer = Buffer.from([]);
                
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                if (buffer && buffer.length > 0) {
                    console.log(chalk.green(`[DOWNLOAD-V2] Success on attempt ${attempt}: ${buffer.length} bytes`));
                    return buffer;
                }

                throw new Error("Empty buffer received");

            } catch (attemptError) {
                console.error(chalk.yellow(`[DOWNLOAD-V2] Attempt ${attempt} failed:`), attemptError.message);
                lastError = attemptError;
                
                if (attempt < maxRetries) {
                    await sleep(retryDelay * attempt);
                }
            }
        }

        throw lastError || new Error("Download failed after all retries");
    };

    Morela.sendText = (jid, text, quoted = '', options) => Morela.sendMessage(jid, { text, ...options }, { quoted });

    Morela.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer = options && (options.packname || options.author) ? await writeExifImg(buff, options) : await imageToWebp(buff);
        await Morela.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    Morela.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer = options && (options.packname || options.author) ? await writeExifVid(buff, options) : await videoToWebp(buff);
        await Morela.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    Morela.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        let type = await fileTypeFromBuffer(buffer);
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
        await fs.writeFileSync(trueFileName, buffer);
        return trueFileName;
    };

    Morela.sendMedia = async (jid, path, caption = '', quoted = '', options = {}) => {
        let { mime, data } = await Morela.getFile(path, true);
        let messageType = mime.split('/')[0];
        let messageContent = {};

        if (messageType === 'image') {
            messageContent = { image: data, caption: caption, ...options };
        } else if (messageType === 'video') {
            messageContent = { video: data, caption: caption, ...options };
        } else if (messageType === 'audio') {
            messageContent = { audio: data, ptt: options.ptt || false, ...options };
        } else {
            messageContent = { document: data, mimetype: mime, fileName: options.fileName || 'file' };
        }

        await Morela.sendMessage(jid, messageContent, { quoted });
    };

    Morela.sendPoll = async (jid, question, options) => {
        const pollMessage = {
            pollCreationMessage: {
                name: question,
                options: options.map(option => ({ optionName: option })),
                selectableCount: 1,
            },
        };

        await Morela.sendMessage(jid, pollMessage);
    };

    Morela.public = true;

    Morela.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log(chalk.green(' Connected to WhatsApp!'));
        }
    });

    Morela.ev.on('error', (err) => {
        console.error(chalk.red("Error: "), err.message || err);
    });

    Morela.ev.on('creds.update', saveCreds);
}

connectToWhatsApp();
