const LOCKED_GROUPS = [
    "120363417523624813@g.us",
    "120363384241749331@g.us",
    "120363424220252137@g.us", 
    "120363404721991819@g.us"
]

const LINK_REGEX =
    /(https?:\/\/[^\s]+|www\.[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/\d+|instagram\.com\/[^\s]+|t\.me\/[^\s]+|discord\.(gg|com)\/[^\s]+)/i


const metadataCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 

const getGroupMetadata = async (Morela, groupId) => {
    const now = Date.now()
    const cached = metadataCache.get(groupId)
    
    
    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data
    }
    
    
    try {
        const meta = await Morela.groupMetadata(groupId)
        metadataCache.set(groupId, {
            data: meta,
            timestamp: now
        })
        console.log(`[ANTILINK] Metadata cached for ${groupId}`)
        return meta
    } catch (error) {
        
        if (cached) {
            console.log(`[ANTILINK] Using stale cache for ${groupId} due to error`)
            return cached.data
        }
        throw error
    }
}

const extractText = m => {
    return (
        m.text ||
        m.msg?.caption ||
        m.msg?.text ||
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        ''
    )
}

export default {
    tags: ['group', 'antilink'],
    handler: async (m, { Morela }) => {
        if (!m.message) return
        if (!m.isGroup) return
        if (m.fromMe) return

        const from = m.chat

        
        if (!LOCKED_GROUPS.includes(from)) return

        const text = extractText(m)

        
        if (text.startsWith('.')) return

        
        let meta
        try {
            meta = await getGroupMetadata(Morela, from) 
        } catch (e) {
            console.error('[ANTILINK] Error get metadata:', e.message)
            return
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

        
        if (senderParticipant && senderParticipant.admin) {
            
            return
        }

        
        if (!LINK_REGEX.test(text)) return

        try {
            await Morela.sendMessage(from, {
                delete: {
                    remoteJid: from,
                    fromMe: false,
                    id: m.key.id,
                    participant: senderRaw
                }
            })

            console.log(
                `[ANTILINK] ✅ Deleted link from ${senderRaw.split('@')[0]} in ${from.slice(0, 15)}...`
            )
        } catch (e) {
            console.error('[ANTILINK] ❌ Delete failed:', e.message)
        }
    }
}