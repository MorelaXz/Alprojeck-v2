import pluginManager from './_pluginmanager.mjs'

const handler = async (m, { reply }) => {
    const raw = m.text || ''
    const lines = raw.split('\n')

    if (lines.length < 2) {
        return reply('❌ Format:\n.addplugin nama\nkode plugin')
    }

    const name = lines[0].split(' ')[1]
    if (!name) return reply('❌ Nama plugin kosong')

    const code = lines.slice(1).join('\n')

    try {
        const res = await pluginManager.addPlugin(name, code)
        reply(res)
    } catch (e) {
        reply(`❌ ${e.message}`)
    }
}

handler.command = ['addplugin']
handler.owner = true

export default handler