import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import ffmpeg from "fluent-ffmpeg"
import { downloadMediaMessage } from "@itsukichan/baileys"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMP_DIR = path.join(process.cwd(), "media", "temp")
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

const imageBufferToWebp = buffer =>
  new Promise((resolve, reject) => {
    const stamp = Date.now()
    const input = path.join(TEMP_DIR, `in_${stamp}.jpg`)
    const output = path.join(TEMP_DIR, `out_${stamp}.webp`)

    fs.writeFileSync(input, buffer)

    ffmpeg(input)
      .on("error", e => {
        try { fs.unlinkSync(input) } catch {}
        try { fs.unlinkSync(output) } catch {}
        reject(e)
      })
      .on("end", () => {
        try { fs.unlinkSync(input) } catch {}
        const webp = fs.readFileSync(output)
        try { fs.unlinkSync(output) } catch {}
        resolve(webp)
      })
      .outputOptions([
        "-vcodec", "libwebp",
        "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15",
        "-loop", "0",
        "-preset", "default",
        "-an",
        "-vsync", "0"
      ])
      .save(output)
  })

const handler = async (m, { Morela, reply }) => {
  const quoted =
    m.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const imageMsg = quoted?.imageMessage

  if (!imageMsg) {
    const info = `
╭─❖ 〔 Sticker Guide 〕
│ Reply ke foto
│ lalu kirim perintah:
│ .stiker  atau  /stiker
╰───────────────────────❏
`.trim()

    await Morela.sendMessage(
      m.chat,
      { text: info },
      { quoted: m }
    )
    return
  }

  await Morela.sendMessage(m.chat, {
    react: { text: "⏳", key: m.key }
  })

  const buffer = await downloadMediaMessage(
    { key: m.key, message: { imageMessage: imageMsg } },
    "buffer",
    {},
    { logger: console }
  )

  if (!buffer) return reply("Gagal mengunduh foto. Coba lagi.")

  let webp
  try {
    webp = await imageBufferToWebp(buffer)
  } catch (e) {
    console.error("[STIKER]", e)
    return reply("Gagal mengonversi foto menjadi stiker. Pastikan ffmpeg terpasang.")
  }

  await Morela.sendMessage(
    m.chat,
    { sticker: webp },
    { quoted: m }
  )

  await Morela.sendMessage(m.chat, {
    react: { text: "✅", key: m.key }
  })
}

handler.command = ["stiker", "sticker"]
handler.tags = ["sticker"]
handler.help = ["stiker"]

export default handler