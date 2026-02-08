import axios from "axios"
import FormData from "form-data"

const uploadDeline = async (buffer, ext = "bin", mime = "application/octet-stream") => {
  const fd = new FormData()
  fd.append("file", buffer, {
    filename: `file.${ext}`,
    contentType: mime
  })

  const res = await axios.post("https://api.deline.web.id/uploader", fd, {
    headers: fd.getHeaders(),
    maxBodyLength: 50 * 1024 * 1024,
    maxContentLength: 50 * 1024 * 1024
  })

  const data = res.data || {}
  if (data.status === false) {
    throw new Error(data.message || data.error || "Upload failed")
  }

  const link = data?.result?.link || data?.url || data?.path
  if (!link) throw new Error("Invalid response (no link found)")
  return link
}

const generateDiscordImage = async (username, message, avatarUrl) => {
  const fd = new FormData()
  fd.append("username", username)
  fd.append("message", message)

  const avatarRes = await axios.get(avatarUrl, { responseType: "arraybuffer" })
  const avatarBuffer = Buffer.from(avatarRes.data)

  fd.append("avatar", avatarBuffer, {
    filename: "avatar.png",
    contentType: "image/png"
  })

  const res = await axios.post("https://fathurweb.qzz.io/api/canvas/fakedcmsg", fd, {
    headers: fd.getHeaders(),
    responseType: "arraybuffer"
  })

  return Buffer.from(res.data)
}

const handler = async (m, { Morela, text, reply }) => {
  try {
    
    if (!text || !text.includes("|")) {
      return reply(
`❌ *Cara Pakai:*

1️⃣ Kirim / reply gambar dengan caption:
   \`.discord username | pesan\`

2️⃣ Contoh:
   \`.discord putraa | halo halo\`

📝 *Catatan:*
• Gambar = avatar Discord
• Username = nama user
• Pesan = isi chat`
      )
    }

    
    const [username, ...msgParts] = text.split("|")
    const message = msgParts.join("|").trim()

    if (!username.trim() || !message) {
      return reply("❌ Username dan pesan harus diisi!")
    }

    
    const quoted = m.quoted || m
    const hasImage = quoted.mtype === 'imageMessage'

    if (!hasImage) {
      return reply("❌ Kirim atau reply gambar dengan caption: `.discord username | pesan`")
    }

    
    let buffer
    try {
      await reply("⏳ Sedang memproses gambar...")
      
      
      buffer = await Morela.downloadMediaMessage(quoted)
      
      
      if (!buffer || buffer.length === 0) {
        throw new Error("Buffer kosong")
      }

    } catch (downloadError) {
      console.error("[DISCORD] Download error:", downloadError)
      
      
      try {
        const stream = await downloadContentFromMessage(
          quoted.msg || quoted,
          'image'
        )
        
        const chunks = []
        for await (const chunk of stream) {
          chunks.push(chunk)
        }
        buffer = Buffer.concat(chunks)
        
        if (!buffer || buffer.length === 0) {
          throw new Error("Gagal download gambar")
        }
      } catch (fallbackError) {
        console.error("[DISCORD] Fallback error:", fallbackError)
        return reply("❌ Gagal mendownload gambar. Coba kirim ulang gambarnya atau gunakan gambar yang berbeda.")
      }
    }

    
    let avatarUrl
    try {
      avatarUrl = await uploadDeline(buffer, "png", "image/png")
    } catch (uploadError) {
      console.error("[DISCORD] Upload error:", uploadError)
      return reply("❌ Gagal upload gambar ke server. Coba lagi nanti.")
    }

    
    let discordImage
    try {
      discordImage = await generateDiscordImage(
        username.trim(),
        message,
        avatarUrl
      )
    } catch (genError) {
      console.error("[DISCORD] Generate error:", genError)
      return reply("❌ Gagal membuat gambar Discord. Coba lagi nanti.")
    }

    
    await Morela.sendMessage(
      m.chat,
      { 
        image: discordImage,
        caption: `✅ Fake Discord Message\n👤 User: ${username.trim()}\n💬 Pesan: ${message}`
      },
      { quoted: m }
    )

  } catch (err) {
    console.error("[DISCORD] Error:", err)
    reply(`❌ Terjadi kesalahan:\n${err.message}\n\nCoba lagi atau hubungi owner jika error terus muncul.`)
  }
}

handler.command = ["discord", "fakediscord", "discordmsg"]
handler.tags = ["maker"]
handler.help = ["discord <username> | <pesan>"]

export default handler