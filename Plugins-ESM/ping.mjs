const handler = async (m, { reply }) => {
    reply('pong')
}

handler.command = ['ping']
export default handler