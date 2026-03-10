// ./arquivos/menus/welcome.js
const { getWelcomeConfig, setWelcomeStatus, setWelcomeCaption, setLeaveCaption } = require('../../database/sistema/welcomeManager');

module.exports = async function handleWelcomeCommand(sock, Info, from, args, prefix, groupState, groupManager, logger, getPermissions, BOT_PHONE, sasah) {
  try {
    const isGroup = from.endsWith("@g.us");

    if (!isGroup) {
      return sock.sendMessage(from, { text: "❌ Só funciona em grupos." }, { quoted: sasah });
    }

    const perms = await getPermissions(sock, from, Info.key.participant, BOT_PHONE);
    if (!perms.isAdmin && !perms.isOwnerGroup) {
      return sock.sendMessage(from, { text: "❌ Apenas administradores podem usar este comando." }, { quoted: sasah });
    }

    const opt = (args[0] || "").toLowerCase();
    const config = getWelcomeConfig(from);

    if (opt === "on" || opt === "off") {
      const status = opt === "on";
      setWelcomeStatus(from, status);

      return sock.sendMessage(from, { 
        text: `🎉 Sistema de boas-vindas do grupo ${status ? "✅ ATIVADO" : "❌ DESATIVADO"}`
      }, { quoted: sasah });
    }

    if (opt === "legenda" || opt === "caption") {
      const newCaption = args.slice(1).join(" ");
      if (!newCaption) {
        return sock.sendMessage(from, { 
          text: `💡 *Como usar:* ${prefix}welcome legenda Sua mensagem de boas-vindas\n\n*Variáveis:*\n@user - Menciona o usuário\n#group - Nome do grupo`
        }, { quoted: sasah });
      }
      setWelcomeCaption(from, newCaption);
      return sock.sendMessage(from, { text: "✅ Legenda de boas-vindas atualizada com sucesso!" }, { quoted: sasah });
    }

    if (opt === "saiu" || opt === "leave") {
      const newCaption = args.slice(1).join(" ");
      if (!newCaption) {
        return sock.sendMessage(from, { 
          text: `💡 *Como usar:* ${prefix}welcome saiu Sua mensagem de saída\n\n*Variáveis:*\n@user - Menciona o usuário\n#group - Nome do grupo`
        }, { quoted: sasah });
      }
      setLeaveCaption(from, newCaption);
      return sock.sendMessage(from, { text: "✅ Legenda de saída atualizada com sucesso!" }, { quoted: sasah });
    }

    if (opt === "status") {
      return sock.sendMessage(from, {
        text: `🎚️ *Status das Boas-vindas:*\n\n• *Status:* ${config.enabled ? "✅ ON" : "❌ OFF"}\n\n• *Legenda Boas-vindas:* \n${config.caption}\n\n• *Legenda Saída:* \n${config.leaveCaption}`
      }, { quoted: sasah });
    }

    if (opt === "test") {
      const sender = Info.key.participant || Info.key.remoteJid;
      const senderNumber = String(sender).split("@")[0];
      const metadata = await sock.groupMetadata(from).catch(() => ({ subject: "Grupo" }));
      const groupName = metadata.subject;

      const welcomeMsg = config.caption
        .replace(/@user/g, `@${senderNumber}`)
        .replace(/#group/g, groupName);

      const ppUser = await sock.profilePictureUrl(sender, "image").catch(() => null);
      const ppGroup = await sock.profilePictureUrl(from, "image").catch(() => null);
      const thumb = ppUser || ppGroup || "https://files.catbox.moe/of4o0a.jpg";

      return sock.sendMessage(from, {
        text: welcomeMsg,
        mentions: [sender],
        contextInfo: {
          mentionedJid: [sender],
          externalAdReply: {
            title: "👋 Teste de Boas-vindas",
            body: `${senderNumber}@s.whatsapp.net`,
            mediaType: 1,
            renderLargerThumbnail: true,
            thumbnailUrl: thumb,
            sourceUrl: ""
          }
        }
      }, { quoted: sasah });
    }

    return sock.sendMessage(from, { 
      text: `⚙️ *Configurar Boas-vindas*\n\n• ${prefix}welcome on/off\n• ${prefix}welcome legenda <texto>\n• ${prefix}welcome saiu <texto>\n• ${prefix}welcome status\n• ${prefix}welcome test\n\n*Variáveis:* @user, #group`
    }, { quoted: sasah });

  } catch (err) {
    console.error("❌ Erro no comando 'welcome':", err);
    return sock.sendMessage(from, { text: "⚠️ Ocorreu um erro ao executar o comando." }, { quoted: sasah });
  }
};
