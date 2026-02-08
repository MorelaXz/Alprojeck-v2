if (globalThis.__SELF_MODE__ === undefined) {
    globalThis.__SELF_MODE__ = false
}

const ALLOWED_GROUPS = new Set([
    '120363417523624813@g.us',
    '120363384241749331@g.us',
    '120363424220252137@g.us',
    '120363404721991819@g.us',
    '120363406072079443@g.us',
    '120363406816193092@g.us',
    '120363403855784549@g.us'
])

export const isSelfMode = () => globalThis.__SELF_MODE__

export const isAllowedWhenSelf = m => {
    if (m.fromMe) return true
    if (m.isGroup) return ALLOWED_GROUPS.has(m.chat)
    return false
}