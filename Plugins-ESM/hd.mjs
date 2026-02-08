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
  const msg = m.message
  const img =
    msg?.imageMessage ||
    msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

  if (!img)
    return reply("❌ Reply gambar atau kirim foto dengan caption *.hd*")

  await Morela.sendMessage(m.chat, {
    react: { text: "⏳", key: m.key }
  })

  let buffer
  try {
    const stream = await downloadContentFromMessage(img, "image")
    const chunks = []
    for await (const c of stream) chunks.push(c)
    buffer = Buffer.concat(chunks)
    if (!buffer.length) throw new Error()
  } catch {
    await Morela.sendMessage(m.chat, {
      react: { text: "❌", key: m.key }
    })
    return reply("❌ Gagal download gambar")
  }

  let imageUrl
  try {
    const base64 = buffer.toString("base64")
    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
      new URLSearchParams({ image: base64 }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 30000
      }
    )

    imageUrl = upload.data?.data?.url
    if (!imageUrl) throw new Error()
  } catch {
    await Morela.sendMessage(m.chat, {
      react: { text: "❌", key: m.key }
    })
    return reply("❌ Upload gambar gagal")
  }

  let result
  try {
    const res = await axios.get(
      "https://api.deline.web.id/tools/hd",
      {
        params: { url: imageUrl },
        responseType: "arraybuffer",
        timeout: 120000
      }
    )
    result = Buffer.from(res.data)
    if (!result.length) throw new Error()
  } catch {
    await Morela.sendMessage(m.chat, {
      react: { text: "❌", key: m.key }
    })
    return reply("❌ Proses HD gagal")
  }

  await Morela.sendMessage(
    m.chat,
    {
      image: result,
      caption: "✨ HD selesai",
      contextInfo: waContext(imagePath)
    },
    { quoted: waQuoted }
  )

  await Morela.sendMessage(m.chat, {
    react: { text: "✅", key: m.key }
  })
}

handler.command = ["hd", "superhd"]
handler.tags = ["tools"]
handler.help = ["hd"]

export default handler