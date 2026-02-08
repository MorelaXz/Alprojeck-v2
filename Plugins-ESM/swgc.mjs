import * as baileys from "@itsukichan/baileys"
import crypto from "crypto"

async function groupStatus(conn, jid, content, mentions = []) {
  const inside = await baileys.generateWAMessageContent(content, {
    upload: conn.waUploadToServer
  })

  const messageSecret = crypto.randomBytes(32)

  const msg = baileys.generateWAMessageFromContent(
    jid,
    {
      messageContextInfo: {
        messageSecret,
        mentionedJid: mentions
      },
      groupStatusMessageV2: {
        message: {
          ...inside,
          messageContextInfo: {
            messageSecret,
            mentionedJid: mentions
          }
        }
      }
    },
    {}
  )

  await conn.relayMessage(jid, msg.message, {
    messageId: msg.key.id
  })
}

const handler = async (m, { Morela, reply }) => {
  const jid = m.chat

  if (!jid.endsWith("@g.us"))
    return reply("Perintah ini hanya bisa dipakai di grup")

  const metadata = await Morela.groupMetadata(jid)
  const members = metadata.participants.map(p => p.id)

  const msg = m.message
  const ext = msg?.extendedTextMessage
  const quoted = ext?.contextInfo?.quotedMessage

  let payload = {}

  if (quoted?.imageMessage) {
    const buffer = await baileys.downloadMediaMessage(
      { message: quoted },
      "buffer",
      {},
      {
        logger: Morela.logger,
        reuploadRequest: Morela.updateMediaMessage
      }
    )
    payload = { image: buffer }

  } else if (quoted?.videoMessage) {
    const buffer = await baileys.downloadMediaMessage(
      { message: quoted },
      "buffer",
      {},
      {
        logger: Morela.logger,
        reuploadRequest: Morela.updateMediaMessage
      }
    )
    payload = { video: buffer }

  } else if (quoted?.audioMessage) {
    const buffer = await baileys.downloadMediaMessage(
      { message: quoted },
      "buffer",
      {},
      {
        logger: Morela.logger,
        reuploadRequest: Morela.updateMediaMessage
      }
    )
    payload = { audio: buffer, mimetype: "audio/mp4" }

  } else if (
    quoted?.conversation ||
    quoted?.extendedTextMessage?.text
  ) {
    payload = {
      text:
        quoted.conversation ||
        quoted.extendedTextMessage.text
    }

  } else {
    const clean = m.text
      ?.replace(/^(\.swgc|\!swgc|\/swgc)\s*/i, "")
      .trim()

    if (!clean)
      return reply("Reply pesan / media atau isi teks setelah *.swgc*")

    payload = { text: clean }
  }

  await groupStatus(Morela, jid, payload, members)

  await Morela.sendMessage(jid, {
    react: { text: "✅", key: m.key }
  })
}

handler.command = ["swgc"]
handler.tags = ["group"]
handler.help = ["swgc <teks> | reply media"]

export default handler