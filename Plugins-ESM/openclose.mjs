export default {
    command: ['open', 'close', 'kick'],
    group: true,
    tags: ['group'],
    help: ['open', 'close', 'kick @user'],

    handler: async (m, { Morela, command, reply }) => {
        const from = m.chat

        
        if (!from || !from.endsWith('@g.us')) {
            return reply('❌ Command ini hanya untuk grup.')
        }

        
        let meta
        try {
            meta = await Morela.groupMetadata(from)
        } catch (e) {
            return reply('❌ Gagal mengambil data grup.')
        }

        
        const senderRaw = m.key.participant || m.key.remoteJid
        const senderIsLid = senderRaw.endsWith('@lid')

        let senderParticipant = null

        
        if (senderIsLid) {
            const senderLid = senderRaw.split('@')[0]
            senderParticipant = meta.participants.find(function (p) {
                if (p.lid) {
                    return p.lid.split('@')[0] === senderLid
                }
                return false
            })
        }

        
        if (!senderParticipant) {
            const senderNum = senderRaw.split('@')[0].split(':')[0]
            senderParticipant = meta.participants.find(function (p) {
                const pNum = p.id.split('@')[0].split(':')[0]
                return pNum === senderNum
            })
        }

        
        if (!senderParticipant || !senderParticipant.admin) {
            return reply('❌ Khusus admin.')
        }

        
        if (command === 'close') {
            try {
                await Morela.groupSettingUpdate(from, 'announcement')
                return reply('🔒 Grup ditutup.')
            } catch (e) {
                return reply('❌ Bot bukan admin atau gagal menutup grup.')
            }
        }

        
        if (command === 'open') {
            try {
                await Morela.groupSettingUpdate(from, 'not_announcement')
                return reply('🔓 Grup dibuka.')
            } catch (e) {
                return reply('❌ Bot bukan admin atau gagal membuka grup.')
            }
        }

        
        if (command === 'kick') {
            
            const ctxInfo =
                (m.message?.extendedTextMessage?.contextInfo) ||
                (m.message?.imageMessage?.contextInfo) ||
                (m.message?.videoMessage?.contextInfo) ||
                {}

            const targetRaw =
                (ctxInfo.mentionedJid && ctxInfo.mentionedJid[0]) ||
                ctxInfo.participant ||
                m.quoted?.sender

            if (!targetRaw) {
                return reply('❌ Reply atau mention target.')
            }

            
            const targetIsLid = targetRaw.endsWith('@lid')
            let targetParticipant = null

            if (targetIsLid) {
                const targetLid = targetRaw.split('@')[0]
                targetParticipant = meta.participants.find(function (p) {
                    if (p.lid) {
                        return p.lid.split('@')[0] === targetLid
                    }
                    return false
                })
            }

            if (!targetParticipant) {
                const targetNum = targetRaw.split('@')[0].split(':')[0]
                targetParticipant = meta.participants.find(function (p) {
                    const pNum = p.id.split('@')[0].split(':')[0]
                    return pNum === targetNum
                })
            }

            if (!targetParticipant) {
                return reply('❌ Target tidak ditemukan di grup.')
            }

            
            if (targetParticipant.admin) {
                return reply('❌ Tidak bisa kick admin.')
            }

            
            const targetJid = targetParticipant.id

            try {
                await Morela.groupParticipantsUpdate(from, [targetJid], 'remove')
                return reply(`👢 @${targetJid.split('@')[0]} dikeluarkan.`, {
                    mentions: [targetJid]
                })
            } catch (e) {
                console.error('[KICK ERROR]:', e.message)
                return reply('❌ Bot bukan admin atau gagal kick.')
            }
        }
    }
}