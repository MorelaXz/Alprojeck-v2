const handler = async (m, { reply, text }) => {
    reply(`✅ Test plugin bekerja!\n\nText: ${text || 'kosong'}`);
};

handler.help = ['test'];
handler.tags = ['info'];
handler.command = ['test', 'tes'];

export default handler;