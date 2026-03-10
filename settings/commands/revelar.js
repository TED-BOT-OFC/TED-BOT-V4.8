// 📁 settings/commands/revelar.js
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");

module.exports = {
  name: "revelar",
  alias: ["view", "show", "see", "👁️revelar"],
  description: "Reenvia imagens ou vídeos de visualização única como mídia normal",
  category: "Utilidades",

  async execute(sock, from, msg, args, command, config, BOT_PHONE) {
    try {
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      const quotedMsg = contextInfo?.quotedMessage;

      if (!quotedMsg) {
        return sock.sendMessage(from, {
          text: "❌ *Como usar:* Marque/reply em uma imagem, vídeo ou sticker e use o comando *!revelar*"
        }, { quoted: msg });
      }

      const quotedSender = contextInfo.participant;
      const quotedSenderNumber = quotedSender?.split('@')[0] || 'desconhecido';

      const isImage = quotedMsg.imageMessage;
      const isVideo = quotedMsg.videoMessage;
      const isSticker = quotedMsg.stickerMessage;

      if (!isImage && !isVideo && !isSticker) {
        return sock.sendMessage(from, {
          text: "❌ A mensagem marcada não contém imagem, vídeo ou sticker!"
        }, { quoted: msg });
      }

      let buffer, caption = "";

      if (isImage) {
        const media = quotedMsg.imageMessage;
        caption = media.caption || '';
        const stream = await downloadContentFromMessage(media, 'image');
        buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(from, {
          image: buffer,
          caption: `👁️ *IMAGEM REVELADA*\n\n📝 ${caption}\n\n📨 Originalmente enviado por: @${quotedSenderNumber}`,
          mentions: [quotedSender]
        }, { quoted: msg });

      } else if (isVideo) {
        const media = quotedMsg.videoMessage;
        caption = media.caption || '';
        const stream = await downloadContentFromMessage(media, 'video');
        buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(from, {
          video: buffer,
          caption: `👁️ *VÍDEO REVELADO*\n\n📝 ${caption}\n\n📨 Originalmente enviado por: @${quotedSenderNumber}`,
          mentions: [quotedSender]
        }, { quoted: msg });

      } else if (isSticker) {
        const media = quotedMsg.stickerMessage;
        const stream = await downloadContentFromMessage(media, 'sticker');
        buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(from, {
          sticker: buffer
        }, { quoted: msg });

        await sock.sendMessage(from, {
          text: `👁️ *STICKER REENVIADO*\n\n📨 Originalmente enviado por: @${quotedSenderNumber}`,
          mentions: [quotedSender]
        }, { quoted: msg });
      }

    } catch (err) {
      console.error("Erro no comando revelar:", err);
      await sock.sendMessage(from, {
        text: "❌ Ocorreu um erro ao reenviar a mídia."
      }, { quoted: msg });
    }
  }
};