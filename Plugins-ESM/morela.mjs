import { isSelfMode } from '../System/selfmode.js'

export default {
    command: ['morela'],
    owner: true,
    help: ['morela on/off'],
    tags: ['owner'],
    
    handler: async (m, { args, reply }) => {
        const mode = args[0]?.toLowerCase()

        if (mode === 'on') {
            globalThis.__SELF_MODE__ = true
            return reply(
                '🔒 *SELF MODE AKTIF*\n\n' +
                '✅ Bot hanya akan merespon di grup yang diizinkan\n' +
                '✅ Antilink & Antitag tetap berfungsi di semua grup yang terdaftar\n' +
                '✅ Owner tetap bisa akses di semua grup & PC\n\n' +
                `Status: ${isSelfMode() ? 'ON 🟢' : 'OFF 🔴'}`
            )
        }

        if (mode === 'off') {
            globalThis.__SELF_MODE__ = false
            return reply(
                '🔓 *SELF MODE NONAKTIF*\n\n' +
                '✅ Bot akan merespon di semua grup & PC\n\n' +
                `Status: ${isSelfMode() ? 'ON 🟢' : 'OFF 🔴'}`
            )
        }

        return reply(
            `⚙️ *SELF MODE SETTINGS*\n\n` +
            `Current Status: ${isSelfMode() ? '🟢 ON' : '🔴 OFF'}\n\n` +
            `*Gunakan:*\n` +
            `• .morela on  - Aktifkan self mode\n` +
            `• .morela off - Nonaktifkan self mode`
        )
    }
}