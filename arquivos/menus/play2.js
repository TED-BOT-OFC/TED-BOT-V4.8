const axios = require("axios");

// ⏳ sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 🔢 formatar views
function formatarVisualizacoes(num) {
    if (!num || isNaN(num)) return "??";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(".0", "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(".0", "") + "K";
    return num.toString();
}

// 🧹 limpar nome do arquivo
function limparNomeArquivo(nome) {
    return nome.replace(/[\\/:*?"<>|]/g, "").trim();
}

// 🎧 DOWNLOAD COM ESPERA (5s ATÉ 50s)
async function baixarAudioComEspera(videoUrl) {
    const API_DOWNLOAD = "http://node.tedzinho.com.br:1150/audio";
    const API_STATUS = "http://node.tedzinho.com.br:1150/status";

    const intervalo = 5000;
    const maxTentativas = 10;

    let taskId = null;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
        try {
            const res = await axios.get(
                `${API_DOWNLOAD}?url=${encodeURIComponent(videoUrl)}&ext=mp3&abr=320`
            );

            const data = res.data;

            if (data?.download_url) {
                return data;
            }

            if (data?.status === "processing" && data?.task_id) {
                taskId = data.task_id;
            }

            if (taskId) {
                const statusRes = await axios.get(`${API_STATUS}/${taskId}`);
                const statusData = statusRes.data;

                if (statusData?.status === "completed" && statusData?.download_url) {
                    return statusData;
                }

                if (statusData?.status === "failed") {
                    throw new Error("Falha na conversão");
                }
            }
        } catch {
            // silêncio total
        }

        if (tentativa < maxTentativas) {
            await sleep(intervalo);
        }
    }

    throw new Error("Tempo máximo de download atingido");
}

module.exports = async function play2Command(sock, from, Info, args, prefix) {
    const reply = (text) =>
        sock.sendMessage(from, { text }, { quoted: Info });

    const inicio = Date.now();
    const entrada = args.join(" ");

    if (!entrada) {
        return reply(`❌ Use: ${prefix}play2 nome da música`);
    }

    // 🔎 reação: buscando
    await sock.sendMessage(from, { react: { text: "🔎", key: Info.key } });

    const API_SEARCH = "https://tedzinho.com.br/api/pesquisa/youtube";

    // 🔎 PESQUISA COM ESPERA
    let video = null;
    const intervalo = 5000;
    const maxTentativas = 10;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
        try {
            const res = await axios.get(API_SEARCH, {
                params: {
                    apikey: "J",
                    query: entrada
                }
            });

            const resultados = res.data?.resultado;

            if (resultados && resultados.length > 0) {
                video = resultados[0];
                break;
            }
        } catch {
            // silêncio total
        }

        if (tentativa < maxTentativas) {
            await sleep(intervalo);
        }
    }

    if (!video) {
        return reply("❌ Não encontrei essa música após 50 segundos.");
    }

    // ⬇️ reação: baixando
    await sock.sendMessage(from, { react: { text: "⬇️", key: Info.key } });

    // 🎧 DOWNLOAD
    let downloadData;
    try {
        downloadData = await baixarAudioComEspera(video.url);
    } catch {
        return reply("❌ Não foi possível baixar o áudio.");
    }

    try {
        const audioRes = await axios.get(downloadData.download_url, {
            responseType: "arraybuffer"
        });

        const buffer = Buffer.from(audioRes.data);
        const tempoTotal = ((Date.now() - inicio) / 1000).toFixed(1);
        const nomeArquivo = limparNomeArquivo(video.title);

        // 🎵 ENVIO DO ÁUDIO (ÚNICO + PREVIEW COMPLETO)
        await sock.sendMessage(
            from,
            {
                audio: buffer,
                mimetype: "audio/mpeg",
                fileName: `${nomeArquivo}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: video.title,
                        body: `Canal: ${video.author.name} • ${video.timestamp} • ${formatarVisualizacoes(video.views)} views`,
                        thumbnailUrl: video.thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        sourceUrl: video.url
                    }
                }
            },
            { quoted: Info }
        );

        // 🎵 reação final
        await sock.sendMessage(from, { react: { text: "🎵", key: Info.key } });

    } catch {
        reply("❌ Erro ao enviar o áudio.");
    }
};