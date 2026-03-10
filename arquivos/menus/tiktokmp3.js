// CASE TIKTOK MP3 (VÍDEO → ÁUDIO)
// Baixa o vídeo, converte para MP3, envia e apaga os arquivos

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

module.exports = async function caseTikTokMp3({
  sock,
  from,
  args,
  sasah,
  prefix
}) {
  const reply = (txt) => {
    return sock.sendMessage(from, { text: txt }, { quoted: sasah });
  };

  const tempDir = './temp';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  try {
    const url = args[0];
    if (!url) {
      return reply(`❌ Informe o link do TikTok.\nExemplo: ${prefix}ttkmp3 https://vm.tiktok.com/...`);
    }

    // 🔹 API TikWM
    const tikwm = await axios.post(
      'https://www.tikwm.com/api/',
      { url, web: 1 },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const res = tikwm.data;
    if (res.code !== 0 || !res.data) {
      return reply('⚠️ Não foi possível obter o vídeo.');
    }

    const data = res.data;
    const videoUrl = `https://www.tikwm.com${data.play}`;

    const videoPath = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
    const audioPath = videoPath.replace('.mp4', '.mp3');

    // 🔹 Baixar vídeo
    const videoBuffer = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }).then(r => Buffer.from(r.data));

    fs.writeFileSync(videoPath, videoBuffer);

    // 🔹 Converter MP4 → MP3
    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -y -i "${videoPath}" -vn -ab 128k -ar 44100 -f mp3 "${audioPath}"`,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    if (!fs.existsSync(audioPath)) {
      throw new Error('Falha ao converter o áudio.');
    }

    // 🔹 Enviar áudio
    await sock.sendMessage(
      from,
      {
        audio: fs.readFileSync(audioPath),
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${data.music_info?.title || 'tiktok'}.mp3`,
        caption:
          `🎵 *Áudio TikTok*\n` +
          `👤 Autor: ${data.author.nickname}\n` +
          `🎶 Música: ${data.music_info?.title || 'Desconhecida'}`
      },
      { quoted: sasah }
    );

    // 🔹 Limpeza
    fs.unlinkSync(videoPath);
    fs.unlinkSync(audioPath);

  } catch (e) {
    console.error('Erro TikTok MP3:', e);
    await reply(`❌ Erro ao processar o áudio.\nMotivo: ${e.message}`);
  }
};