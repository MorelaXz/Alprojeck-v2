import axios from "axios"
import fs from "fs"
import { downloadContentFromMessage } from "@itsukichan/baileys"

const IMGBB_KEY = "a0fa1c4b6c7b1570879c6d71b590f4bf"

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
  try {
    const msg = m.message
    const img =
      msg?.imageMessage ||
      msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

    if (!img)
      return reply("❌ Kirim atau reply gambar terlebih dahulu.")

    await Morela.sendMessage(m.chat, {
      react: { text: "⏳", key: m.key }
    })

    const stream = await downloadContentFromMessage(img, "image")
    const chunks = []
    for await (const c of stream) chunks.push(c)
    const buffer = Buffer.concat(chunks)

    if (!buffer || buffer.length === 0)
      return reply("❌ Gagal mendownload gambar.")

    const base64 = buffer.toString("base64")

    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
      new URLSearchParams({ image: base64 }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 30000
      }
    )

    const imageUrl = upload.data?.data?.url
    if (!imageUrl) throw new Error("UPLOAD_IMGBB_FAILED")

    const apiUrl =
      "https://api-faa.my.id/faa/tofigura?url=" +
      encodeURIComponent(imageUrl)

    const res = await axios.get(apiUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
      headers: { Accept: "image/*" }
    })

    if (!res.data || res.data.length === 0)
      return reply("❌ Gagal mengkonversi gambar.")

    await Morela.sendMessage(
      m.chat,
      {
        image: Buffer.from(res.data),
        caption: "✨ Figur berhasil dibuat",
        contextInfo: waContext(imagePath)
      },
      { quoted: waQuoted }
    )

    await Morela.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })
  } catch (e) {
    console.error("[TOFIGURA]", e)

    await Morela.sendMessage(m.chat, {
      react: { text: "❌", key: m.key }
    })

    let msg = "❌ Terjadi kesalahan: "
    if (e.code === "ECONNABORTED") msg += "Timeout, coba lagi nanti."
    else if (e.response) msg += `Server error (${e.response.status})`
    else if (e.request) msg += "Tidak dapat terhubung ke server."
    else msg += e.message || "Kesalahan tidak diketahui."

    await reply(msg)
  }
}

handler.command = ["figure", "tofigura"]
handler.tags = ["tools"]
handler.help = ["tofigura"]

export default handler