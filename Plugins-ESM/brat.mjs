import axios from "axios"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import ffmpeg from "fluent-ffmpeg"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TMP = path.join(process.cwd(), "media", "brat")
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true })

const imageToWebp = (input, output) =>
  new Promise((resolve, reject) => {
    ffmpeg(input)
      .outputOptions([
        "-vcodec", "libwebp",
        "-vf", "scale=512:512:force_original_aspect_ratio=decrease",
        "-loop", "0",
        "-an",
        "-vsync", "0"
      ])
      .on("end", resolve)
      .on("error", reject)
      .save(output)
  })

const handler = async (m, { Morela, reply }) => {
  const text = m.text
    ?.replace(/^(\.brat|\!brat|\/brat)\s*/i, "")
    .trim()

  if (!text) return reply("Contoh: *.brat halooo semuaaa nyaaaa*")

  const id = Date.now()
  const img = path.join(TMP, `${id}.png`)
  const webp = path.join(TMP, `${id}.webp`)

  await Morela.sendMessage(m.chat, {
    react: { text: "⏳", key: m.key }
  })

  try {
    const res = await axios.get(
      "https://api-faa.my.id/faa/brathd?text=" +
        encodeURIComponent(text),
      { responseType: "arraybuffer" }
    )

    fs.writeFileSync(img, res.data)
    await imageToWebp(img, webp)

    await Morela.sendMessage(
      m.chat,
      { sticker: fs.readFileSync(webp) },
      { quoted: m }
    )

    await Morela.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })
  } catch (e) {
    console.error("[BRAT]", e)
    await reply("❌ Gagal membuat stiker brat.")
  } finally {
    try { fs.unlinkSync(img) } catch {}
    try { fs.unlinkSync(webp) } catch {}
  }
}

handler.command = ["brat"]
handler.tags = ["sticker"]
handler.help = ["brat <teks>"]

export default handler