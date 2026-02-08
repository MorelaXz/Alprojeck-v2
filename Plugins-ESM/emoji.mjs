import axios from "axios";

const emojiToCodePoint = e =>
  [...e].map(c => c.codePointAt(0).toString(16)).join("-");

const handler = async (m, { Morela, args, reply }) => {
  const emoji = args.join("").trim();
  
  if (!emoji) {
    return reply("❌ Masukkan emoji!\n\nContoh: .emoji 😀");
  }

  const code = emojiToCodePoint(emoji);
  const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp`;

  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer"
    });

    await Morela.sendMessage(
      m.chat,
      { sticker: res.data },
      { quoted: m }
    );
  } catch (e) {
    console.log("Gagal ambil emoji:", url);
    reply("❌ Emoji tidak ditemukan atau gagal diambil.");
  }
};

handler.help = ["emoji <emoji>"];
handler.tags = ["sticker"];
handler.command = ["emoji", "emojisticker"];

export default handler;