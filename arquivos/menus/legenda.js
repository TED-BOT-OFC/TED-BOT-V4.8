const fs = require("fs");
const path = require("path");
const axios = require("axios");
const webp = require('node-webpmux');
const FormData = require("form-data");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

/**
 * Baixa o buffer de uma mídia
 * @param {*} message - Objeto da mídia
 * @param {string} type - Tipo da mídia
 * @returns Buffer
 */
async function getFileBuffer(message, type) {
    const stream = await downloadContentFromMessage(message, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

module.exports = async (sock, from, msg, args, config) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const info = msg; // Alias para compatibilidade de raciocínio

    if (!quoted) {
      return sock.sendMessage(
        from,
        { text: "❌ Marque uma figurinha, imagem ou vídeo e use:\n.legenda seu texto aqui" },
        { quoted: msg }
      );
    }

    const textoOriginal = args.join(" ").trim();
    if (!textoOriginal) {
      return sock.sendMessage(
        from,
        { text: "❌ Você precisa escrever uma frase." },
        { quoted: msg }
      );
    }

    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

    const isSticker = !!quoted.stickerMessage;
    const isImage = !!quoted.imageMessage;
    const isVideo = !!quoted.videoMessage;
    const isAnimated = quoted.stickerMessage?.isAnimated === true;

    let buffer;
    let mediaType;

    if (isSticker) {
        buffer = await getFileBuffer(quoted.stickerMessage, "sticker");
        mediaType = "sticker";
    } else if (isImage) {
        buffer = await getFileBuffer(quoted.imageMessage, "image");
        mediaType = "image";
    } else if (isVideo) {
        buffer = await getFileBuffer(quoted.videoMessage, "video");
        mediaType = "video";
    } else {
        await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(from, { text: "❌ Mídia não suportada. Marque uma figurinha, imagem ou vídeo." }, { quoted: msg });
    }

    if (!buffer?.length) {
      await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
      return sock.sendMessage(from, { text: "❌ Falha ao baixar a mídia." }, { quoted: msg });
    }

    // Domínio correto baseado no erro 404
    const sitesys = "https://systemzone.store"; 
    const APIKEYSYS = "Tedsystem"; // API Key padrão para este domínio encontrada no index.js

    // Se for figurinha animada, converte para MP4 primeiro
    if (isSticker && isAnimated) {
      const formMp4 = new FormData();
      formMp4.append("image", buffer, {
        filename: "sticker.webp",
        contentType: "image/webp"
      });
      
      const mp4Response = await axios.post(
        `${sitesys}/api/ferramentas/tomp4`,
        formMp4,
        {
          headers: {
            ...formMp4.getHeaders(),
            apikey: APIKEYSYS
          },
          timeout: 120000
        }
      );

      if (!mp4Response.data?.status || !mp4Response.data?.result?.video) {
        throw new Error("Erro ao converter figurinha animada");
      }
      
      const videoRes = await axios.get(mp4Response.data.result.video, { responseType: "arraybuffer" });
      buffer = Buffer.from(videoRes.data);
    }

    // Agora envia para a API de legenda
    const form = new FormData();
    form.append("text", textoOriginal);
    form.append("image", buffer, {
      filename: isSticker && isAnimated ? "media.mp4" : "media.webp"
    });

    const { data } = await axios.post(
      `${sitesys}/api/canvas/legendafigu`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          apikey: APIKEYSYS
        },
        timeout: 120000
      }
    );

    if (!data?.status || !data?.result?.image) {
      throw new Error("API de legenda retornou erro ou resultado inválido");
    }

    const stickerUrl = data.result.image;
    const stickerRes = await axios.get(stickerUrl, { responseType: 'arraybuffer' });
    let stickerBuffer = Buffer.from(stickerRes.data);

    // Adicionar EXIF
    const tempDir = path.resolve(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const id = Date.now();
    const finalWebp = path.join(tempDir, `legenda_${id}.webp`);
    fs.writeFileSync(finalWebp, stickerBuffer);

    const pushname = msg.pushName || 'Usuário';
    const nomebot = config?.NomeDoBot || 'Bot';
    let groupName = 'Grupo';
    try {
      if (from.endsWith('@g.us')) {
        const metadata = await sock.groupMetadata(from);
        groupName = metadata?.subject || 'Grupo';
      }
    } catch {}

    const packName = `📛 Bot: ${nomebot}\n👤 Solicitante: ${pushname}\n👑 Grupo: ${groupName}`;
    const authorName = `🤖 ${nomebot}`;

    const img = new webp.Image();
    await img.load(finalWebp);
    const exifData = {
      "sticker-pack-id": `pack-legenda-${id}`,
      "sticker-pack-name": packName.substring(0, 80),
      "sticker-pack-publisher": authorName.substring(0, 30),
      "emojis": ["💬"]
    };
    const exifHeader = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(exifData), 'utf8');
    exifHeader.writeUInt32LE(jsonBuffer.length, 14);
    const fullExif = Buffer.concat([exifHeader, jsonBuffer]);
    img.exif = fullExif;
    await img.save(finalWebp);

    // Enviar a figurinha final
    await sock.sendMessage(from, { sticker: fs.readFileSync(finalWebp) }, { quoted: msg });
    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    // Limpeza
    setTimeout(() => {
      if (fs.existsSync(finalWebp)) fs.unlinkSync(finalWebp);
    }, 5000);

  } catch (err) {
    console.error("❌ Erro no comando legenda:", err);
    await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
    await sock.sendMessage(from, { text: `❌ Erro ao gerar a figurinha: ${err.message}` }, { quoted: msg });
  }
};
