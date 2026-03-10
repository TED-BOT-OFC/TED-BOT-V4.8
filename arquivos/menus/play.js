const axios = require("axios");

module.exports = async function playCommand(sock, from, Info, args, prefix, API_KEY_TED) {
    const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: Info });

    try {
        const query = args.join(" ");
        if (!query) return reply(`❌ Cadê o nome da música?\nExemplo: ${prefix}play Casa do Seu Zé`);

        // ✅ Função de formatação revisada
        const formatarNumero = (num) => {
            if (!num) return "0";
            num = typeof num === "string" ? parseInt(num.replace(/\D/g, "")) : num;
            if (isNaN(num)) return "0";

            if (num < 1000) return num.toString(); // Ex: 100 → 100
            if (num < 1_000_000) {
                const k = (num / 1000);
                return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + "K"; // Ex: 1200 → 1.2K
            }
            if (num < 1_000_000_000) {
                const m = (num / 1_000_000);
                return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + "M"; // Ex: 1.2M
            }
            const b = (num / 1_000_000_000);
            return (b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)) + "B"; // Ex: 2B
        };

        // ✅ Ordem das rotas (Adicionada a Rota Principal no topo)
        const rotas = [
            { nome: "Principal", url: `https://tedzinho.com.br/api/download/play_audio?apikey=${API_KEY_TED}&nome_url=${encodeURIComponent(query)}`, emoji: "🚀" },
            { nome: "V6", url: `https://tedzinho.com.br/api/download/play_audio/v6?apikey=${API_KEY_TED}&nome_url=${encodeURIComponent(query)}`, emoji: "1️⃣" },
            { nome: "V5", url: `https://tedzinho.com.br/api/download/play_audio/v5?apikey=${API_KEY_TED}&nome_url=${encodeURIComponent(query)}`, emoji: "2️⃣" },
            { nome: "V3", url: `https://tedzinho.com.br/api/download/play_audio/v3?apikey=${API_KEY_TED}&nome_url=${encodeURIComponent(query)}`, emoji: "3️⃣" },
            { nome: "V8", url: `https://tedzinho.com.br/api/download/play_audio/v8?apikey=${API_KEY_TED}&nome_url=${encodeURIComponent(query)}`, emoji: "4️⃣" },
        ];

        let rotaUsada = null;

        for (const r of rotas) {
            await sock.sendMessage(from, { react: { text: r.emoji, key: Info.key } });

            try {
                const res = await axios.get(r.url);
                const data = res.data;

                if (!data || data.status !== "OK" || !data.resultado) continue;

                const resu = data.resultado;
                const titulo = resu.title || resu.titulo || 'Áudio Desconhecido';
                const canal = resu.channel || resu.autor || 'Desconhecido';
                const duracao = resu.timestamp || resu.duracao || 'N/D';
                const views = formatarNumero(resu.viewsCount || resu.views || 0);
                const publicado = resu.uploadDate || resu.publicado || 'N/D';
                const thumb = resu.thumbnails?.[0] || resu.thumbnail || resu.image || null;
                const videoUrl = resu.externalUrls?.video || resu.videoUrl || resu.url || '';
                
                // Identificar o link de download (pode ser string direta ou objeto com .url)
                let audioUrl = resu.dl_link || resu.arquivo || resu.audioUrl;
                if (typeof audioUrl === 'object' && audioUrl !== null) {
                    audioUrl = audioUrl.url;
                }

                if (!audioUrl) continue;

                const caption =
                    `🎧 *TOCANDO AGORA*\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `📀 *Título:* ${titulo}\n` +
                    `👤 *Artista/Canal:* ${canal}\n` +
                    `⏰ *Duração:* ${duracao}\n` +
                    `👁️ *Visualizações:* ${views}\n` +
                    `📅 *Publicado:* ${publicado}\n` +
                    `🔗 *YouTube:* ${videoUrl}\n` +
                    `📡 *Rota usada:* ${r.nome}\n` +
                    `━━━━━━━━━━━━━━━━━━━━`;

                if (thumb) {
                    await sock.sendMessage(from, { image: { url: thumb }, caption }, { quoted: Info });
                } else {
                    await reply(caption);
                }

                // Enviar o áudio
                await sock.sendMessage(from, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${titulo.substring(0, 50)}.mp3`,
                    ptt: false
                }, { quoted: Info });

                rotaUsada = r.nome;
                break;

            } catch (e) {
                console.error(`Erro na rota ${r.nome}:`, e.message);
            }
        }

        if (!rotaUsada) return reply("❌ Nenhuma rota funcionou no momento.");

    } catch (e) {
        console.error(e);
        await reply("❌ Erro ao processar sua música.");
    }
};
