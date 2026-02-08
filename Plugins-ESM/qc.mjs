import axios from "axios"
import sharp from "sharp"

const handler = async (m, { Morela, reply }) => {
  try {
    await Morela.sendMessage(m.chat, {
      react: { text: "🌑", key: m.key }
    })

    let who = m.key.participant || m.chat
    let name = m.pushName || "User"
    let text = m.text?.trim()

    const quoted =
      m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const quotedInfo =
      m.message?.extendedTextMessage?.contextInfo

    if (quoted) {
      who = quotedInfo.participant || quotedInfo.remoteJid
      if (!text) {
        text =
          quoted.conversation ||
          quoted.extendedTextMessage?.text ||
          quoted.imageMessage?.caption ||
          ""
      }
      name = who.split("@")[0]
    }

    if (!text) return reply("❌ Teksnya mana beb?")

    let pp
    try {
      pp = await Morela.profilePictureUrl(who, "image")
    } catch {
      pp = "https://telegra.ph/file/24fa902ead26340f3df2c.png"
    }

    const res = await axios.get(
      "https://api.deline.web.id/maker/qc",
      {
        params: {
          text,
          color: "white",
          avatar: pp,
          nama: name
        },
        responseType: "arraybuffer"
      }
    )

    const sticker = await sharp(Buffer.from(res.data))
      .resize(512, 512, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality: 100 })
      .toBuffer()

    await Morela.sendMessage(
      m.chat,
      { sticker },
      { quoted: m }
    )

    await Morela.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })
  } catch (e) {
    console.error("[QC]", e)
    await reply("❌ Gagal bikin quote.")
  }
}

handler.command = ["qc"]
handler.tags = ["sticker"]
handler.help = ["qc <teks>"]

export default handler