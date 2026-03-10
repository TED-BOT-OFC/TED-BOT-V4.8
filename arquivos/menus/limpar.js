// ./arquivos/menus/limpar.js
module.exports = async (sock, from, Info, prefix, BOT_PHONE, getVerificacao, config) => {
  try {
    // ❌ Apenas grupos
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, {
        text: "❌ Este comando só pode ser usado em grupos."
      }, { quoted: Info });
    }

    // 🔐 Sistema de verificação
    const {
      isSenderAdmin,
      isSenderOwner,
      isSenderDonoBot,
      isBotAdmin
    } = await getVerificacao(sock, from, Info, prefix, BOT_PHONE);

    // 👤 Permissão do usuário
    if (!isSenderAdmin && !isSenderOwner && !isSenderDonoBot) {
      return sock.sendMessage(from, {
        text: "🚫 Apenas administradores, dono do grupo ou dono do bot podem usar este comando."
      }, { quoted: Info });
    }

    // 🤖 Permissão do BOT
    if (!isBotAdmin) {
      return sock.sendMessage(from, {
        text: "⚠️ Eu preciso ser *administrador* do grupo para limpar o chat."
      }, { quoted: Info });
    }

    // 🧹 Reação
    await sock.sendMessage(from, {
      react: { text: "🧹", key: Info.key }
    });
    
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(1000);
    
    try {
      // 🧨 MENSAGEM GRANDONA IGUAL ORIGINAL
      const cleanMessage = {
        botInvokeMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadataVersion: 2,
              deviceListMetadata: {}
            },
            imageMessage: {
              // URL original que faz aparecer grande
              url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f1/m234/up-oil-image-e1bbfe2b-334b-4c5d-b716-d80edff29301?ccb=9-4&oh=01_Q5AaID0uZoxsi9v2I7KJZEgeJ7IVkFPZkt2yeYf6ps0IWG2g&oe=66E7130B&_nc_sid=000000&mms3=true",
              mimetype: "image/png",
              // TEXTO QUE APARECE GRANDE
              caption: `🧹 ${config.emoji || "🤖"} *LIMPO* ✅️`,
              // 🔥 ESTES VALORES FAZEM APARECER GRANDE:
              fileSha256: "YVuPx9PoIxL0Oc3xsUc3n3uhttmVYlqUV97LKKvIjL8=",
              fileLength: "999999999",
              height: 10000000000000000,        // 🔥 VALOR ENORME
              width: 99999999999999999999999,   // 🔥 VALOR ENORME
              mediaKey: "4T8WJKuKvJ9FXSwldCXe5+/IA7aYi5ycf301J0xIZwA=",
              fileEncSha256: "jfG3tesFLdqtCzO6cqU51HGGkEtd7+w22aJtaEm2yjE=",
              directPath: "/v/t62.7118-24/29631950_1467571294644184_4827066390759523804_n.enc?ccb=11-4&oh=01_Q5AaIFPK_QoDRMR4vZIBbMTdy6GreGhSA2HHRAIu0-vAMgqN&oe=66E72F5E&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1723839207",
              // Thumbnail em base64 simples
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
              scansSidecar: "il8IxPgrhGdtn37jGMVgQVRKlPd/CERE+Nr822DZe2UT9r0YT3KPSQ==",
              scanLengths: [5373, 24562, 15656, 22918],
              midQualityFileSha256: "s8Li+/zg2VmzMvJtRAZHPVres8nAPEWcd11nK5b/keY="
            }
          },
          expiration: 0,
          ephemeralSettingTimestamp: "1723838053",
          disappearingMode: {
            initiator: "CHANGED_IN_CHAT",
            trigger: "UNKNOWN",
            initiatedByMe: true
          }
        }
      };
      // Enviar mensagem grandona
      await sock.relayMessage(from, cleanMessage, {});
    } catch (error) {
      console.error("❌ Erro ao limpar chat:", error);
      
      // Fallback alternativo também grandão
      const fallbackMessage = {
        image: {
          url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f1/m234/up-oil-image-e1bbfe2b-334b-4c5d-b716-d80edff29301"
        },
        caption: `🧹 ${config.emoji || "🤖"} *LIMPO* ✅️`,
        mimetype: "image/png",
        fileLength: 999999999,
        height: 99999999,    // Valores grandes
        width: 99999999      // Valores grandes
      };
      
      await sock.sendMessage(from, fallbackMessage, { quoted: Info });
    }
  } catch (err) {
    console.error("❌ Erro no comando limpar:", err);
    await sock.sendMessage(from, { text: "❌ Ocorreu um erro ao tentar limpar o chat." }, { quoted: Info });
  }
};
