import axios from "axios"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import ffmpeg from "fluent-ffmpeg"
import { downloadMediaMessage } from "@itsukichan/baileys"

const IMGBB_KEY = "a0fa1c4b6c7b1570879c6d71b590f4bf"

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
  const raw = m.text
    ?.replace(/^(\.smeme|\!smeme|\/smeme)\s*/i, "")
    .trim()

  const [top, bottom] = raw?.split("|").map(v => v?.trim())

  if (!top || !bottom)
    return reply(
      "Format:\n.smeme teks atas|teks bawah\nReply gambar atau kirim dengan caption"
    )

  const quoted =
    m.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const imageMsg =
    quoted?.imageMessage ||
    m.message?.imageMessage

  if (!imageMsg)
    return reply("Reply gambar atau kirim perintah bersama foto")

  await Morela.sendMessage(m.chat, {
    react: { text: "⏳", key: m.key }
  })

  try {
    const imgBuffer = await downloadMediaMessage(
      { key: m.key, message: { imageMessage: imageMsg } },
      "buffer",
      {},
      { logger: console }
    )

    const base64 = imgBuffer.toString("base64")

    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
      new URLSearchParams({ image: base64 }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 30000
      }
    )

    const imgUrl = upload.data?.data?.url
    if (!imgUrl) throw new Error("UPLOAD_IMGBB_FAILED")

    const api =
      "https://api.deline.web.id/maker/smeme?" +
      "image=" + encodeURIComponent(imgUrl) +
      "&top=" + encodeURIComponent(top) +
      "&bottom=" + encodeURIComponent(bottom)

    const res = await axios.get(api, { responseType: "arraybuffer" })
    const webp = await imageBufferToWebp(Buffer.from(res.data))

    await Morela.sendMessage(
      m.chat,
      { sticker: webp },
      { quoted: m }
    )

    await Morela.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })
  } catch (e) {
    console.error("[SMEME]", e)
    await reply("Gagal membuat sticker meme")
  }
}

handler.command = ["smeme"]
handler.tags = ["sticker"]
handler.help = ["smeme <atas>|<bawah>"]

export default handler