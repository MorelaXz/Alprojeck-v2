const handler = async (m, { Morela, text, args, reply }) => {
    const url = args[0];
    if (!url) return reply("❌ Masukkan URL!\n\nContoh:\n.alldownload https://tiktok.com/...");

    const from = m.chat;

    await Morela.sendMessage(from, {
        react: { text: "⏳", key: m.key }
    });

    try {
        let videoUrl = null;
        let audioUrl = null;
        let imageUrl = null;
        let title = "Media";
        let platform = detectPlatform(url);

        console.log(`[ALLDL] Platform terdeteksi: ${platform}`);

        
        if (platform === "gdrive") {
            const fileId = extractGDriveId(url);
            if (!fileId) {
                throw new Error("ID Google Drive tidak valid");
            }

            console.log("[ALLDL] Google Drive ID:", fileId);
            videoUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
            title = "Google Drive Video";
            console.log("[ALLDL] ✅ Google Drive URL siap");
        }

        
        if (!videoUrl && platform === "tiktok") {
            try {
                console.log("[ALLDL] Mencoba API TikWM...");
                const axios = (await import('axios')).default;
                const res = await axios.post(
                    "https://www.tikwm.com/api/",
                    new URLSearchParams({ url: url }),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'Mozilla/5.0'
                        },
                        timeout: 30000
                    }
                );

                if (res.data?.code === 0 && res.data?.data?.play) {
                    videoUrl = res.data.data.play;
                    title = res.data.data.title || title;
                    console.log("[ALLDL] ✅ TikWM berhasil");
                }
            } catch (e) {
                console.log("[ALLDL] ❌ TikWM gagal:", e.message);
            }
        }

        
        if (!videoUrl && !imageUrl && platform === "instagram") {
            try {
                console.log("[ALLDL] Mencoba API Instagram...");
                const axios = (await import('axios')).default;
                const res = await axios.get(
                    `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
                    { timeout: 30000 }
                );

                if (res.data?.video?.length > 0) {
                    videoUrl = res.data.video[0];
                    title = res.data.title || title;
                    console.log("[ALLDL] ✅ Instagram video berhasil");
                } else if (res.data?.image?.length > 0) {
                    imageUrl = res.data.image[0];
                    title = res.data.title || title;
                    console.log("[ALLDL] ✅ Instagram gambar berhasil");
                }
            } catch (e) {
                console.log("[ALLDL] ❌ Instagram API gagal:", e.message);
            }
        }

        
        if (!videoUrl && platform === "youtube") {
            try {
                console.log("[ALLDL] Mencoba API YouTube...");
                const axios = (await import('axios')).default;
                const res = await axios.get(
                    `https://api.agatz.xyz/api/ytmp4?url=${encodeURIComponent(url)}`,
                    { timeout: 30000 }
                );

                if (res.data?.data?.dl_link) {
                    videoUrl = res.data.data.dl_link;
                    title = res.data.data.title || title;
                    console.log("[ALLDL] ✅ YouTube API berhasil");
                }
            } catch (e) {
                console.log("[ALLDL] ❌ YouTube API gagal:", e.message);
            }
        }

        
        if (!videoUrl && platform === "mediafire") {
            try {
                console.log("[ALLDL] Mencoba API Mediafire...");
                const axios = (await import('axios')).default;
                const res = await axios.get(
                    `https://api.agatz.xyz/api/mediafire?url=${encodeURIComponent(url)}`,
                    { timeout: 30000 }
                );

                if (res.data?.data?.link) {
                    videoUrl = res.data.data.link;
                    title = res.data.data.filename || title;
                    console.log("[ALLDL] ✅ Mediafire berhasil");
                }
            } catch (e) {
                console.log("[ALLDL] ❌ Mediafire gagal:", e.message);
            }
        }

        
        if (!videoUrl && platform === "terabox") {
            try {
                console.log("[ALLDL] Mencoba API Terabox...");
                const axios = (await import('axios')).default;
                const res = await axios.get(
                    `https://api.agatz.xyz/api/terabox?url=${encodeURIComponent(url)}`,
                    { timeout: 30000 }
                );

                if (res.data?.data?.download_link) {
                    videoUrl = res.data.data.download_link;
                    title = res.data.data.filename || title;
                    console.log("[ALLDL] ✅ Terabox berhasil");
                }
            } catch (e) {
                console.log("[ALLDL] ❌ Terabox gagal:", e.message);
            }
        }

        
        if (!videoUrl && !audioUrl && !imageUrl && platform !== "gdrive") {
            try {
                console.log("[ALLDL] Mencoba API Universal...");
                const axios = (await import('axios')).default;
                const res = await axios.get(
                    "https://api.deline.web.id/downloader/aio",
                    { 
                        params: { url },
                        timeout: 30000 
                    }
                );

                const result = res.data?.result;

                if (result?.links) {
                    if (result.links.video?.length > 0) {
                        videoUrl = result.links.video[0].url;
                        title = result.title || title;
                        console.log("[ALLDL] ✅ Video ditemukan dari API Universal");
                    } else if (result.links.audio?.length > 0) {
                        audioUrl = result.links.audio[0].url;
                        title = result.title || title;
                        console.log("[ALLDL] ✅ Audio ditemukan dari API Universal");
                    } else if (result.links.image?.length > 0) {
                        imageUrl = result.links.image[0].url;
                        title = result.title || title;
                        console.log("[ALLDL] ✅ Gambar ditemukan dari API Universal");
                    }
                }
            } catch (e) {
                console.log("[ALLDL] ❌ API Universal gagal:", e.message);
            }
        }

        
        if (!videoUrl && !audioUrl && !imageUrl) {
            throw new Error(`Gagal mengambil media dari ${platform}. Link mungkin tidak valid, privat, atau memerlukan login.`);
        }

        const mediaUrl = videoUrl || audioUrl || imageUrl;
        console.log("[ALLDL] Download dari:", mediaUrl);

        
        const axios = (await import('axios')).default;
        let mediaResponse;
        let retries = 3;
        
        while (retries > 0) {
            try {
                mediaResponse = await axios.get(mediaUrl, {
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': getReferer(platform),
                        'Accept': '*/*',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive'
                    },
                    timeout: 180000,
                    maxRedirects: 10,
                    maxContentLength: 100 * 1024 * 1024,
                    maxBodyLength: 100 * 1024 * 1024,
                    validateStatus: (status) => status < 500
                });
                break;
            } catch (err) {
                retries--;
                if (retries === 0) throw err;
                console.log(`[ALLDL] Retry... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        const fileSize = (mediaResponse.data.length / (1024 * 1024)).toFixed(2);
        console.log(`[ALLDL] File size: ${fileSize}MB`);

        
        if (videoUrl) {
            await Morela.sendMessage(from, {
                video: Buffer.from(mediaResponse.data),
                caption: `🎬 ${title}\n📱 Platform: ${platform.toUpperCase()}\n📦 Size: ${fileSize}MB`,
                mimetype: 'video/mp4'
            }, { quoted: m });
        } else if (imageUrl) {
            await Morela.sendMessage(from, {
                image: Buffer.from(mediaResponse.data),
                caption: `🖼️ ${title}\n📱 Platform: ${platform.toUpperCase()}\n📦 Size: ${fileSize}MB`
            }, { quoted: m });
        } else if (audioUrl) {
            await Morela.sendMessage(from, {
                audio: Buffer.from(mediaResponse.data),
                mimetype: 'audio/mp4',
                fileName: `${title}.mp3`
            }, { quoted: m });
        }

        await Morela.sendMessage(from, {
            react: { text: "✅", key: m.key }
        });

    } catch (err) {
        console.error("[ALLDL] Error:", err.message);
        console.error("[ALLDL] Error stack:", err.stack);
        
        let errorMsg = "❌ Gagal mengambil media.\n\n";
        
        if (err.message.includes("Gagal mengambil media")) {
            errorMsg += err.message;
        } else if (err.response?.status === 403) {
            errorMsg += "Akses ditolak. Video mungkin privat atau memerlukan login.";
        } else if (err.response?.status === 404) {
            errorMsg += "File tidak ditemukan atau sudah dihapus.";
        } else if (err.message.includes("timeout")) {
            errorMsg += "Timeout. File terlalu besar atau koneksi lambat.";
        } else if (err.message.includes("ID Google Drive tidak valid")) {
            errorMsg += "Link Google Drive tidak valid.\n\nFormat yang benar:\n• https://drive.google.com/file/d/FILE_ID/view\n• https://drive.google.com/open?id=FILE_ID";
        } else if (err.code === 'ERR_FR_MAX_BODY_LENGTH_EXCEEDED') {
            errorMsg += "File terlalu besar (maks 100MB).";
        } else {
            errorMsg += `Terjadi kesalahan: ${err.message}\n\nCoba lagi atau gunakan link lain.`;
        }
        
        await reply(errorMsg);
        await Morela.sendMessage(from, {
            react: { text: "❌", key: m.key }
        });
    }
};

function detectPlatform(url) {
    if (url.includes('tiktok.com') || url.includes('vt.tiktok') || url.includes('vm.tiktok')) {
        return 'tiktok';
    } else if (url.includes('instagram.com') || url.includes('instagr.am')) {
        return 'instagram';
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'youtube';
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
        return 'facebook';
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
        return 'twitter';
    } else if (url.includes('pinterest.com') || url.includes('pin.it')) {
        return 'pinterest';
    } else if (url.includes('drive.google.com')) {
        return 'gdrive';
    } else if (url.includes('mediafire.com')) {
        return 'mediafire';
    } else if (url.includes('terabox.com') || url.includes('1024tera.com')) {
        return 'terabox';
    } else if (url.includes('streamable.com')) {
        return 'streamable';
    } else if (url.includes('vimeo.com')) {
        return 'vimeo';
    } else {
        return 'unknown';
    }
}

function extractGDriveId(url) {
    let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    
    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    
    match = url.match(/uc\?id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    
    return null;
}

function getReferer(platform) {
    const referers = {
        'tiktok': 'https://www.tiktok.com/',
        'instagram': 'https://www.instagram.com/',
        'youtube': 'https://www.youtube.com/',
        'facebook': 'https://www.facebook.com/',
        'twitter': 'https://twitter.com/',
        'gdrive': 'https://drive.google.com/',
        'mediafire': 'https://www.mediafire.com/',
        'terabox': 'https://www.terabox.com/'
    };
    return referers[platform] || 'https://www.google.com/';
}

handler.help = ['alldownload', 'dl'];
handler.tags = ['downloader'];
handler.command = ['alldownload', 'dl'];

export default handler;