const axios = require("axios");

/**
 * Comando: playvid2
 * Função: Buscar vídeo por nome, obter link do YouTube e enviar DIRETAMENTE via URL.
 * Versão Otimizada: Envia o vídeo sem baixar para o servidor, economizando espaço e tempo.
 */
module.exports = async function playvid2Command(sock, from, Info, args, prefix) {
    const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: Info });

    try {
        const query = args.join(" ").trim();
        if (!query) {
            return reply(`❌ Cadê o nome do vídeo ou o link do YouTube?\n\n*Exemplo:*\n${prefix}playvid2 Matuê - Crack com Mussilon`);
        }

        // Reação de busca
        await sock.sendMessage(from, { react: { text: "🔎", key: Info.key } });

        let videoUrl = "";
        let videoTitle = "";

        // Verificar se já é um link do YouTube
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = query.match(youtubeRegex);

        if (match) {
            videoUrl = match[0];
        } else {
            // Buscar pelo nome usando a API de pesquisa
            try {
                const searchRes = await axios.get("https://tedzinho.com.br/api/pesquisa/youtube", {
                    params: {
                        apikey: "J",
                        query: query
                    }
                });

                const resultados = searchRes.data?.resultado;
                if (resultados && resultados.length > 0) {
                    videoUrl = resultados[0].url;
                    videoTitle = resultados[0].title;
                }
            } catch (err) {}
        }

        if (!videoUrl) {
            await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
            return reply("❌ Não consegui encontrar nenhum vídeo com esse nome.");
        }

        // Reação de processamento
        await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

        // Chamar a API de download
        const apiUrl = `https://systemzone.store/api/downloader/ytdl-v4?apikey=Tedsystem&url=${encodeURIComponent(videoUrl)}&type=mp4&quality=720`;
        
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || !data.status || !data.result || !data.result.download_url) {
            await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
            return reply("⚠️ Erro ao obter o link de download da API. Tente novamente mais tarde.");
        }

        const result = data.result;
        const downloadUrl = result.download_url;
        const title = result.title || videoTitle || "Vídeo do YouTube";

        // Reação de enviando
        await sock.sendMessage(from, { react: { text: "📤", key: Info.key } });

        // Enviar o vídeo DIRETAMENTE pela URL
        // Isso faz com que o WhatsApp baixe o vídeo diretamente do servidor da API
        await sock.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: "video/mp4",
            caption: `🎬 *${title}*\n\n🔗 *Link:* ${videoUrl}`,
            fileName: `${title.replace(/[^\w\s.-]/gi, "")}.mp4`
        }, { quoted: Info });

        // Reação final
        await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });

    } catch (e) {
        await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
        await reply("❌ Ocorreu um erro ao processar seu vídeo. Verifique se o link é suportado ou tente novamente.");
    }
};
