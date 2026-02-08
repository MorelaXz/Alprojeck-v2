import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.join(__dirname, '..')
const PKG_PATH = path.join(ROOT_DIR, 'package.json')

export default {
    command: ['addpkg', 'addpackage', 'npmadd'],
    tags: ['system'],
    help: ['addpkg <name[@version]>'],

    handler: async (m, { args, reply }) => {
        if (!args[0]) {
            return reply('❌ Contoh:\n.addpkg archiver@5.3.1')
        }

        const pkgInput = args[0]
        const pkgName = pkgInput.split('@')[0]
        const pkgVersion = pkgInput.includes('@')
            ? pkgInput.split('@')[1]
            : 'latest'

        if (!fs.existsSync(PKG_PATH)) {
            return reply('❌ package.json tidak ditemukan')
        }

        let pkg
        try {
            pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'))
        } catch {
            return reply('❌ package.json rusak')
        }

        pkg.dependencies ||= {}

        pkg.dependencies[pkgName] = pkgVersion

        fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2))

        reply(`📦 Install *${pkgName}@${pkgVersion}*\n⏳ Mohon tunggu...`)

        exec(`npm install ${pkgName}@${pkgVersion}`, { cwd: ROOT_DIR }, (err, stdout, stderr) => {
            if (err) {
                return reply(`❌ npm install gagal:\n${stderr || err.message}`)
            }

            reply(`✅ *${pkgName}@${pkgVersion}* berhasil di-install`)
        })
    }
}