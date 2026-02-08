import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PLUGINS_DIR = __dirname

class PluginManager {
    constructor() {
        this.plugins = new Map()
        this.passiveHandlers = [] 
        this.loadAllPlugins()
        this.watchPlugins()
    }

    loadAllPlugins() {
        const files = fs.readdirSync(PLUGINS_DIR).filter(f =>
            f.endsWith('.mjs') && f !== '_pluginmanager.mjs'
        )
        for (const f of files) this.loadPlugin(f)
    }

    async loadPlugin(filename) {
        try {
            const filepath = path.join(PLUGINS_DIR, filename)
            const url = pathToFileURL(filepath).href + `?v=${Date.now()}`
            const { default: mod } = await import(url)

            let plugin

            if (typeof mod === 'function') {
                plugin = {
                    handler: mod,
                    command: mod.command || [],
                    owner: mod.owner,
                    premium: mod.premium,
                    group: mod.group,
                    private: mod.private,
                    admin: mod.admin,
                    botAdmin: mod.botAdmin,
                    help: mod.help || [],
                    tags: mod.tags || []
                }
            } else {
                plugin = mod
            }

            if (!plugin || !plugin.handler) return

            
            if (!plugin.command || plugin.command.length === 0) {
                this.passiveHandlers.push({
                    file: filename,
                    plugin,
                    tags: plugin.tags || []
                })
                console.log(`✓ Passive handler loaded: ${filename}`)
                return
            }

            const cmds = Array.isArray(plugin.command)
                ? plugin.command
                : [plugin.command]

            for (const c of cmds) {
                this.plugins.set(c.toLowerCase(), {
                    file: filename,
                    plugin,
                    command: cmds,
                    help: plugin.help || [],
                    tags: plugin.tags || []
                })
            }

            console.log(`✓ Plugin loaded: ${filename}`)
        } catch (e) {
            console.error(`✗ Plugin error ${filename}:`, e.message)
        }
    }

    getPlugin(cmd) {
        return this.plugins.get(cmd.toLowerCase())
    }

    
    getPassiveHandlers() {
        return this.passiveHandlers
    }

    async reloadPlugin(filename) {
        
        for (const [k, v] of this.plugins.entries()) {
            if (v.file === filename) this.plugins.delete(k)
        }
        
        
        this.passiveHandlers = this.passiveHandlers.filter(
            h => h.file !== filename
        )
        
        await this.loadPlugin(filename)
    }

    async addPlugin(filename, code) {
        if (!filename.endsWith('.mjs')) filename += '.mjs'
        const filepath = path.join(PLUGINS_DIR, filename)
        fs.writeFileSync(filepath, code)
        await this.reloadPlugin(filename)
        return `✅ Plugin ${filename} ditambahkan`
    }

    deletePlugin(filename) {
        if (!filename.endsWith('.mjs')) filename += '.mjs'
        const filepath = path.join(PLUGINS_DIR, filename)
        if (!fs.existsSync(filepath)) throw new Error('Plugin tidak ditemukan')

        for (const [k, v] of this.plugins.entries()) {
            if (v.file === filename) this.plugins.delete(k)
        }
        
        this.passiveHandlers = this.passiveHandlers.filter(
            h => h.file !== filename
        )

        fs.unlinkSync(filepath)
        return `✅ Plugin ${filename} dihapus`
    }

    listPlugins() {
        const map = new Map()
        
        
        for (const v of this.plugins.values()) {
            if (!map.has(v.file)) {
                map.set(v.file, {
                    file: v.file,
                    commands: v.command,
                    help: v.help,
                    tags: v.tags,
                    type: 'command'
                })
            }
        }
        
        
        for (const h of this.passiveHandlers) {
            if (!map.has(h.file)) {
                map.set(h.file, {
                    file: h.file,
                    commands: [],
                    help: [],
                    tags: h.tags,
                    type: 'passive'
                })
            }
        }
        
        return [...map.values()]
    }

    getPluginCode(filename) {
        if (!filename.endsWith('.mjs')) filename += '.mjs'
        const filepath = path.join(PLUGINS_DIR, filename)
        if (!fs.existsSync(filepath)) throw new Error('Plugin tidak ditemukan')
        return fs.readFileSync(filepath, 'utf-8')
    }

    watchPlugins() {
        fs.watch(PLUGINS_DIR, (_, file) => {
            if (!file || !file.endsWith('.mjs')) return
            if (file === '_pluginmanager.mjs') return
            if (fs.existsSync(path.join(PLUGINS_DIR, file))) {
                this.reloadPlugin(file)
            }
        })
    }
}

const pluginManager = new PluginManager()
export default pluginManager


export async function handlePluginCommand(
    m,
    command,
    { Morela, text, args, reply, isOwn, isPrem, isAdmin, botAdmin, downloadContentFromMessage }
) {
    const data = pluginManager.getPlugin(command)
    if (!data) return false

    const h = data.plugin

    
    if (h.owner && !isOwn) return reply('❌ Owner only')
    if (h.premium && !isPrem) return reply('❌ Premium only')
    if (h.group && !m.isGroup) return reply('❌ Group only')
    if (h.private && m.isGroup) return reply('❌ Private only')
    
    
    

    try {
        await h.handler(m, { 
            Morela, 
            text, 
            args, 
            reply, 
            command,
            downloadContentFromMessage
        })
        return true
    } catch (e) {
        reply(`❌ ${e.message}`)
        console.error(`[Plugin Error] ${command}:`, e)
        return true
    }
}


export async function runPassiveHandlers(
    m,
    { Morela, isOwn, isPrem, isAdmin, botAdmin, downloadContentFromMessage }
) {
    const handlers = pluginManager.getPassiveHandlers()
    
    for (const { plugin, file } of handlers) {
        try {
            
            await plugin.handler(m, {
                Morela,
                isOwn,
                isPrem,
                isAdmin,
                botAdmin,
                downloadContentFromMessage
            })
        } catch (error) {
            console.error(`[Passive Handler Error] ${file}:`, error.message)
        }
    }
}
