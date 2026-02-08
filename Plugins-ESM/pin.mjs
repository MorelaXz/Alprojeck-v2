import axios from "axios"
import {
  generateWAMessageContent,
  generateWAMessageFromContent,
  proto
} from "@itsukichan/baileys"

const handler = async (m, { Morela, reply }) => {
  let text = m.text?.trim()
  if (!text) return reply("Contoh: *.pin kucing 5*")

  await Morela.sendMessage(m.chat, {
    react: { text: "⏳", key: m.key }
  })

  let args = text.split(/\s+/)
  let jumlah = 6
  const lastArg = args[args.length - 1]

  if (!isNaN(lastArg)) {
    jumlah = Math.min(Math.max(parseInt(lastArg), 1), 50)
    args = args.slice(0, -1)
    text = args.join(" ")
  }

  async function createImage(url) {
    const { imageMessage } = await generateWAMessageContent(
      { image: { url } },
      { upload: Morela.waUploadToServer }
    )
    return imageMessage
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
  }

  let results
  try {
    const { data } = await axios.get(
      "https://api.siputzx.my.id/api/s/pinterest?query=" +
        encodeURIComponent(text)
    )

    if (!data.status || !data.data?.length)
      return reply("❌ Gambar tidak ditemukan")

    results = data.data.map(v => ({
      img: v.image_url,
      source: v.pin
    }))
  } catch {
    return reply("❌ Gagal mengambil data Pinterest")
  }

  shuffle(results)
  const selected = results.slice(0, jumlah)

  const cards = []
  let i = 1

  for (const item of selected) {
    cards.push({
      body: proto.Message.InteractiveMessage.Body.fromObject({
        text: `Gambar ke-${i++}`
      }),
      footer: proto.Message.InteractiveMessage.Footer.fromObject({
        text: "PINTEREST"
      }),
      header: proto.Message.InteractiveMessage.Header.fromObject({
        title: "PINTEREST",
        hasMediaAttachment: true,
        imageMessage: await createImage(item.img)
      }),
      nativeFlowMessage:
        proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          buttons: [
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "Lihat di Pinterest",
                url: item.source,
                merchant_url: item.source
              })
            }
          ]
        })
    })
  }

  const msg = generateWAMessageFromContent(
    m.chat,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage:
            proto.Message.InteractiveMessage.fromObject({
              body: proto.Message.InteractiveMessage.Body.create({}),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "PINTEREST"
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                hasMediaAttachment: false
              }),
              carouselMessage:
                proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                  cards
                })
            })
        }
      }
    },
    { quoted: m }
  )

  await Morela.relayMessage(
    m.chat,
    msg.message,
    { messageId: msg.key.id }
  )

  await Morela.sendMessage(m.chat, {
    react: { text: "✅", key: m.key }
  })
}

handler.command = ["pinterest", "pin"]
handler.tags = ["search"]
handler.help = ["pinterest <query> <jumlah>"]

export default handler