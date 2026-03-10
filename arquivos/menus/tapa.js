// ./arquivos/menus/tapa.js

module.exports = async (sock, from, Info) => {
  try {
    // Identificação do alvo (mencionado ou respondido)
    let mentioned = [];
    const ctx = Info.message?.extendedTextMessage?.contextInfo;
    
    if (ctx?.mentionedJid && ctx.mentionedJid.length > 0) {
      mentioned = ctx.mentionedJid;
    } else if (ctx?.participant) {
      mentioned = [ctx.participant];
    }

    if (mentioned.length === 0) {
      return sock.sendMessage(from, { 
        text: "❌ Marque a mensagem de alguém ou mencione com @ para dar um tapa!" 
      }, { quoted: Info });
    }

    const alvo = mentioned[0];
    const numeroAlvo = alvo.split("@")[0];
    
    const mensagem = `Você Acabou de da um tapa na raba da😏 @${numeroAlvo} 🔥`;
    const videoUrl = "https://chat.tedzinho.com.br/uploads2/vf9h1tvu6036.mp4";

    await sock.sendMessage(from, {
      video: { url: videoUrl },
      gifPlayback: true,
      caption: mensagem,
      mentions: [alvo]
    }, { quoted: Info });

  } catch (err) {
    console.error("❌ Erro no comando tapa:", err);
    await sock.sendMessage(from, { 
      text: "⚠️ Ocorreu um erro ao tentar dar um tapa! 😂" 
    }, { quoted: Info });
  }
};
