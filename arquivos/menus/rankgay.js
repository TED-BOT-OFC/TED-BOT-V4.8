// ./arquivos/menus/rankgayCarrossel.js

const axios = require("axios");
const {
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  proto
} = require("@whiskeysockets/baileys");

module.exports = async function rankgayCarrosselCommand(sock, from, Info) {
  try {
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, {
        text: "❌ Este comando só pode ser usado em grupos."
      }, { quoted: Info });
    }

    const metadata = await sock.groupMetadata(from);
    const participants = metadata.participants;

    if (!participants || participants.length === 0) {
      return sock.sendMessage(from, {
        text: "❌ Não consegui encontrar membros neste grupo."
      }, { quoted: Info });
    }

    const embaralhar = arr => arr.sort(() => Math.random() - 0.5);
    const participantesAleatorios = embaralhar(participants).slice(0, 5);

    // Primeiro: Enviar o ranking em texto mencionando todos
    let textoRanking = `🏳️‍🌈 *RANKING GAY 2025 - TOP 5* 🏳️‍🌈\n\n`;
    
    const titulos = [
      "👑 *GAY SUPREMO*",
      "🌈 *GAY DE OURO*", 
      "💅 *GAY BRILHANTE*",
      "🩷 *GAY FASHION*",
      "🫦 *GAY RECRUTA*"
    ];
    
    const porcentagens = [100, 89, 76, 61, 47];
    const emojis = ["👑", "🥈", "🥉", "💎", "⭐"];
    
    const mencoesTextuais = [];
    
    for (let i = 0; i < participantesAleatorios.length; i++) {
      const p = participantesAleatorios[i];
      const numero = p.id.split("@")[0];
      const nome = p.notify || `@${numero}`;
      
      textoRanking += `${emojis[i]} ${titulos[i]}\n`;
      textoRanking += `👤 ${nome}\n`;
      textoRanking += `📊 ${porcentagens[i]}% de energia gay\n`;
      textoRanking += `➖➖➖➖➖➖➖➖➖\n`;
      
      mencoesTextuais.push(p.id);
    }
    
    textoRanking += `\n🎉 *Parabéns aos classificados!* Confiram os comprovantes visuais abaixo 👇`;

    // Enviar primeiro o ranking em texto
    await sock.sendMessage(from, {
      text: textoRanking,
      mentions: mencoesTextuais
    }, { quoted: Info });

    // Segundo: Preparar e enviar o carrossel com imagens
    const query = "homem gay estilo fashion";
    const API_URL = `https://tedzinho.com.br/api/pesquisa/pinterest?apikey=J&query=${encodeURIComponent(query)}`;
    const res = await axios.get(API_URL);
    const imagens = res.data?.resultado || [];

    if (imagens.length < 5) {
      return sock.sendMessage(from, {
        text: "⚠️ Não foi possível carregar imagens suficientes do Pinterest para o carrossel."
      }, { quoted: Info });
    }

    const cards = [];
    const frasesExtras = [
      "💋 Disse que era brincadeira, mas gostou do beijo",
      "👠 Tem mais roupa colorida que a bandeira LGBTQIA+",
      "🎤 Canta Gloria Groove no chuveiro com emoção",
      "💅 Sabe mais de maquiagem que a própria namorada", 
      "🕺 Rebola até em música de elevador!"
    ];

    const coresTitulos = ["#FFD700", "#C0C0C0", "#CD7F32", "#FF69B4", "#9370DB"];

    for (let i = 0; i < participantesAleatorios.length; i++) {
      const p = participantesAleatorios[i];
      const numero = p.id.split("@")[0];
      const nome = p.notify || `Usuario${i+1}`;

      const media = await prepareWAMessageMedia(
        { image: { url: imagens[i].image } },
        { upload: sock.waUploadToServer }
      );

      const card = {
        body: proto.Message.InteractiveMessage.Body.fromObject({
          text: `🎖️ *${titulos[i]}*\n\n👤 *Participante:* ${nome}\n📊 *Índice Gay:* ${porcentagens[i]}%\n💫 *Curiosidade:* ${frasesExtras[i]}\n\n🏳️‍🌈 *Certificado Oficial 2025*`
        }),
        header: proto.Message.InteractiveMessage.Header.fromObject({
          title: `🎯 Posição ${i+1}º - ${porcentagens[i]}%`,
          hasMediaAttachment: true,
          imageMessage: media.imageMessage
        }),
        footer: proto.Message.InteractiveMessage.Footer.fromObject({
          text: `✨ Deslize para ver o próximo`
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          buttons: [
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "📌 Ver no Pinterest",
                url: imagens[i].source
              })
            }
          ]
        })
      };

      cards.push(card);
    }

    const mainMessage = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text: `🏳️‍🌈 *COMPROVANTES VISUAIS DO RANKING GAY* 🏳️‍🌈\n\n📸 Imagens representativas de cada classificação\n💫 Deslize para conferir todos os top 5!`
            },
            carouselMessage: { cards },
            footer: { 
              text: "🎊 Ranking Oficial 2025 • Powered by Pinterest" 
            }
          }
        }
      }
    };

    const carouselMessage = generateWAMessageFromContent(from, mainMessage, {
      quoted: Info
    });

    await sock.relayMessage(from, carouselMessage.message, {
      messageId: carouselMessage.key.id
    });

  } catch (err) {
    console.error("❌ Erro no comando rankgayCarrossel:", err);
    await sock.sendMessage(from, {
      text: "⚠️ Ocorreu um erro ao montar o carrossel do ranking 😂"
    }, { quoted: Info });
  }
};