const axios = require("axios");

const MEDIA_CACHE_PATH = "./database/assets/webp/tmp/tmp2/tmp6/media_cache_8573.json";

async function playpriCommand(sock, from, Info, args, prefix, API_KEY_TED) {
    const emojiSuccess = ["💥", "✨", "🌟", "🔥", "💫", "💢", "💦"];
    const randomEmoji = emojiSuccess[Math.floor(Math.random() * emojiSuccess.length)];
    
    try {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: Info });
        
        const query = args.join(" ");
        if (!query) {
            await sock.sendMessage(from, { 
                react: { text: "❌", key: Info.key } 
            });
            return reply(`Uso: ${prefix}play <nome da música>`);
        }
        
        await sock.sendMessage(from, { 
            react: { text: "⏳", key: Info.key } 
        });
        
        // Passo 1: Pesquisar a música para obter a URL do YouTube
        const searchUrl = `https://tedzinho.com.br/api/pesquisa/youtube?apikey=J&query=${encodeURIComponent(query)}`;
        let searchData;
        try {
            const searchResponse = await axios.get(searchUrl);
            searchData = searchResponse.data;
        } catch (e) {
            console.error("Erro na API de pesquisa:", e.message);
            throw new Error("Falha na pesquisa");
        }

        if (!searchData || !searchData.status || !searchData.resultado || searchData.resultado.length === 0) {
            await sock.sendMessage(from, { 
                react: { text: "❌", key: Info.key } 
            });
            return reply("❌ Música não encontrada!");
        }

        const video = searchData.resultado[0];
        const videoUrl = video.url;
        
        // Passo 2: Usar a nova API de download fornecida pelo usuário
        const downloadApiUrl = `https://systemzone.store/api/downloader/ytdl-v3?apikey=Tedsystem&url=${encodeURIComponent(videoUrl)}&type=audio`;
        let downloadData;
        try {
            const downloadResponse = await axios.get(downloadApiUrl);
            downloadData = downloadResponse.data;
        } catch (e) {
            console.error("Erro na API de download:", e.message);
            throw new Error("Falha no download");
        }
        
        if (!downloadData || downloadData.status !== true || !downloadData.result || !downloadData.result.download_url) {
            await sock.sendMessage(from, { 
                react: { text: "❌", key: Info.key } 
            });
            return reply("❌ Erro ao obter link de download!");
        }

        const result = downloadData.result;
        const views = video.views ? new Intl.NumberFormat('pt-BR').format(video.views) : "N/A";
        const authorName = video.author?.name || "N/A";
        
        const caption = `🎧 *TOCANDO AGORA* 🎧
━━━━━━━━━━━━━━━━━━━━
📀 *Título:* ${result.title || video.title}
👤 *Artista:* ${authorName}
⏰ *Duração:* ${video.timestamp || "N/A"}
👁️ *Visualizações:* ${views}
🔗 *YouTube:* ${videoUrl}
━━━━━━━━━━━━━━━━━━━━`;
        
        // Tentar enviar a imagem, se falhar envia apenas o texto
        try {
            if (result.thumbnail || video.thumbnail) {
                await sock.sendMessage(from, {
                    image: { url: result.thumbnail || video.thumbnail },
                    caption
                }, { quoted: Info });
            } else {
                await reply(caption);
            }
        } catch (e) {
            console.error("Erro ao enviar imagem:", e.message);
            await reply(caption);
        }
        
        // Passo 3: Baixar o áudio via axios para evitar erro 522 de conexão direta do Baileys
        try {
            const audioResponse = await axios.get(result.download_url, { responseType: 'arraybuffer' });
            const audioBuffer = Buffer.from(audioResponse.data);

            await sock.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${(result.title || video.title).substring(0, 40)}.mp3`,
                ptt: false
            }, { quoted: Info });
            
            await sock.sendMessage(from, { 
                react: { text: randomEmoji, key: Info.key } 
            });
        } catch (e) {
            console.error("Erro ao baixar ou enviar áudio:", e.message);
            return reply("❌ Erro ao baixar o arquivo de áudio da API.");
        }
        
    } catch (error) {
        console.error("Erro fatal no playpri:", error.message);
        await sock.sendMessage(from, { 
            react: { text: "❌", key: Info.key } 
        });
        await sock.sendMessage(from, { 
            text: `❌ Erro ao processar a música: ${error.message}`
        }, { quoted: Info });
    }
}

module.exports = playpriCommand;
playpriCommand.mediaStorage = MEDIA_CACHE_PATH;
