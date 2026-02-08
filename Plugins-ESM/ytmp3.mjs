import ytdl from "youtube-dl-exec"
import fs from "fs"
import path from "path"

const waQuoted = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "0@s.whatsapp.net"
  },
  message: { conversation: "" }
}

const imagePath = "/home/container/media/menu.jpg"

const waContext = imagePath => ({
  externalAdReply: {
    body: "© ᴍᴏʀᴇʟᴀ",
    thumbnail:
      imagePath && fs.existsSync(imagePath)
        ? fs.readFileSync(imagePath)
        : undefined,
    sourceUrl: "https://www.whatsapp.com",
    mediaType: 1
  }
})

const handler = async (m, { Morela, reply }) => {
  let url = ""

  
  
  
  const interactive =
    m.message?.interactiveResponseMessage?.nativeFlowResponseMessage

  if (interactive?.paramsJson) {
    try {
      const parsed = JSON.parse(interactive.paramsJson)
      url = parsed.id || ""
      url = url.replace(/^(\.ytmp3|\.yta|\.mp3)\s*/i, "").trim()
    } catch {}
  }

  
  
  
  if (!url && m.text) {
    url = m.text
      .replace(/^(\.ytmp3|\.yta|\.mp3)\s*/i, "")
      .trim()
  }

  if (!url) return reply("📝 Contoh: *.ytmp3 link*")

  if (!url.match(/(youtube\.com|youtu\.be)/))
    return reply("❌ Link YouTube tidak valid")

  await Morela.sendMessage(m.chat, {
    react: { text: "📥", key: m.key }
  })

  try {
    
    
    
    const info = await ytdl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        "referer:youtube.com",
        "user-agent:googlebot"
      ]
    })

    const title = info.title || "YouTube Audio"
    const duration = info.duration || 0
    const channel = info.uploader || info.channel || "Unknown"

    if (duration > 1200)
      return reply("❌ Durasi maksimal 20 menit")

    
    
    
    const tempDir = path.join(process.cwd(), "media", "temp")
    if (!fs.existsSync(tempDir))
      fs.mkdirSync(tempDir, { recursive: true })

    const out = path.join(tempDir, `${Date.now()}.mp3`)

    
    
    
    await ytdl(url, {
      extractAudio: true,
      audioFormat: "mp3",
      audioQuality: 0,
      output: out,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        "referer:youtube.com",
        "user-agent:googlebot"
      ]
    })

    const sizeMB = fs.statSync(out).size / 1024 / 1024
    if (sizeMB > 100) {
      fs.unlinkSync(out)
      return reply(`❌ File terlalu besar (${sizeMB.toFixed(2)} MB)`)
    }

    await Morela.sendMessage(m.chat, {
      react: { text: "📤", key: m.key }
    })

    
    
    
    await Morela.sendMessage(
      m.chat,
      {
        audio: fs.readFileSync(out),
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
        caption:
          `🎧 *${title}*\n` +
          `👤 ${channel}\n` +
          `⏱️ ${formatDuration(duration)}`,
        contextInfo: waContext(imagePath)
      },
      { quoted: waQuoted }
    )

    await Morela.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })

    fs.unlinkSync(out)

  } catch (e) {
    console.error("[YTMP3 ERROR]", e)
    await Morela.sendMessage(m.chat, {
      react: { text: "❌", key: m.key }
    })
    reply("❌ Gagal download audio")
  }
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

handler.command = ["ytmp3", "yta", "mp3"]
handler.tags = ["downloader"]
handler.help = ["ytmp3 <link>"]

export default handler