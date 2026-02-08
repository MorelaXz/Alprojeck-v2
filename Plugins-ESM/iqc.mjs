import axios from "axios"
import fs from "fs"

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
  const text = m.text
    ?.replace(/^(\.iqc|\!iqc|\/iqc)\s*/i, "")
    .trim()

  if (!text)
    return reply("Contoh: *.iqc hahaha bangke*")

  await Morela.sendMessage(m.chat, {
    react: { text: "⏳", key: m.key }
  })

  const now = new Date()
  const time =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0")

  const battery = Math.floor(Math.random() * 60) + 40
  const nonce = Date.now() + Math.floor(Math.random() * 9999)

  const apiUrl =
    "https://brat.siputzx.my.id/iphone-quoted?" +
    `time=${encodeURIComponent(time)}` +
    `&batteryPercentage=${battery}` +
    `&carrierName=INDOSAT` +
    `&messageText=${encodeURIComponent(text)}` +
    `&emojiStyle=apple` +
    `&_=${nonce}`

  try {
    const res = await axios.get(apiUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "image/*"
      },
      timeout: 30000
    })

    const type = res.headers["content-type"] || ""
    if (!type.startsWith("image/")) throw new Error("NOT_IMAGE")

    await Morela.sendMessage(
      m.chat,
      {
        image: Buffer.from(res.data),
        caption: "✨ iPhone Quoted",
        contextInfo: waContext(imagePath)
      },
      { quoted: waQuoted }
    )

    await Morela.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })

  } catch (e) {
    console.error("[IQC ERROR]", e.message)

    await Morela.sendMessage(m.chat, {
      react: { text: "❌", key: m.key }
    })

    reply(
      "❌ Gagal membuat IQC.\n" +
      "• Server API kadang cache\n" +
      "• Coba ulangi command\n" +
      "• Atau tunggu ±10 detik"
    )
  }
}

handler.command = ["iqc"]
handler.tags = ["tools"]
handler.help = ["iqc <teks>"]

export default handler