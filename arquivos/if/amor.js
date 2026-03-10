const fs = require('fs');
const axios = require('axios');
const { convertAudioToOgg } = require('./convertAudio'); // ajuste o caminho

async function enviarAudioAmor(from, sock, Info) {
  const timestamp = Date.now();
  const inputPath = `./temp_audio_${timestamp}.mp3`;
  const outputPath = `./temp_audio_${timestamp}.ogg`;
  const audioLink = "https://files.catbox.moe/4xpob7.mp3";

  try {
    // Baixar o áudio
    const { data } = await axios.get(audioLink, { responseType: "arraybuffer" });
    fs.writeFileSync(inputPath, Buffer.from(data));

    // Converter para OGG
    await convertAudioToOgg(inputPath, outputPath);

    // Ler o arquivo convertido
    const pttBuffer = fs.readFileSync(outputPath);

    // Enviar como áudio PTT
    await sock.sendMessage(from, {
      audio: pttBuffer,
      mimetype: "audio/ogg; codecs=opus",
      ptt: true
    }, { quoted: Info });

  } catch (e) {
    console.error("Erro ao enviar áudio de amor:", e);
  } finally {
    // Limpar arquivos temporários
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}

module.exports = { enviarAudioAmor };