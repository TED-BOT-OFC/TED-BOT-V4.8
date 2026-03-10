const fs = require('fs');
const webp = require('node-webpmux');

module.exports = {
  name: 'steal',
  alias: ['rouba', 'rb', 'roubar'],
  description: 'Rouba uma figurinha marcada e adiciona seus metadados',
  category: 'Utilidades',
  
  async execute(sock, from, Info, args, command, prefix) {
    try {
      const baileysModule = await import("@whiskeysockets/baileys");
      const { downloadContentFromMessage } = baileysModule;
      
      const quoted = Info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!quoted || !quoted.stickerMessage) {
        return sock.sendMessage(from, { text: "❌ Você precisa marcar uma figurinha para roubar." }, { quoted: Info });
      }

      await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

      // 🔹 SISTEMA DE RENOMEAR AUTOMÁTICO
      const pushname = Info.pushName || 'Usuário';
      const nomebot = prefix.NomeDoBot || prefix.nomebot || 'Bot';

      // 🔹 Obtém o nome real do grupo
      let groupName = 'Grupo';
      try {
        if (from.endsWith('@g.us')) {
          const groupMetadata = await sock.groupMetadata(from);
          groupName = groupMetadata.subject || 'Grupo';
        } else {
          groupName = 'Privado';
        }
      } catch (e) {
        console.error('❌ Erro ao obter nome do grupo:', e);
        groupName = 'Grupo';
      }

      let packName, authorName;

      if (args.length > 0) {
        // 🔹 Usuário forneceu nome personalizado
        const text = args.join(" ");
        
        if (text.includes("|")) {
          const parts = text.split("|");
          packName = parts[0].trim() || `Figurinha de ${pushname}`;
          authorName = parts[1].trim() || nomebot;
        } else if (text.includes("/")) {
          const parts = text.split("/");
          packName = parts[0].trim() || `Figurinha de ${pushname}`;
          authorName = parts[1].trim() || nomebot;
        } else {
          packName = text;
          authorName = nomebot;
        }
      } else {
        // 🔹 RENOMEAR AUTOMÁTICO - Frase melhorada
        packName = `📍 Esta figurinha pertence a ${pushname}`;
        authorName = `🤖 Criado por ${nomebot}`;
      }

      // 🔹 Limita o tamanho dos textos
      packName = packName.substring(0, 70);
      authorName = authorName.substring(0, 30);

      // Baixar a figurinha
      const stream = await downloadContentFromMessage(quoted.stickerMessage, "sticker");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      const timestamp = Date.now();
      const tempWebp = `./temp/sticker_roubado_${timestamp}.webp`;
      const finalWebp = `./temp/sticker_final_${timestamp}.webp`;

      if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');
      fs.writeFileSync(tempWebp, buffer);

      try {
        // 🔹 Usando node-webpmux para processar a figurinha
        const img = new webp.Image();
        await img.load(tempWebp);

        // 🔹 Cria EXIF personalizado
        const exifData = {
          "sticker-pack-id": `pack-${timestamp}`,
          "sticker-pack-name": packName,
          "sticker-pack-publisher": authorName,
          "emojis": ["😊"],
          "android-app-store-link": "https://play.google.com/store/apps/details?id=com.whatsapp",
          "ios-app-store-link": "https://itunes.apple.com/app/whatsapp-messenger/id310633997"
        };

        const exifHeader = Buffer.from([
          0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
          0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ]);
        const jsonBuffer = Buffer.from(JSON.stringify(exifData), 'utf8');
        exifHeader.writeUInt32LE(jsonBuffer.length, 14);
        const fullExif = Buffer.concat([exifHeader, jsonBuffer]);

        try {
          img.exif = fullExif;
          await img.save(finalWebp);
        } catch (errExif) {
          console.warn('⚠️ Falha ao aplicar EXIF:', errExif);
          fs.copyFileSync(tempWebp, finalWebp);
        }

        if (!fs.existsSync(finalWebp) || fs.statSync(finalWebp).size === 0)
          throw new Error('Figurinha criada está vazia');

        // 🔹 Envia figurinha final
        await sock.sendMessage(from, { sticker: fs.readFileSync(finalWebp) }, { quoted: Info });
        await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });

      } catch (stickerError) {
        console.error("Erro ao processar sticker:", stickerError);
        await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
        await sock.sendMessage(from, { text: "❌ Ocorreu um erro ao processar a figurinha." }, { quoted: Info });
      } finally {
        try {
          if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp);
          if (fs.existsSync(finalWebp)) fs.unlinkSync(finalWebp);
        } catch (cleanupError) {
          console.error("Erro na limpeza:", cleanupError);
        }
      }

    } catch (e) {
      console.error("Erro ao roubar figurinha:", e);
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      await sock.sendMessage(from, { text: "❌ Ocorreu um erro ao roubar a figurinha." }, { quoted: Info });
    }
  }
};