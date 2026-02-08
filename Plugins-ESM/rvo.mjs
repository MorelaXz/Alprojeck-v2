import { downloadContentFromMessage } from "@itsukichan/baileys"

const handler = async (m, { Morela, reply }) => {
  const ctxInfo =
    m.message?.extendedTextMessage?.contextInfo ||
    m.message?.imageMessage?.contextInfo ||
    m.message?.videoMessage?.contextInfo ||
    m.message?.documentMessage?.contextInfo ||
    {}

  const quoted = ctxInfo.quotedMessage
  if (!quoted)
    return reply(
      "❗ Reply pesan *view-once* (foto / video / audio / dokumen)."
    )

  await Morela.sendMessage(m.chat, {
    react: { text: "🔓", key: m.key }
  })

  try {
    const msg =
      quoted.viewOnceMessageV2?.message ||
      quoted.viewOnceMessageV2Extension?.message ||
      quoted.ephemeralMessage?.message ||
      quoted

    const media =
      msg.imageMessage ||
      msg.videoMessage ||
      msg.audioMessage ||
      msg.documentMessage

    if (!media)
      return reply(
        "❌ Media tidak ditemukan.\nPastikan reply langsung ke pesan view-once."
      )

    const mime = media.mimetype || ""
    let type = "document"

    if (mime.startsWith("image/")) type = "image"
    else if (mime.startsWith("video/")) type = "video"
    else if (mime.startsWith("audio/")) type = "audio"

    const stream = await downloadContentFromMessage(media, type)
    let buffer = Buffer.from([])

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    await Morela.sendMessage(
      m.chat,
      {
        [type]: buffer,
        mimetype: mime,
        caption: media.caption || "🔓 View-once berhasil dibuka"
      },
      { quoted: m }
    )

    await Morela.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })
  } catch (e) {
    console.error("[RVO]", e)
    return reply("❌ Gagal membuka view-once.")
  }
}

handler.command = ["readviewonce", "rvo"]
handler.tags = ["tools"]
handler.help = ["rvo"]

export default handler