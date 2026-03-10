// ./arquivos/menus/kwai.js
const axios = require('axios');

// Função para formatar números grandes (1K, 1.2M, etc.)
function formatNumber(num) {
    if (!num && num !== 0) return "0";
    const absNum = Math.abs(num);
    if (absNum >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + "B";
    if (absNum >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + "M";
    if (absNum >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + "K";
    return num.toString();
}

async function kwaiCommand({ sock, from, args, sasah, API_KEY_TED, prefix, Info }) {
    const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: sasah });

    try {
        const url = args[0];
        if (!url) return reply(`❌ Cadê o link do Kwai?\nExemplo: ${prefix}kwai https://k.kwai.com/p/s0CCjLYC`);

        await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

        // Configuração de requisição segura e rápida
        const config = {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json',
            }
        };

        let response;
        try {
            const res = await axios.get(`https://tedzinho.com.br/api/download/kwai?apikey=${API_KEY_TED}&query=${encodeURIComponent(url)}`, config);
            response = res.data;
        } catch (err) {
            console.error("❌ Erro ao acessar API do Kwai:", err.message);
            if (err.code === 'ECONNABORTED') return reply("⏰ Tempo de resposta da API excedido.");
            if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') return reply("🚫 Não foi possível conectar à API do Kwai.");
            return reply("⚠️ Ocorreu um erro de rede ao tentar acessar o Kwai.");
        }

        if (!response || response.status !== "OK" || !response.resultado?.dl) {
            console.error("⚠️ Retorno inesperado da API:", response);
            return reply("⚠️ Não consegui encontrar o vídeo do Kwai.");
        }

        const r = response.resultado;

        const stats = `
❤️ ${formatNumber(r.like)}
💬 ${formatNumber(r.comments)}
🔁 ${formatNumber(r.share)}
👀 ${formatNumber(r.watch)}`;

        const author = r.profile?.name || "Desconhecido";
        const profileUrl = r.profile?.url || "—";
        const profileIcon = r.profile?.icon || null;

        const audioName = r.audioName || null;
        const audioAuthor = r.audioAuthor || null;
        const genre = r.genre ? r.genre.join(", ") : "Desconhecido";

        const caption = `🎬 *Kwai HD*
👤 *Autor:* ${author}
🔗 Perfil: ${profileUrl}
🎵 Áudio: ${audioName ? `${audioName} (${audioAuthor})` : "Sem áudio"}
📅 Data: ${r.date ? new Date(r.date).toLocaleDateString() : "Desconhecida"}
🏷️ Gênero: ${genre}
📜 Descrição: ${r.description || "Sem descrição"}
📊 Estatísticas:${stats}`;

        // Baixa o vídeo
        const videoBuffer = await axios.get(r.dl, { responseType: 'arraybuffer', timeout: 20000 })
            .then(res => res.data)
            .catch(err => {
                console.error("❌ Falha ao baixar vídeo:", err.message);
                return null;
            });

        if (!videoBuffer) return reply("❌ Falha ao baixar o vídeo do Kwai.");

        // Envia vídeo
        await sock.sendMessage(from, {
            video: videoBuffer,
            mimetype: "video/mp4",
            fileName: `Kwai_${author}.mp4`,
            caption: caption,
            thumbnail: profileIcon
                ? await axios.get(profileIcon, { responseType: 'arraybuffer' }).then(r => r.data).catch(() => null)
                : undefined
        }, { quoted: sasah });

        // Envia áudio (se disponível)
        if (audioName && r.dl_audio) {
            const audioBuffer = await axios.get(r.dl_audio, { responseType: 'arraybuffer', timeout: 15000 })
                .then(res => res.data)
                .catch(() => null);

            if (audioBuffer) {
                await sock.sendMessage(from, {
                    audio: audioBuffer,
                    mimetype: "audio/mpeg",
                    fileName: `${audioName}.mp3`,
                    caption: `🎵 Áudio original: ${audioName} (${audioAuthor})`
                }, { quoted: sasah });
            }
        }

        await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });

    } catch (e) {
        console.error("❌ Erro geral no comando Kwai:", e);
        await sock.sendMessage(from, { text: "❌ Erro ao processar o comando Kwai HD." }, { quoted: sasah });
    }
}

module.exports = kwaiCommand;