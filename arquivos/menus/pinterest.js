const axios = require('axios');
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

// ===========================
// 🗂️ CACHE DE IMAGENS PINTEREST
// ===========================
const pinCache = new Map();

module.exports = {
  name: 'pinterest',
  alias: ['pin'],
  description: 'Busca imagens do Pinterest em carrossel com botão de download',
  category: 'Mídia',
  pinCache,

  async execute(sock, from, Info, args, body, command, prefix) {

    const react = async (emoji) => {
      try {
        await sock.sendMessage(from, { react: { text: emoji, key: Info.key } });
      } catch {}
    };

    try {
      const query = args?.join(' ')?.trim();

      // 🔎 Se não digitar nada
      if (!query) {
        await react('⚠️');
        return sock.sendMessage(from, {
          text: `Ops… coloque um nome.\n\nExemplo:\n${prefix}pinterest gatos`
        }, { quoted: Info });
      }

      await react('⏳');

      const API_URL = `https://tedzinho.com.br/api/pesquisa/pinterest?apikey=J&query=${encodeURIComponent(query)}`;

      const { data } = await axios.get(API_URL, {
        timeout: 15000
      });

      if (!data?.resultado || data.resultado.length === 0) {
        await react('❌');
        return sock.sendMessage(from, {
          text: `Nenhum resultado encontrado para: ${query}`
        }, { quoted: Info });
      }

      const imagens = data.resultado.slice(0, 10);
      const cards = [];

      for (let i = 0; i < imagens.length; i++) {
        const img = imagens[i];
        const buttonId = `baixar_pin_${Date.now()}_${i}`;

        // Salva no cache
        pinCache.set(buttonId, {
          url: img.image,
          nome: img.fullname || query
        });

        // Remove do cache após 15 min
        setTimeout(() => pinCache.delete(buttonId), 15 * 60 * 1000);

        const media = await prepareWAMessageMedia(
          { image: { url: img.image } },
          { upload: sock.waUploadToServer }
        );

        cards.push({
          body: proto.Message.InteractiveMessage.Body.fromObject({
            text: `📌 Pinterest ${i + 1}\n🔎 ${query}\n👤 ${img.fullname || "Autor desconhecido"}`
          }),
          header: proto.Message.InteractiveMessage.Header.fromObject({
            title: "Resultado do Pinterest",
            hasMediaAttachment: true,
            imageMessage: media.imageMessage
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "🔗 Abrir no navegador",
                  url: img.source
                })
              },
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                  display_text: "📥 Baixar Imagem",
                  id: buttonId
                })
              }
            ]
          })
        });
      }

      const carouselMessage = generateWAMessageFromContent(from, {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: { text: `🖼️ Resultados para: ${query}` },
              carouselMessage: { cards },
              footer: { text: "Deslize para ver mais ➡️" }
            }
          }
        }
      }, { quoted: Info });

      await sock.relayMessage(from, carouselMessage.message, {
        messageId: carouselMessage.key.id
      });

      await react('✅');

    } catch (err) {
      console.error("Erro no comando pinterest:", err);
      await react('❌');
      await sock.sendMessage(from, {
        text: "Não foi possível buscar imagens agora. Tente novamente."
      }, { quoted: Info });
    }
  }
};