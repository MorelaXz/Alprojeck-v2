import fs from "fs"
import axios from "axios"
import FormData from "form-data"
import fetch from "node-fetch"
import { downloadContentFromMessage } from "@itsukichan/baileys"

async function uploadCatbox(filePath) {
  const form = new FormData()
  form.append("fileToUpload", fs.createReadStream(filePath))
  form.append("reqtype", "fileupload")

  const res = await axios.post("https://catbox.moe/user/api.php", form, {
    headers: form.getHeaders()
  })

  return res.data
}

const handler = async (m, { Morela, text, reply }) => {
  if (!m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    return reply("Reply foto dengan caption:\n.fakedev Nama Kamu")
  }

  const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage
  const img = quoted.imageMessage
  if (!img) return reply("Reply gambar saja")

  if (!text) return reply("Masukkan nama\nContoh: .fakedev Kyzo")

  await Morela.sendMessage(m.chat, {
    react: { text: "⏳", key: m.key }
  })

  const stream = await downloadContentFromMessage(img, "image")
  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

  const tmp = "./tmp_fakedev.jpg"
  fs.writeFileSync(tmp, buffer)

  try {
    const url = await uploadCatbox(tmp)
    if (!url) {
      fs.unlinkSync(tmp)
      return reply("❌ Gagal upload gambar")
    }

    const api =
      "https://kayzzidgf.my.id/api/maker/fakedev2" +
      "?url=" + encodeURIComponent(url) +
      "&text=" + encodeURIComponent(text)

    const res = await fetch(api)
    const result = await res.buffer()

    await Morela.sendMessage(
      m.chat,
      { image: result },
      { quoted: m }
    )

    await Morela.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })
  } catch (e) {
    console.error("FAKEDEV ERROR:", e)
    reply("❌ Terjadi kesalahan")
  } finally {
    try { fs.unlinkSync(tmp) } catch {}
  }
}

handler.command = ["fakedev"]
handler.tags = ["maker"]
handler.help = ["fakedev <nama>"]

export default handler