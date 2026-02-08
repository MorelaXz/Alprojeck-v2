import axios from 'axios'

export default {
    command: ['attp', 'animtext'],
    tags: ['sticker'],
    help: ['attp <text>'],
    handler: async (m, { Morela, args, reply }) => {
        const text = args.join(' ')
        const from = m.chat

        if (!text) {
            return reply(
                '❌ *CARA PENGGUNAAN*\n\n' +
                '.attp <teks>\n\n' +
                '*CONTOH:*\n' +
                '.attp Hello World\n' +
                '.attp AL PROJECT DEV'
            )
        }

        try {
            await Morela.sendMessage(from, {
                react: { text: '⏳', key: m.key }
            })

            const url = `https://api.deline.web.id/maker/attp?text=${encodeURIComponent(text)}`
            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000
            })

            await Morela.sendMessage(
                from,
                { sticker: Buffer.from(res.data) },
                { quoted: m }
            )

            await Morela.sendMessage(from, {
                react: { text: '✅', key: m.key }
            })

        } catch (err) {
            console.error('[ATTP]', err.message)

            await reply(
                '❌ *GAGAL MEMBUAT STICKER ATTP*\n\n' +
                'Silakan coba lagi.'
            )

            await Morela.sendMessage(from, {
                react: { text: '❌', key: m.key }
            })
        }
    }
}