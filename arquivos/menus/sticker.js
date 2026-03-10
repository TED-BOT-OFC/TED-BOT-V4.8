const fs = require('fs');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const webp = require('node-webpmux');
const path = require('path');

module.exports = {
  name: 'sticker',
  alias: ['s', 'stickergifp', 'figura', 'f', 'figu', 'st', 'stk', 'fgif', 'fsticker'],
  description: 'Cria figurinha a partir de imagem ou vídeo com alta compatibilidade',
  category: 'Utilidades',

  async execute(sock, from, Info, args, command, config) {
    try {
      const quoted = Info.message?.extendedTextMessage?.contextInfo?.quotedMessage || {};
      const msgContent = Info.message || {};
      const pushname = Info.pushName || 'Usuário';
      const nomebot = config.NomeDoBot || config.nomebot || 'Bot';

      let groupName = 'Grupo';
      try {
        if (from.endsWith('@g.us')) {
          const metadata = await sock.groupMetadata(from);
          groupName = metadata?.subject || 'Grupo';
        }
      } catch {}

      let packName = `Bot: ${nomebot}\nSolicitante: ${pushname}\nGrupo: ${groupName}`;
      let authorName = `🤖 ${nomebot}`;

      if (args.length > 0) {
        const text = args.join(" ");
        const parts = text.split(/[|/]/).map(p => p.trim());
        if (parts.length > 0) packName = parts[0];
        if (parts.length > 1) authorName = parts[1];
      }

      packName = packName.substring(0, 80);
      authorName = authorName.substring(0, 30);

      const isImage = !!msgContent.imageMessage || !!quoted.imageMessage;
      const isVideo = !!msgContent.videoMessage || !!quoted.videoMessage;

      if (!isImage && !isVideo) {
        return sock.sendMessage(from, {
          text: "❌ Envie ou marque uma imagem/vídeo (até 10s) para criar figurinha."
        }, { quoted: Info });
      }

      const mediaType = isImage ? "image" : "video";
      const mediaObj = isImage
        ? (msgContent.imageMessage || quoted.imageMessage)
        : (msgContent.videoMessage || quoted.videoMessage);

      // Limite de tempo rigoroso para vídeos
      if (mediaType === "video" && mediaObj.seconds > 10) {
        return sock.sendMessage(from, { text: "❌ O vídeo precisa ter no máximo 10 segundos para caber no limite do WhatsApp." }, { quoted: Info });
      }

      await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

      const stream = await downloadContentFromMessage(mediaObj, mediaType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      
      const timestamp = Date.now();
      const inputFile = path.join(tempDir, `input_${timestamp}.${isImage ? 'jpg' : 'mp4'}`);
      const outputFile = path.join(tempDir, `output_${timestamp}.webp`);
      const finalFile = path.join(tempDir, `final_${timestamp}.webp`);

      fs.writeFileSync(inputFile, buffer);

      let ffmpegCommand;
      if (isImage) {
        // Para imagem, mantemos uma qualidade boa pois o tamanho raramente é problema
        ffmpegCommand = `ffmpeg -i "${inputFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba" -vcodec libwebp -lossless 1 -qscale 75 -preset picture -an -vsync 0 -y "${outputFile}"`;
      } else {
        // PARA VÍDEO: Compressão agressiva para garantir que o arquivo fique abaixo de 1MB
        // Reduzimos FPS para 10, usamos qscale 40 (menor qualidade = menor arquivo) e limitamos a resolução
        ffmpegCommand = `ffmpeg -i "${inputFile}" -vf "fps=10,scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba" -vcodec libwebp -lossless 0 -qscale 40 -preset default -loop 0 -an -vsync 0 -t 8 -y "${outputFile}"`;
      }

      await execAsync(ffmpegCommand);
      
      if (!fs.existsSync(outputFile)) {
        throw new Error('FFMPEG falhou em gerar o arquivo webp');
      }

      // Adicionar metadados EXIF
      const img = new webp.Image();
      await img.load(outputFile);

      const exifData = {
        "sticker-pack-id": `ted-bot-${timestamp}`,
        "sticker-pack-name": packName,
        "sticker-pack-publisher": authorName,
        "emojis": ["🔥"]
      };

      const exifHeader = Buffer.from([
        0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x16, 0x00, 0x00, 0x00
      ]);
      const jsonBuffer = Buffer.from(JSON.stringify(exifData), 'utf8');
      exifHeader.writeUInt32LE(jsonBuffer.length, 14);
      const fullExif = Buffer.concat([exifHeader, jsonBuffer]);
      img.exif = fullExif;

      await img.save(finalFile);

      // Verificar tamanho do arquivo final
      const stats = fs.statSync(finalFile);
      const fileSizeInBytes = stats.size;
      const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

      if (fileSizeInMegabytes > 1.0) {
         console.log(`⚠️ Figurinha muito grande: ${fileSizeInMegabytes.toFixed(2)}MB. Tentando compressão extra...`);
         // Se ainda for grande, tentamos uma compressão ainda mais forte
         const extraOutputFile = path.join(tempDir, `extra_${timestamp}.webp`);
         await execAsync(`ffmpeg -i "${outputFile}" -vcodec libwebp -lossless 0 -qscale 20 -preset default -loop 0 -an -y "${extraOutputFile}"`);
         if (fs.existsSync(extraOutputFile)) {
            await img.load(extraOutputFile);
            img.exif = fullExif;
            await img.save(finalFile);
         }
      }

      await sock.sendMessage(from, { sticker: fs.readFileSync(finalFile) }, { quoted: Info });
      await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });

      // Limpeza segura
      setTimeout(() => {
        [inputFile, outputFile, finalFile].forEach(f => {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        });
      }, 5000);

    } catch (err) {
      console.error('❌ Erro no comando sticker:', err);
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      await sock.sendMessage(from, { text: "❌ Erro ao gerar figurinha. O vídeo pode ser muito complexo ou pesado." }, { quoted: Info });
    }
  }
};
