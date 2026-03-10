const { loadConfig, saveConfig } = require("../../database/sistema/schedulerManager");
const { getVerificacao } = require("../../database/sistema/verificador");

module.exports = async function schedulerCommand(sock, from, Info, prefix, BOT_PHONE, args) {
  try {
    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, { text: "❌ Este comando só pode ser usado em grupos!" }, { quoted: Info });
    }

    // Usa o sistema de verificação oficial do bot
    const { isSenderDonoBot, isSenderAdmin, isSenderOwner } = await getVerificacao(sock, from, Info, prefix, BOT_PHONE);

    // Verificação extra de segurança para o dono do bot via config
    const { numerodono } = require("../../settings/config.json");
    const sender = Info.key.participant || Info.key.remoteJid || Info.participant || from;
    const senderNumber = sender.split('@')[0].replace(/[^0-9]/g, "");
    const donoNumeroLimpo = numerodono.replace(/[^0-9]/g, "");
    const isRealDono = isSenderDonoBot || senderNumber === donoNumeroLimpo || donoNumeroLimpo.endsWith(senderNumber) || senderNumber.endsWith(donoNumeroLimpo);

    // Se não for Dono nem Admin do Grupo, bloqueia
    if (!isRealDono && !isSenderAdmin && !isSenderOwner) {
      return sock.sendMessage(from, { 
        text: "❌ Apenas o dono do bot ou administradores do grupo podem configurar o agendamento!" 
      }, { quoted: Info });
    }

    const allConfigs = loadConfig();
    const groupConfig = allConfigs[from] || { enabled: false, closeTime: "19:00", openTime: "20:00" };

    if (!args[0]) {
      return sock.sendMessage(from, { 
        text: `⏰ *AGENDAMENTO DESTE GRUPO*\n\n` +
              `• *Status:* ${groupConfig.enabled ? "✅ Ativado" : "❌ Desativado"}\n` +
              `• *Horário Fechar:* ${groupConfig.closeTime}\n` +
              `• *Horário Abrir:* ${groupConfig.openTime}\n\n` +
              `💡 *Comando Único:* \n` +
              `• ${prefix}tempo-pg HH:MM/HH:MM\n` +
              `Exemplo: ${prefix}tempo-pg 19:00/20:00\n\n` +
              `• ${prefix}tempo-pg off (Para desativar neste grupo)`
      }, { quoted: Info });
    }

    const input = args[0].toLowerCase();

    if (input === 'off') {
      groupConfig.enabled = false;
      allConfigs[from] = groupConfig;
      saveConfig(allConfigs);
      return sock.sendMessage(from, { text: "❌ Agendamento desativado para este grupo!" }, { quoted: Info });
    }

    // Tenta casar o padrão HH:MM/HH:MM
    const timeMatch = input.match(/^(\d{2}:\d{2})\/(\d{2}:\d{2})$/);
    
    if (timeMatch) {
      const closeTime = timeMatch[1];
      const openTime = timeMatch[2];
      
      groupConfig.enabled = true;
      groupConfig.closeTime = closeTime;
      groupConfig.openTime = openTime;
      
      allConfigs[from] = groupConfig;
      saveConfig(allConfigs);
      
      return sock.sendMessage(from, { 
        text: `✅ *Agendamento configurado para este grupo!*\n\n` +
              `🔒 Fechar: ${closeTime}\n` +
              `🔓 Abrir: ${openTime}\n\n` +
              `O bot executará essa ação apenas neste grupo.`
      }, { quoted: Info });
    } else {
      return sock.sendMessage(from, { 
        text: `❌ Formato inválido!\n\nUse: *${prefix}tempo-pg HH:MM/HH:MM*\nExemplo: *${prefix}tempo-pg 19:00/20:00*`
      }, { quoted: Info });
    }

  } catch (error) {
    console.error("Erro no comando scheduler:", error);
    await sock.sendMessage(from, { text: "❌ Ocorreu um erro ao executar este comando." }, { quoted: Info });
  }
}
