import yts from "yt-search"
import { canvas } from "../Library/canvas-yts.js"

const waQuoted = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "0@s.whatsapp.net"
  },
  message: { conversation: "" }
}

const handler = async (m, { Morela, args, reply, text }) => {
  if (!text) {
    return reply("📝 Contoh: .yts lady gaga")
  }

  try {
    
    await Morela.sendMessage(m.chat, {
      react: { text: "⏳", key: m.key }
    })

    const query = text
    const res = await yts(query)
    const rawVideos = res.all.filter(v => v.type === "video")

    if (!rawVideos.length) {
      await Morela.sendMessage(m.chat, {
        react: { text: "❌", key: m.key }
      })
      return reply("❌ Tidak ditemukan hasil")
    }

    const videos = rawVideos.slice(0, 10).map(v => ({
      title: v.title,
      channel: v.author?.name || "Unknown",
      duration: v.timestamp || "0:00",
      url: v.url,
      videoId: v.videoId
    }))

    
    const imageBuffer = await canvas(videos, query)

    
    const rows = videos.flatMap(v => [
      {
        header: v.channel,
        title: `📹 Video: ${v.title.length > 40 ? v.title.slice(0, 37) + "..." : v.title}`,
        description: `⏱️ ${v.duration}`,
        id: `.ytmp4 ${v.url}`
      },
      {
        header: v.channel,
        title: `🎧 Audio: ${v.title.length > 40 ? v.title.slice(0, 37) + "..." : v.title}`,
        description: `⏱️ ${v.duration}`,
        id: `.ytmp3 ${v.url}`
      }
    ])

    
    await Morela.sendMessage(
      m.chat,
      {
        image: imageBuffer,
        caption: `🎬 *Hasil pencarian YouTube*\n\nQuery: *${query}*\n\n_Pilih video atau audio dari menu di bawah_`,
        footer: "Powered by Morela",
        interactiveButtons: [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "📥 Pilih Video / Audio",
              sections: [
                {
                  title: "Hasil Pencarian",
                  highlight_label: "Popular",
                  rows: rows
                }
              ]
            })
          }
        ],
        hasMediaAttachment: true
      },
      { quoted: waQuoted }
    )

    
    await Morela.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })

  } catch (err) {
    console.error("[YTS ERROR]", err)
    await Morela.sendMessage(m.chat, {
      react: { text: "❌", key: m.key }
    })
    reply(`❌ Error: ${err.message}`)
  }
}

handler.help = ['yts', 'ytsearch']
handler.tags = ['downloader']
handler.command = ['yts', 'ytsearch']

export default handler