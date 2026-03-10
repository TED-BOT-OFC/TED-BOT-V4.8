const axios = require("axios");

/**
 * Comando: playvid
 * Função: Baixar e enviar vídeo ou música do YouTube via API externa.
 */
async function playvid(sock, from, args, Info) {
  const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: Info });

  try {
    const query = args.join(" ").trim();

    if (!query) {
      return reply(`❌ Cadê o nome da música ou o link do YouTube?\n\n*Exemplo:*\n.playvid Matuê Quer Voar`);
    }

    await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = query.match(youtubeRegex);
    const youtubeId = match ? match[1] : null;

    const apiUrlVideo = youtubeId
      ? `https://systemzone.store/api/ytmp4?id=${youtubeId}`
      : `https://systemzone.store/api/ytmp4?text=${encodeURIComponent(query)}`;
    
    // Tentamos obter os dados do vídeo primeiro
    const videoResponse = await axios.get(apiUrlVideo).then(r => r.data).catch(() => null);

    if (!videoResponse || !videoResponse.status) {
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      return reply("⚠️ Não consegui encontrar o conteúdo solicitado. Verifique o nome ou o link.");
    }

    // Extração de dados baseada no exemplo fornecido pelo usuário
    const { 
      title = "Sem título", 
      author = "Desconhecido", 
      duration = "N/A", 
      thumbnail, 
      download_vid_url 
    } = videoResponse;

    if (!download_vid_url) {
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      return reply("❌ A API não forneceu um link para download do vídeo. Tente outro.");
    }

    // Lógica de duração para decidir se envia áudio ou vídeo (se desejado manter essa lógica)
    let durationSec = 0;
    if (typeof duration === "string" && duration.includes(":")) {
      const parts = duration.split(":").map(Number);
      if (parts.length === 3) durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) durationSec = parts[0] * 60 + parts[1];
    }

    // Se a duração for menor que 15 minutos (900s), podemos tentar baixar o áudio se a API ytmp3 existir
    // Mas para garantir compatibilidade com o exemplo de ytmp4, vamos focar no vídeo ou converter se necessário.
    // Como o usuário pediu para atualizar baseado no ytmp4, vamos focar no fluxo de vídeo.

    const buffer = await axios.get(download_vid_url, { responseType: "arraybuffer" }).then(r => r.data).catch(() => null);

    if (!buffer) {
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      return reply("❌ Falha ao baixar o arquivo final. Pode ser um problema temporário na API.");
    }

    const caption = `*${title}*\n\n👤 *Autor:* ${author}\n⏱️ *Duração:* ${duration}`;

    // Envio do vídeo
    await sock.sendMessage(from, {
      video: buffer,
      mimetype: "video/mp4",
      fileName: `${title.replace(/[^\w\s.-]/gi, "")}.mp4`,
      caption: caption,
      jpegThumbnail: thumbnail ? (await axios.get(thumbnail, { responseType: 'arraybuffer' }).then(r => r.data).catch(() => undefined)) : undefined
    }, { quoted: Info });

    await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });

  } catch (e) {
    console.error("❌ Erro fatal no comando playvid:", e);
    await sock.sendMessage(from, { text: "❌ Ocorreu um erro inesperado ao processar sua solicitação." }, { quoted: Info });
  }
}

module.exports = playvid;
