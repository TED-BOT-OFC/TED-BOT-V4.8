// ./arquivos/menus/foda.js

module.exports = async (sock, from, Info, isGroup) => {
  try {
    if (!isGroup) {
      return sock.sendMessage(from, { text: 'Este comando só pode ser usado em grupos.' }, { quoted: Info });
    }

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
        text: "❌ Marque a mensagem de alguém ou mencione com @ para fazer sexo com a pessoa!" 
      }, { quoted: Info });
    }

    const alvo = mentioned[0];
    const numeroAlvo = alvo.split("@")[0];
    const pushname = Info.pushName || "Usuário";

    // Mensagem inicial
    await sock.sendMessage(from, { 
      text: `Você acabou de fazer sexo com(a) @${numeroAlvo} 🥵\n\nAguarde enquanto calculamos a chance...`,
      mentions: [alvo]
    }, { quoted: Info });

    // Atrasar o envio do GIF e das porcentagens
    setTimeout(async () => {
      const randomChance = Math.floor(Math.random() * 100);  // Geração de porcentagem aleatória para ejaculação
      const randomPregnancyChance = Math.floor(Math.random() * 50);  // Geração de chance de gravidez

      // Enviar GIF com o cálculo das chances
      await sock.sendMessage(from, {
        video: { url: "https://files.catbox.moe/8dt8w7.mp4" },  // Link para o vídeo GIF
        caption: `> *[👤] Olá,@${pushname}*

> Você Acabou de fazer sexo com(a) @${numeroAlvo} 🥵


> *[💦] Chance de você ter ejaculado dentro:* _${randomChance}%_\n\n

> *[🤱] Possíveis chances do @${numeroAlvo} ter engravidado é:** _${randomPregnancyChance}%_`,
        gifPlayback: true,
        mentions: [alvo]
      });
    }, 7000);

  } catch (err) {
    console.error("❌ Erro no comando foda:", err);
    await sock.sendMessage(from, { 
      text: "⚠️ Ocorreu um erro ao tentar processar o comando!" 
    }, { quoted: Info });
  }
};
