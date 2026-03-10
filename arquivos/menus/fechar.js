const { getVerificacao } = require("../../database/sistema/verificador");

module.exports = async function gpCommand(sock, from, Info, prefix, BOT_PHONE, args) {
  try {
    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, { text: "❌ Este comando só funciona em grupos." }, { quoted: Info });
    }

    if (!args[0]) {
      return sock.sendMessage(from, { 
        text: `❌ Uso incorreto!\n\n💡 Utilize:\n• *${prefix}gp a* para abrir o grupo\n• *${prefix}gp f* para fechar o grupo` 
      }, { quoted: Info });
    }

    const metadata = await sock.groupMetadata(from);
    const userId = Info.key.participant || Info.key.remoteJid;
    const isAdmin = metadata.participants.find(p => p.id === userId)?.admin;

    if (!isAdmin) {
      return sock.sendMessage(from, { text: "❌ Apenas administradores podem usar este comando!" }, { quoted: Info });
    }

    const { isBotAdmin } = await getVerificacao(sock, from, Info, prefix, BOT_PHONE);
    if (!isBotAdmin) {
      return sock.sendMessage(from, { text: "🤖 Preciso ser administrador para fazer isso!" }, { quoted: Info });
    }

    const option = args[0].toLowerCase();

    if (option === 'a') {
      // Abrir grupo
      await sock.sendMessage(from, { react: { text: "🔓", key: Info.key } });
      await sock.groupSettingUpdate(from, 'not_announcement');
      await sock.sendMessage(from, {
        text: "✅ *O grupo foi ABERTO!*\nTodos os participantes podem enviar mensagens agora."
      }, { quoted: Info });
    } 
    else if (option === 'f') {
      // Fechar grupo
      await sock.sendMessage(from, { react: { text: "🔒", key: Info.key } });
      await sock.groupSettingUpdate(from, 'announcement');
      await sock.sendMessage(from, {
        text: "✅ *O grupo foi FECHADO!*\nApenas administradores podem enviar mensagens."
      }, { quoted: Info });
    }
    else {
      return sock.sendMessage(from, { 
        text: `❌ Opção inválida!\n\n💡 Utilize:\n• *${prefix}gp a* para abrir o grupo\n• *${prefix}gp f* para fechar o grupo`
      }, { quoted: Info });
    }

  } catch (error) {
    console.error("Erro no comando gp:", error);
    await sock.sendMessage(from, { text: "❌ Ocorreu um erro ao executar este comando." }, { quoted: Info });
  }
}