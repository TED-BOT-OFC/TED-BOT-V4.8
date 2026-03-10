const axios = require("axios");

module.exports = async function platedCommand(sock, from, Info, args, prefix, API_KEY_TED) {
    const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: Info });

    try {
        const url = args[0];
        if (!url) return reply(`❌ Cadê o link do PalcoMP3?\nExemplo: ${prefix}plated https://www.palcomp3.com/cantormarcelorocha/choraiada/`);

        // Reação de processamento
        await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

        // URL da API baseada no exemplo fornecido pelo usuário
        const apiURL = `https://tedzinho.com.br/api/download/PLATEDMP3?apikey=${API_KEY_TED}&nome_url=${encodeURIComponent(url)}`;

        const res = await axios.get(apiURL);
        const data = res.data;

        // A estrutura do JSON fornecido pelo usuário tem um "resultado" dentro de outro "resultado"
        if (!data || data.status !== "OK" || !data.resultado || !data.resultado.resultado) {
            return reply("❌ Não foi possível obter as informações da música. Verifique o link ou tente novamente mais tarde.");
        }

        const musica = data.resultado.resultado;
        
        if (!musica.status) {
            return reply("❌ A API retornou um erro ao processar este link.");
        }

        const titulo = musica.titulo || "Sem título";
        const artista = musica.artista || "Desconhecido";
        const downloadUrl = musica.downloadUrl;
        const fonte = musica.fonte || "PalcoMP3";
        const tamanho = musica.tamanhoEstimado || "N/A";

        const legenda = `🎵 *Música Encontrada*\n\n` +
                        `📌 *Título:* ${titulo}\n` +
                        `👤 *Artista:* ${artista}\n` +
                        `💾 *Tamanho:* ${tamanho}\n` +
                        `🌐 *Fonte:* ${fonte}\n\n` +
                        `⏳ *Enviando o áudio, aguarde...*`;

        // Envia as informações primeiro
        await reply(legenda);

        if (!downloadUrl) {
            return reply("❌ Link de download não encontrado na resposta da API.");
        }

        // Download e envio do áudio
        // Usando a URL de download diretamente se possível, ou baixando o buffer
        try {
            await sock.sendMessage(from, { 
                audio: { url: downloadUrl }, 
                mimetype: "audio/mpeg", 
                fileName: `${titulo}.mp3`, 
                ptt: false 
            }, { quoted: Info });
            
            await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });
        } catch (downloadError) {
            console.error("Erro ao baixar/enviar áudio:", downloadError.message);
            
            // Tentativa alternativa: Baixar o buffer manualmente caso o link direto falhe no Baileys
            const audioBuffer = await axios.get(downloadUrl, { responseType: "arraybuffer" })
                .then(r => r.data)
                .catch(() => null);

            if (audioBuffer) {
                await sock.sendMessage(from, { 
                    audio: audioBuffer, 
                    mimetype: "audio/mpeg", 
                    fileName: `${titulo}.mp3`, 
                    ptt: false 
                }, { quoted: Info });
                await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });
            } else {
                reply("❌ Falha ao enviar o arquivo de áudio. O link pode ter expirado ou estar inacessível.");
            }
        }

    } catch (e) {
        console.error("Erro no comando plated:", e);
        await reply("❌ Ocorreu um erro ao processar o comando.");
    }
};
