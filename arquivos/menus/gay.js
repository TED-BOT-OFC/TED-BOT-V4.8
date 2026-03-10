const GAY_IMAGE_URL = "https://files.catbox.moe/6z8xwy.jpg";

function getGayPhrase(p) {
    if (p === 0) return "🌈 ZERO GAY! Macho alfa absoluto 😎";
    if (p <= 20) return "🏳️‍🌈 Quase nada… só amizade colorida 😉";
    if (p <= 40) return "🏳️‍🌈 Suspeito em dias alternados 👀";
    if (p <= 60) return "🏳️‍🌈 Meio termo… crocs detectado 💅";
    if (p <= 80) return "🏳️‍🌈 Forte presença arco-íris ✨";
    if (p < 100) return "🏳️‍🌈 Termômetro quase explodindo 🦄";
    return "👑 100% GAY! ÍCONE SUPREMO 💃✨";
}

async function gayCommand(sock, Info, from, args, prefix, sasah) {
    try {
        // ⚡ reação imediata (feedback visual)
        sock.sendMessage(from, {
            react: { text: "🏳️‍🌈", key: Info.key }
        }).catch(() => {});

        const sender =
            Info.key.participant ||
            Info.key.remoteJid;

        const ctx = Info.message?.extendedTextMessage?.contextInfo;

        // 🎯 alvo
        let target =
            ctx?.mentionedJid?.[0] ||
            ctx?.participant ||
            sender;

        // 🔁 força JID real (mata o LID)
        if (!target.endsWith("@s.whatsapp.net")) {
            const num = target.replace(/\D/g, "");
            target = num + "@s.whatsapp.net";
        }

        // 🤖 evita marcar o bot
        const botNum = sock.user.id.split(":")[0];
        if (target.includes(botNum)) target = sender;

        // 🧠 nome legível (texto apenas)
        let nomeAlvo = "Você";
        if (from.endsWith("@g.us")) {
            try {
                const meta = await sock.groupMetadata(from);
                const membro = meta.participants.find(p => p.id === target);
                nomeAlvo =
                    membro?.notify ||
                    membro?.name ||
                    `@${target.split("@")[0]}`;
            } catch {
                nomeAlvo = `@${target.split("@")[0]}`;
            }
        }

        const porcentagem = Math.floor(Math.random() * 101);

        await sock.sendMessage(from, {
            image: { url: GAY_IMAGE_URL },
            caption: `
🏳️‍🌈 *Medidor de Gay — TED BOT* 🏳️‍🌈

👤 *Alvo:* ${nomeAlvo}
📊 *Nível:* ${porcentagem}%

📝 *Diagnóstico:*
${getGayPhrase(porcentagem)}
`,
            mentions: [target]
        }, { quoted: sasah });

    } catch (err) {
        console.error("Erro gay:", err);
        await sock.sendMessage(from, {
            text: "❌ Erro ao executar o comando."
        }, { quoted: sasah });
    }
}

module.exports = gayCommand;