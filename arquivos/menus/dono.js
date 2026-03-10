// arquivos/menus/dono.js

module.exports = async function donoMenu({
    sock,
    Info,
    from
}) {
    try {

        // ===== IDENTIFICAÇÃO =====
        const sender =
            Info.key?.participant ||
            Info.key?.remoteJid ||
            "";

        const numero =
            sender?.split("@")[0] || "Desconhecido";

        const nome =
            Info.pushName || "Desconhecido";

        // ===== GRUPO =====
        let cargo = "Membro";
        let grupoId = from;
        let grupoNome = "Privado";

        if (from.endsWith("@g.us")) {

            const meta =
                await sock.groupMetadata(from);

            grupoNome =
                meta.subject || "Grupo";

            const participante =
                meta.participants.find(
                    p => p.id === sender
                );

            if (participante?.admin === "admin")
                cargo = "Admin";

            if (participante?.admin === "superadmin")
                cargo = "Dono do grupo";
        }

        // ===== STATUS =====
        let statusTexto = "Não disponível";
        let statusData = "";

        try {

            const status =
                await sock.fetchStatus(sender);

            if (status?.[0]) {

                statusTexto =
                    status[0].status || "(vazio)";

                statusData =
                    status[0].setAt
                        ? new Date(
                              status[0].setAt
                          ).toLocaleString()
                        : "";
            }

        } catch {}

        // ===== FOTO =====
        let foto = null;

        try {

            foto =
                await sock.profilePictureUrl(
                    sender,
                    "image"
                );

        } catch {}

        // ===== BOT =====
        const botNome =
            sock.user?.name || "Bot";

        const botId =
            sock.user?.id || "—";

        // ===== EVENTO =====
        const msgId =
            Info.key?.id || "Desconhecido";

        const timestamp =
            Info.messageTimestamp
                ? new Date(
                      Info.messageTimestamp * 1000
                  ).toLocaleString()
                : "";

        // ===== RELATÓRIO =====
        const painel = `
╔══════════════╗
║     👤 USER INFO        ║
╚══════════════╝

🪪 IDENTIDADE
━━━━━━━━━━━━━━━━
• Nome: ${nome}
• ID: ${sender}
• Número: ${numero}

👥 GRUPO
━━━━━━━━━━━━━━━━
• Nome: ${grupoNome}
• Cargo: ${cargo}
• ID: ${grupoId}

📨 EVENTO
━━━━━━━━━━━━━━━━
• Msg ID: ${msgId}
• Horário: ${timestamp}

📱 CONTA
━━━━━━━━━━━━━━━━
• Nome: ${botNome}
• ID: ${botId}

══════════════════════
🔍 Diagnóstico completo
══════════════════════
`;

        // ===== ENVIO =====
        if (foto) {

            await sock.sendMessage(
                from,
                {
                    image: { url: foto },
                    caption: painel
                },
                { quoted: Info }
            );

        } else {

            await sock.sendMessage(
                from,
                { text: painel },
                { quoted: Info }
            );
        }

    } catch (err) {

        await sock.sendMessage(
            from,
            {
                text:
                    "❌ Erro ao gerar relatório:\n" +
                    err.message
            },
            { quoted: Info }
        );
    }
};