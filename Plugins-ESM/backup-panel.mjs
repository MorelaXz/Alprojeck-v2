import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


const ROOT_DIR = path.join(__dirname, '..')


const ZIP_PATH = path.join(
  ROOT_DIR,
  `backup-panel-${Date.now()}.zip`
)

export default {
  command: ['backup', 'backupbot'],

  handler: async (m, { Morela, reply }) => {
    try {
      reply('📦 Membuat backup bot...\n⏳ Mohon tunggu')

      const output = fs.createWriteStream(ZIP_PATH)
      const archive = archiver('zip', { zlib: { level: 9 } })

      archive.pipe(output)

      archive.glob('**/*', {
        cwd: ROOT_DIR,
        ignore: [
          '**/node_modules/**',
          '**/.git/**',
          '**/*.zip',
          '**/session/**',
          '**/tmp/**'
        ]
      })

      await archive.finalize()

      await new Promise(resolve => output.on('close', resolve))

      await Morela.sendMessage(
        m.chat,
        {
          document: { url: ZIP_PATH },
          fileName: 'panel-backup.zip',
          mimetype: 'application/zip'
        },
        { quoted: m }
      )

      fs.unlinkSync(ZIP_PATH)

    } catch (err) {
      console.error('[BACKUP ERROR]', err)
      reply('❌ Gagal membuat backup')
    }
  }
}