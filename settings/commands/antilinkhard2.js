// 📁 settings/commands/antilinkhard2.js
module.exports = {
  name: "antilinkhard2",
  alias: ["antilink2"],
  description: "Anti-link que permite apenas links de Instagram, YouTube, TikTok e Kwai",
  category: "Grupos",

  async execute(sock, from, msg, args, command, prefix, BOT_PHONE) {
    try {
      const { getVerificacao } = require("../../database/sistema/verificador.js");
      const AntiLinkManager2 = require("../../database/sistema/antilinkManager2.js");
      const antiLinkManager2 = new AntiLinkManager2();

      const { isSenderAdmin, isSenderOwner, isSenderDonoBot } =
        await getVerificacao(sock, from, msg, prefix, BOT_PHONE);

      if (!isSenderAdmin && !isSenderOwner && !isSenderDonoBot) {
        return sock.sendMessage(from, {
          text: "❌ Apenas administradores, dono do grupo ou dono do bot podem alterar o AntiLinkHard2."
        }, { quoted: msg });
      }

      const option = args[0]?.toLowerCase();

      if (option === 'on' || option === 'ativar') {
        antiLinkManager2.enable(from);
        return sock.sendMessage(from, {
          text:
            '✅ *AntiLinkHard2* ativado!\n\n' +
            '🔗 Permitidos: Instagram, YouTube, TikTok, Kwai\n' +
            '🚫 Outros links serão removidos automaticamente.'
        }, { quoted: msg });

      } else if (option === 'off' || option === 'desativar') {
        antiLinkManager2.disable(from);
        return sock.sendMessage(from, {
          text: '❌ *AntiLinkHard2* desativado neste grupo.'
        }, { quoted: msg });

      } else {
        const status = antiLinkManager2.isEnabled(from) ? '🟢 ATIVADO' : '🔴 DESATIVADO';
        return sock.sendMessage(from, {
          text:
            `📡 *Status do AntiLinkHard2:* ${status}\n\n` +
            `${prefix}antilink2 on\n${prefix}antilink2 off`
        }, { quoted: msg });
      }

    } catch (err) {
      console.error('Erro no comando antilinkhard2:', err);
      await sock.sendMessage(from, {
        text: '❌ Erro ao alterar o AntiLinkHard2.'
      }, { quoted: msg });
    }
  }
};