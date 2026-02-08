import pluginManager, { handlePluginCommand } from '../Plugins-ESM/_pluginmanager.mjs';

export default async function handleMessage(m, command, handleData) {
    
    const { 
        Morela, 
        text, 
        args, 
        isOwn, 
        isPrem, 
        reply,
        downloadContentFromMessage,  
        botAdmin,
        isAdmin
    } = handleData;

    try {
        const result = await handlePluginCommand(m, command, {
            Morela,
            text,
            args,
            isOwn,
            isPrem,
            reply,
            command,
            downloadContentFromMessage,  
            botAdmin,
            isAdmin
        });

        if (!result) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Handle ESM error:', error);
        return false;
    }
}

export { pluginManager };
