import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { runtime } from '../System/message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function toBoldItalic(text) {
  const boldItalicMap = {
    'A': '𝑨', 'B': '𝑩', 'C': '𝑪', 'D': '𝑫', 'E': '𝑬', 'F': '𝑭', 'G': '𝑮', 'H': '𝑯', 'I': '𝑰', 'J': '𝑱',
    'K': '𝑲', 'L': '𝑳', 'M': '𝑴', 'N': '𝑵', 'O': '𝑶', 'P': '𝑷', 'Q': '𝑸', 'R': '𝑹', 'S': '𝑺', 'T': '𝑻',
    'U': '𝑼', 'V': '𝑽', 'W': '𝑾', 'X': '𝑿', 'Y': '𝒀', 'Z': '𝒁',
    'a': '𝒂', 'b': '𝒃', 'c': '𝒄', 'd': '𝒅', 'e': '𝒆', 'f': '𝒇', 'g': '𝒈', 'h': '𝒉', 'i': '𝒊', 'j': '𝒋',
    'k': '𝒌', 'l': '𝒍', 'm': '𝒎', 'n': '𝒏', 'o': '𝒐', 'p': '𝒑', 'q': '𝒒', 'r': '𝒓', 's': '𝒔', 't': '𝒕',
    'u': '𝒖', 'v': '𝒗', 'w': '𝒘', 'x': '𝒙', 'y': '𝒚', 'z': '𝒛',
    '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
  };
  
  return text.split('').map(char => boldItalicMap[char] || char).join('');
}


const CONFIG = {
  botName: "Morela",
  botVersion: "v1.0.0",
  imagePath: "/home/container/media/menu.jpg",
  
  
  newsletterJid: "",
  newsletterName: "",
  channelUrl: "",
  footer: "powered by Morela"
};


const MENU_LISTS = {
  ai: {
    emoji: "🤖",
    title: "AI MENU",
    commands: ["img"]
  },
  downloader: {
    emoji: "📥",
    title: "DOWNLOADER",
    commands: ["alldownload", "yts"]
  },
  sticker: {
    emoji: "✨",
    title: "STICKER",
    commands: ["attp", "emoji", "emojimix", "qc", "brat", "bratvid", "smeme", "bratspongebob", "ttp"]
  },
  maker: {
    emoji: "🎨",
    title: "MAKER",
    commands: ["fakedev", "discord", "fakestory", "faketweet", "iqc", "tofigura", "carbon", "pin"]
  },
  tools: {
    emoji: "🛠️",
    title: "TOOLS",
    commands: ["hd", "hdvid", "tempmail", "rvo"]
  },
  hiburan: {
    emoji: "🎮",
    title: "HIBURAN",
    commands: ["truthordare"]
  }
};

const waQuoted = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "0@s.whatsapp.net"
  },
  message: { conversation: "" }
};


function getGreeting() {
  
  const hour = new Date().toLocaleString('en-US', { 
    timeZone: 'Asia/Jakarta',
    hour: 'numeric',
    hour12: false 
  });
  const currentHour = parseInt(hour);
  
  if (currentHour >= 0 && currentHour < 5) return toBoldItalic("🌙 Selamat Malam");
  if (currentHour >= 5 && currentHour < 11) return toBoldItalic("🌅 Selamat Pagi");
  if (currentHour >= 11 && currentHour < 15) return toBoldItalic("☀️ Selamat Siang");
  if (currentHour >= 15 && currentHour < 18) return toBoldItalic("🌤️ Selamat Sore");
  return toBoldItalic("🌙 Selamat Malam");
}

function buildSections() {
  const sections = [];
  
  for (const [key, data] of Object.entries(MENU_LISTS)) {
    sections.push({
      title: `${data.emoji} ${data.title}`,  
      highlight_label: "",  
      rows: [{
        header: "",  
        title: "",   
        description: toBoldItalic(`Tampilkan semua menu ${data.title.toLowerCase()}`),
        id: `menu_${key}`
      }]
    });
  }
  
  return sections;
}

async function sendCategoryList(Morela, m, category) {
  const data = MENU_LISTS[category];
  if (!data) return null;
  

  let imageBuffer;
  if (fs.existsSync(CONFIG.imagePath)) {
    imageBuffer = fs.readFileSync(CONFIG.imagePath);
  }
  
  
  const titleText = toBoldItalic(`${data.title.split(' ')[0]} Feature`);
  let caption = `╭─────○ [ ${data.emoji} ${titleText} ]
│\n`;
  
  
  data.commands.forEach((cmd) => {
    caption += `│  ▸ ${toBoldItalic(cmd)}\n`;
  });
  
  caption += `│
╰─────────────────○`;
  
  const categoryName = data.title.toLowerCase();
  
  await Morela.sendMessage(
    m.chat,
    {
      text: caption,
      contextInfo: {
        externalAdReply: {
          title: `${data.emoji} ${data.title}`,
          body: toBoldItalic(`Tampilkan semua menu ${categoryName}`),
          thumbnail: imageBuffer,
          sourceUrl: "https://whatsapp.com",
          mediaType: 1
        }
      }
    },
    { quoted: m }
  );
  
  return true;
}

function buildCaption(name) {
  const greeting = getGreeting();
  const uptime = runtime(process.uptime());
  const mode = global.public === false ? "Self" : "Public";
  

  let totalCommands = 0;
  Object.values(MENU_LISTS).forEach(data => {
    totalCommands += data.commands.length;
  });
  
  return `${greeting},
${toBoldItalic(`Aku ${CONFIG.botName}, bot WhatsApp yang siap bantu kamu.`)}

${toBoldItalic('Kamu bisa pakai aku buat cari info,  atau bantu hal-hal sederhana langsung lewat WhatsApp.')}

╭───○ [ 🤖 ${toBoldItalic('BOT INFO')} ]
│
│  ◦ ${toBoldItalic('NAMA')}: ${CONFIG.botName}
│  ◦ ${toBoldItalic('VERSI')}: ${CONFIG.botVersion}
│  ◦ ${toBoldItalic('MODE')}: ${mode}
│  ◦ ${toBoldItalic('UPTIME')}: ${uptime}
│  ◦ ${toBoldItalic('TOTAL CMD')}: ${totalCommands}
│
╰─────────────────○

${toBoldItalic('Pilih kategori menu yang ingin kamu gunakan:')}`;
}


const handler = async (m, { Morela, reply, command }) => {
  try {
    const name = m.pushName || "User";
    
    
    if (command.startsWith('menu_')) {
      const category = command.replace('menu_', '');
      const result = await sendCategoryList(Morela, m, category);
      
      if (!result) {
        return reply(toBoldItalic('❌ Kategori tidak ditemukan atau gambar tidak tersedia'));
      }
      return;
    }
    
    
    const sections = buildSections();
    const caption = buildCaption(name);
    
    
    let imageBuffer;
    if (fs.existsSync(CONFIG.imagePath)) {
      imageBuffer = fs.readFileSync(CONFIG.imagePath);
    } else {
      return reply(toBoldItalic(`❌ Error: Gambar menu tidak ditemukan di ${CONFIG.imagePath}`));
    }
    
    
    const interactiveMessage = {
      image: imageBuffer,
      caption: caption,
      footer: CONFIG.footer,
      interactiveButtons: [
        {
          name: "single_select",
          buttonParamsJson: JSON.stringify({
            title: "" + toBoldItalic("Pilih Kategori"),
            sections: sections
          })
        }
      ],
      hasMediaAttachment: true
    };
    
    
    if (CONFIG.newsletterJid) {
      interactiveMessage.contextInfo = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: CONFIG.newsletterJid,
          serverMessageId: 1,
          newsletterName: CONFIG.newsletterName || CONFIG.botName
        }
      };
    }
    

    if (CONFIG.channelUrl) {
      interactiveMessage.interactiveButtons.push({
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: toBoldItalic("Channel"),
          url: CONFIG.channelUrl,
          merchant_url: CONFIG.channelUrl
        })
      });
    }
    
    await Morela.sendMessage(
      m.chat,
      interactiveMessage,
      { quoted: waQuoted }
    );
    
  } catch (error) {
    console.error("[MENU ERROR]", error);
    reply(toBoldItalic(`❌ Terjadi kesalahan saat menampilkan menu: ${error.message}`));
  }
};

handler.help = ['menu', 'help'];
handler.tags = ['main'];
handler.command = [
  'menu', 'help',
  'menu_ai', 'menu_downloader', 'menu_sticker', 
  'menu_maker', 'menu_tools', 'menu_hiburan'
];

export default handler;