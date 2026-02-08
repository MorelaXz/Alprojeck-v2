const handler = async (m, { Morela, reply }) => {
  const jid = m.chat

  if (!jid.endsWith("@g.us"))
    return reply("Perintah ini hanya bisa digunakan di grup")

  const metadata = await Morela.groupMetadata(jid)
  const participants = metadata.participants.map(p => p.id)

  const sender = m.key.participant || m.chat
  const senderTag = "@" + sender.split("@")[0]

  let content = ""

  const quoted =
    m.message?.extendedTextMessage?.contextInfo?.quotedMessage

  if (quoted && !m.text) {
    content =
      quoted.conversation ||
      quoted.extendedTextMessage?.text ||
      ""
  } else {
    content = m.text
      ?.replace(/^(\.hidetag|\!hidetag|\/hidetag|\.h|\!h|\/h)\s*/i, "")
      .trim()
  }

  const message = `${senderTag} : ${content || "‎"}`

  await Morela.sendMessage(
    jid,
    {
      text: message,
      mentions: [sender, ...participants]
    },
    { quoted: m }
  )
}

handler.command = ["hidetag", "h"]
handler.tags = ["group"]
handler.help = ["hidetag <teks>"]

export default handler