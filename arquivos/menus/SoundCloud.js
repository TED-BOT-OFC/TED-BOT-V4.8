const SoundCloud = require('soundcloud-scraper');
const axios = require('axios');

const client = new SoundCloud.Client();

module.exports = async function soundCloudMenu({ sock, from, args, Info, prefix, API_KEY_TED }) {
    const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: Info });

    try {
        const query = args.join(" ");
        if (!query) return reply(`❌ Cadê o nome ou link da música do SoundCloud?\nExemplo: ${prefix}sc minha música favorita`);

        if (global.executandoSoundCloud?.[from]) {
            return reply('⏳ Aguarde! Um processo já está em andamento para você.');
        }

        global.executandoSoundCloud = global.executandoSoundCloud || {};
        global.executandoSoundCloud[from] = true;

        let linkOriginal;
        let scData = null; // Dados da API do Tedzinho
        let scraperTrack = null; // Dados do scraper, se usado

        // 🔎 Verifica se é link direto ou pesquisa
        if (query.includes("on.soundcloud.com") || query.includes("soundcloud.com")) {
            linkOriginal = query.trim();
            // Tenta obter informações diretamente da API do Tedzinho para links
            try {
                const apiUrl = `https://tedzinho.com.br/api/download/soundcloud?apikey=${API_KEY_TED}&url=${encodeURIComponent(linkOriginal)}`;
                const { data } = await axios.get(apiUrl);
                if (data && data.status === "OK" && data.resultado?.audio_url) {
                    scData = data.resultado;
                } else {
                    return reply("❌ Não consegui obter informações da música via API. Tente novamente ou use um nome.");
                }
            } catch (apiError) {
                console.error("Erro ao obter informações da API do Tedzinho para link:", apiError);
                return reply("❌ Erro ao comunicar com a API do Tedzinho. Tente novamente.");
            }
        } else {
            // Se não for link, usa o scraper para buscar por nome
            const results = await client.search(query, "track");
            if (!results.length) {
                delete global.executandoSoundCloud[from];
                return reply('❌ Nenhuma música encontrada com esse nome.');
            }
            linkOriginal = results[0].url;
            scraperTrack = await client.getSongInfo(linkOriginal); // Obtém informações detalhadas do scraper

            // Tenta obter informações da API do Tedzinho com o link encontrado pelo scraper
            try {
                const apiUrl = `https://tedzinho.com.br/api/download/soundcloud?apikey=${API_KEY_TED}&url=${encodeURIComponent(linkOriginal)}`;
                const { data } = await axios.get(apiUrl);
                if (data && data.status === "OK" && data.resultado?.audio_url) {
                    scData = data.resultado;
                } else {
                    return reply("❌ Não consegui obter informações da música via API com o link encontrado. Tente novamente.");
                }
            } catch (apiError) {
                console.error("Erro ao obter informações da API do Tedzinho após busca por nome:", apiError);
                return reply("❌ Erro ao comunicar com a API do Tedzinho. Tente novamente.");
            }
        }

        if (!scData || !linkOriginal) {
            delete global.executandoSoundCloud[from];
            return reply('❌ Erro ao obter informações da música.');
        }

        // 🕒 Formatar duração
        const formatDuration = (ms) => {
            if (!ms) return "Desconhecida";
            const totalSeconds = Math.floor(ms / 1000);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
        };

        // 🔢 Formatar números grandes
        const formatNumber = (num) => {
            if (num === undefined || num === null) return "Desconhecido";
            if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "bi";
            if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "mi";
            if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
            return num.toString();
        };

        // Usar dados da API do Tedzinho, com fallback para scraper se necessário
        const title = scData.title || (scraperTrack ? scraperTrack.title : "Sem título");
        const author = scData.author || (scraperTrack ? scraperTrack.author?.name : "Desconhecido");
        const duration = scData.duration || formatDuration(scraperTrack ? scraperTrack.duration : 0);
        const thumbnail = scData.thumbnail || (scraperTrack ? scraperTrack.thumbnail : "https://i.imgur.com/OQZy6il.png");
        const plays = formatNumber(scraperTrack ? scraperTrack.playCount : 0);
        const likes = formatNumber(scraperTrack ? scraperTrack.likes : 0);
        const reposts = formatNumber(scraperTrack ? scraperTrack.reposts : 0);
        const published = scraperTrack ? scraperTrack.publishedAt : "Desconhecido";
        const description = scraperTrack ? scraperTrack.description?.slice(0, 300) : "Sem descrição disponível.";
        const link = scData.original_url || linkOriginal;

        // 🖼️ Envia imagem com legenda estilizada
        await sock.sendMessage(from, {
            image: { url: thumbnail },
            caption: `🎶 *${title}*  \n👤 *Autor:* ${author}  \n⏱️ *Duração:* ${duration}  \n▶️ *Plays:* ${plays}  \n❤️ *Likes:* ${likes}  \n🔁 *Reposts:* ${reposts}  \n🗓️ *Publicado:* ${published}  \n🔗 *Link original:* ${link}\n\n━━━━━━━━━━━━━━━━━━━  \n✨ *Powered by Tedzinho API*`,
            headerType: 4
        }, { quoted: Info });

        // 🔊 Baixar e enviar áudio final
        const audioBuffer = await axios.get(scData.audio_url, { responseType: 'arraybuffer' })
            .then(r => r.data)
            .catch(() => null);

        if (!audioBuffer) {
            delete global.executandoSoundCloud[from];
            return reply("❌ Falha ao baixar o áudio.");
        }

        await sock.sendMessage(from, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
            ptt: false
        }, { quoted: Info });

        delete global.executandoSoundCloud[from];

    } catch (err) {
        console.error("❌ Erro no SoundCloud:", err);
        await sock.sendMessage(from, { text: "❌ Erro ao processar sua música." }, { quoted: Info });
        delete global.executandoSoundCloud[from];
    }
};
