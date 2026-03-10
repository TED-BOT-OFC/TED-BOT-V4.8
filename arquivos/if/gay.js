
const axios = require("axios");

async function enviarAudioGay(from, sock, Info) {
  const audioLink = "https://tedzinho.com.br/upload/qibbBy.mp3"; // troque pelo seu link

  try {
    // Mostra o status "digitando..."
    await sock.sendPresenceUpdate("composing", from);

    // Aguarda um tempo antes de enviar (para parecer natural)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mostra o status "gravando áudio..."
    await sock.sendPresenceUpdate("recording", from);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Baixa o áudio diretamente como buffer
    const { data } = await axios.get(audioLink, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(data);

    // Envia o áudio como mensagem de voz (PTT)
    await sock.sendMessage(from, {
      audio: audioBuffer,
      mimetype: "audio/mpeg",
      ptt: true
    }, { quoted: Info });

    // Retorna ao status normal
    await sock.sendPresenceUpdate("available", from);

  } catch (e) {
    console.error("Erro ao enviar áudio gay:", e);
    await sock.sendPresenceUpdate("available", from);
  }
}

module.exports = { enviarAudioGay };