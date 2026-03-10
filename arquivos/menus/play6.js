const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * Comando: play6
 * Função: Baixar áudio (MP3) do YouTube via API v8 tedzinho (Suporta link e busca por nome).
 * Exclui arquivos temporários após 1 minuto.
 */
async function play6(sock, from, args, Info) {
  const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: Info });

  try {
    const query = args.join(" ").trim();

    if (!query) {
      return reply(`❌ Digite o nome da música ou cole o link do YouTube!\n\n*Exemplo:*\n.play6 Matuê - Quer Voar`);
    }

    await sock.sendMessage(from, { react: { text: "🔍", key: Info.key } });

    const apikey = "J";
    const apiUrl = `https://tedzinho.com.br/api/download/play_audio/v8?apikey=${apikey}&nome_url=${encodeURIComponent(query)}`;
    
    let audioUrl = null;
    let title = "Áudio do YouTube";
    let thumbnail = null;
    let author = "Desconhecido";
    let duration = "N/A";
    let views = "0";
    let attempts = 0;
    const maxAttempts = 40;

    // Polling para encontrar o link do áudio
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
              // Priorizar áudio, mas se não tiver, pegar vídeo para converter
              const route = data.rotas.find(r => r.tipo === "audio") || data.rotas.find(r => r.tipo === "video" && r.extensao === "mp4");
              if (route && route.url) {
                audioUrl = route.url;
                break;
              }
            }
          }
        }
      } catch (err) {
        console.log(`[play6] Tentativa ${attempts + 1} falhou.`);
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!audioUrl) {
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      return reply("❌ Não consegui encontrar ou processar esta música. Tente ser mais específico no nome.");
    }

    await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

    // Baixar o buffer
    const buffer = await axios.get(audioUrl, { 
        responseType: "arraybuffer",
        headers: { 'User-Agent': 'Mozilla/5.0' }
    }).then(r => r.data).catch(() => null);

    if (!buffer) {
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      return reply("❌ Falha ao baixar o arquivo de áudio.");
    }

    // Salvar temporariamente para enviar
    const fileName = `${Date.now()}.mp3`;
    const filePath = path.join(__dirname, "../../database/assets/webp/tmp", fileName);
    
    if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Legenda moderna e organizada
    const caption = `╭━━━〔 🎵 *PLAY AUDIO 6* 〕━━━┈\n` +
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

    // Enviar a thumbnail primeiro para dar destaque (se houver)
    if (thumbBuffer) {
        await sock.sendMessage(from, {
            image: thumbBuffer,
            caption: caption
        }, { quoted: Info });
    }

    // Enviar o áudio em seguida
    await sock.sendMessage(from, {
      audio: fs.readFileSync(filePath),
      mimetype: "audio/mpeg",
      fileName: `${title}.mp3`,
      ptt: false
    }, { quoted: Info });

    await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });

    // Exclusão após 1 minuto
    setTimeout(() => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }, 60000);

  } catch (e) {
    console.error("❌ Erro no play6:", e);
    reply("❌ Ocorreu um erro inesperado.");
  }
}

module.exports = play6;
