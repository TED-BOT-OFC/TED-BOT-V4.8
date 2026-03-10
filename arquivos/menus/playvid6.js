const axios = require("axios");

/**
 * Comando: playvid6
 * Função: Baixar e enviar vídeo do YouTube via API v8 tedzinho (Suporta link e busca por nome).
 */
async function playvid6(sock, from, args, Info) {
  const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: Info });

  try {
    const query = args.join(" ").trim();

    if (!query) {
      return reply(`❌ Digite o nome do vídeo ou cole o link do YouTube!\n\n*Exemplo:*\n.playvid6 Matuê - Quer Voar`);
    }

    await sock.sendMessage(from, { react: { text: "🔍", key: Info.key } });

    const apikey = "J";
    // A API v8 aceita tanto o link quanto o texto no parâmetro nome_url
    const apiUrl = `https://tedzinho.com.br/api/download/play_audio/v8?apikey=${apikey}&nome_url=${encodeURIComponent(query)}`;
    
    let videoUrl = null;
    let title = "Vídeo do YouTube";
    let thumbnail = null;
    let author = "Desconhecido";
    let duration = "N/A";
    let views = "0";
    let attempts = 0;
    const maxAttempts = 40;

    // Sistema de polling para aguardar o processamento
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(apiUrl).then(r => r.data).catch(() => null);

        if (response && response.status === "OK") {
          const data = response.resultado?.resultado || response.resultado;
          
          if (data && data.status === true) {
            title = data.titulo || title;
            thumbnail = data.thumbnail || thumbnail;
            author = data.autor || author;
            duration = data.duracao || duration;
            views = data.views ? data.views.toLocaleString('pt-BR') : views;

            if (data.rotas && Array.isArray(data.rotas)) {
              const videoRoute = data.rotas.find(r => r.tipo === "video" && r.extensao === "mp4");
              if (videoRoute && videoRoute.url) {
                videoUrl = videoRoute.url;
                break;
              }
            }
          }
        }
      } catch (err) {
        console.log(`[playvid6] Tentativa ${attempts + 1} falhou.`);
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!videoUrl) {
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      return reply("❌ Não consegui encontrar ou processar este vídeo. Tente ser mais específico no nome.");
    }

    await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

    // Baixar o buffer do vídeo
    const videoBuffer = await axios.get(videoUrl, { 
        responseType: "arraybuffer",
        headers: { 'User-Agent': 'Mozilla/5.0' }
    }).then(r => r.data).catch(() => null);

    if (!videoBuffer) {
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      return reply("❌ Falha ao baixar o arquivo de vídeo.");
    }

    // Legenda moderna e organizada
    const caption = `╭━━━〔 🎬 *PLAY VIDEO 6* 〕━━━┈\n` +
                    `┃\n` +
                    `┃ 📌 *Título:* ${title}\n` +
                    `┃ 👤 *Canal:* ${author}\n` +
                    `┃ ⏱️ *Duração:* ${duration}\n` +
                    `┃ 👀 *Views:* ${views}\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━━━━━━━━━┈`;

    // Preparar thumbnail
    let thumbBuffer;
    if (thumbnail) {
        thumbBuffer = await axios.get(thumbnail, { responseType: 'arraybuffer' }).then(r => r.data).catch(() => undefined);
    }

    // Envio do vídeo com a thumb e legenda
    await sock.sendMessage(from, {
      video: Buffer.from(videoBuffer),
      mimetype: "video/mp4",
      fileName: `${title}.mp4`,
      caption: caption,
      jpegThumbnail: thumbBuffer
    }, { quoted: Info });

    await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });

  } catch (e) {
    console.error("❌ Erro no playvid6:", e);
    reply("❌ Ocorreu um erro inesperado.");
  }
}

module.exports = playvid6;
