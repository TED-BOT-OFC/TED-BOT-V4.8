const axios = require("axios");
const { API_KEY_TED } = require("../../settings/config.json");

/**
 * Comando: #gif
 * Função: Buscar e enviar um GIF animado via API TEDZINHO.
 */
async function gifCommand(sock, from, args, Info) {
  const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: Info });

  try {
    const query = args.join(" ").trim();

    if (!query) {
      return reply(`❌ Por favor, digite o termo de busca para o GIF.\n\n*Exemplo:*\n#gif goku`);
    }

    // Reação de carregamento
    await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

    const apiUrl = `https://tedzinho.com.br/api/search/gif?apikey=${API_KEY_TED}&query=${encodeURIComponent(query)}`;
    
    const response = await axios.get(apiUrl).then(r => r.data).catch(() => null);

    if (!response || response.status !== "OK" || !response.resultado || !response.resultado.resultado || !response.resultado.resultado.url) {
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      return reply("⚠️ Não consegui encontrar nenhum GIF para esse termo. Tente outro.");
    }

    const gifUrl = response.resultado.resultado.url;

    // Baixar o buffer do GIF (que na verdade é um MP4 curto na maioria das APIs de GIF)
    const buffer = await axios.get(gifUrl, { responseType: "arraybuffer" }).then(r => r.data).catch(() => null);

    if (!buffer) {
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      return reply("❌ Falha ao baixar o GIF. Tente novamente mais tarde.");
    }

    // Enviar como vídeo com a flag gifPlayback para que ele se comporte como um GIF no WhatsApp
    await sock.sendMessage(from, {
      video: buffer,
      mimetype: "video/mp4",
      gifPlayback: true,
      caption: `🎬 *GIF:* ${query}`
    }, { quoted: Info });

    await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });

  } catch (e) {
    console.error("❌ Erro no comando #gif:", e);
    await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
    await sock.sendMessage(from, { text: "❌ Ocorreu um erro ao buscar o GIF." }, { quoted: Info });
  }
}

module.exports = gifCommand;
