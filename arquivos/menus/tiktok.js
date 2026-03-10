// CASE TIKTOK / TTKMP4
// Arquivo otimizado para Hospedagem - Usando exclusivamente API TikWM (Alta Velocidade)

const fs = require('fs');
const axios = require('axios');

const SESSION_PATH = './session';

function isFatalSessionError(err) {
  const msg = String(err);
  return (
    msg.includes('Over 2000 messages') ||
    msg.includes('Failed to decrypt message') ||
    msg.includes('SessionError') ||
    msg.includes('fillMessageKeys') ||
    msg.includes('maybeStepRatchet')
  );
}

function resetSessionAndRestart() {
  try {
    if (fs.existsSync(SESSION_PATH)) {
      fs.rmSync(SESSION_PATH, { recursive: true, force: true });
    }
  } catch {}
  process.exit(1);
}

module.exports = async function caseTikTok({
  sock,
  from,
  args,
  sasah,
  prefix
}) {
  const reply = (txt) => {
    return sock.sendMessage(from, { text: txt }, { quoted: sasah });
  };

  try {
    const url = args[0];
    if (!url) {
      return reply(`❌ Informe o link do TikTok.\nExemplo: ${prefix}ttk https://vm.tiktok.com/...`);
    }

    // Chamada direta para a API TikWM (Mais rápida e estável para hospedagens)
    const tikwm = await axios.post('https://www.tikwm.com/api/', {
        url: url,
        count: 12,
        cursor: 0,
        web: 1
    }, {
        timeout: 30000,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    const res = tikwm.data;
    if (res.code !== 0 || !res.data) {
        return reply('⚠️ Não foi possível encontrar o vídeo. Verifique se o link está correto.');
    }

    const videoData = res.data;
    const videoUrl = `https://www.tikwm.com${videoData.play}`;
    
    // Download do buffer do vídeo
    const videoBuffer = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    }).then(res => Buffer.from(res.data));

    if (!videoBuffer || videoBuffer.length < 100) {
        throw new Error('Falha ao baixar o arquivo de vídeo.');
    }

    // Envio do vídeo
    await sock.sendMessage(from, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        fileName: `tiktok.mp4`,
        caption: `🎬 *Vídeo TikTok*\n👤 Autor: ${videoData.author.nickname}\n📝 ${videoData.title || 'Sem descrição'}`
    }, { quoted: sasah });

  } catch (e) {
    console.error('Erro TikTok:', e.message);
    
    if (isFatalSessionError(e)) {
      await reply('⚠️ Sessão do WhatsApp corrompida.\n🔄 Reiniciando conexão...');
      resetSessionAndRestart();
      return;
    }

    await reply(`❌ Erro ao processar o vídeo do TikTok.\nMotivo: ${e.message}`);
  }
};
