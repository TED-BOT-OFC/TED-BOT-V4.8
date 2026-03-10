const axios = require('axios');

module.exports = async (sock, Info, NomeDoBot, API_KEY_TED, NickDono) => {
    try {
        // Cooldown simples (2s)
        if (!global.attpCooldown) global.attpCooldown = new Map();

        const reply = (t) =>
            sock.sendMessage(Info.key.remoteJid, { text: t }, { quoted: Info });

        const sender = Info.key?.participant || Info.key?.remoteJid;
        const now = Date.now();

        const last = global.attpCooldown.get(sender) || 0;
        if (now - last < 2000) {
            return reply("⏳ Aguarde um pouco antes de usar novamente.");
        }
        global.attpCooldown.set(sender, now);

        const body =
            Info.body ||
            Info.message?.conversation ||
            Info.message?.extendedTextMessage?.text ||
            "";

        const q = body.split(/ +/).slice(1).join(" ");
        if (!q) return reply("Exemplo: *.attp Oi*");

        reply(`🎨 Gerando figurinha animada...`);

        // 🔥 API DA CAKE / SYSTEMZONE
        const { data } = await axios.get(
            `https://systemzone.store/canvas/attp?text=${encodeURIComponent(q)}`
        );

        if (!data.status || !data.imagem) {
            return reply("⚠️ Erro ao gerar a figurinha.");
        }

        // ✅ ENVIO DIRETO POR URL (MÉTODO ESTÁVEL)
        await sock.sendMessage(
            Info.key.remoteJid,
            { sticker: { url: data.imagem } },
            { quoted: Info }
        );

    } catch (e) {
        console.error("Erro no ATTp:", e);
        sock.sendMessage(
            Info.key.remoteJid,
            { text: "⚠️ Erro na API de figurinha." },
            { quoted: Info }
        );
    }
};