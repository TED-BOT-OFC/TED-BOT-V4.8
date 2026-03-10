const axios = require("axios");

function decodeHtml(text) {
  const map = {
    "&oacute;": "ó",
    "&atilde;": "ã",
    "&ccedil;": "ç",
    "&eacute;": "é",
    "&iacute;": "í",
    "&nbsp;": " "
  };

  for (const k in map) {
    text = text.replace(new RegExp(k, "g"), map[k]);
  }

  return text;
}

/**
 * Comando: #robloxcodes
 * Função: Buscar códigos de jogos do Roblox no Eurogamer.
 */
async function robloxCodesCommand(sock, from, args, Info) {
  const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: Info });

  if (!args[0]) {
    return reply(
      "🎮 *CÓDIGOS ROBLOX*\n\n" +
      "Use:\n" +
      "#robloxcodes blox fruits\n" +
      "#robloxcodes dragon ball rage"
    );
  }

  try {
    await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

    const jogo = args.join(" ").toLowerCase();
    const slug = jogo
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "-");

    const url = `https://www.eurogamer.pt/roblox-codigos-${slug}`;

    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://www.google.com/"
      }
    });

    const html = res.data;

    /* pegar imagem */
    const imgMatch = html.match(/property="og:image"\s*content="([^"]+)"/);
    const imagem = imgMatch ? imgMatch[1].replace(/&amp;/g, "&") : null;

    /* pegar códigos */
    const regex = /<li><strong>([^<]+)<\/strong>:\s*([^<]+)/g;

    let match;
    let codes = [];

    while ((match = regex.exec(html)) !== null) {
      const code = match[1].trim();
      const reward = decodeHtml(match[2].trim());
      codes.push(`🎁 ${code} - ${reward}`);
    }

    if (!codes.length) {
      await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      return reply("❌ Não encontrei códigos para esse jogo.");
    }

    let texto = "🎮 *CÓDIGOS ROBLOX*\n" + `🎯 *Jogo:* ${jogo}\n\n`;
    texto += codes.slice(0, 20).join("\n");

    /* enviar com imagem */
    if (imagem) {
      await sock.sendMessage(from, {
        image: { url: imagem },
        caption: texto
      }, { quoted: Info });
    } else {
      await sock.sendMessage(from, { text: texto }, { quoted: Info });
    }

    await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });

  } catch (e) {
    console.error("Erro robloxcodes:", e.message);
    await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
    reply("❌ Não consegui buscar os códigos.");
  }
}

module.exports = robloxCodesCommand;
