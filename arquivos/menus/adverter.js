// 📁 settings/commands/adverter.js
module.exports = {
  name: "adverter",
  alias: ["advertir", "warn"],
  description: "Adverte um membro do grupo (sistema de 3 advertências)",
  category: "Moderação",

  async execute(sock, from, Info, args, command, prefix, BOT_PHONE) {
    try {
      const { getVerificacao } = require("../../database/sistema/verificador.js");
      const fs = require('fs');
      const path = require('path');

      const {
        participants,
        isSenderAdmin,
        isSenderOwner,
        isSenderDonoBot,
        botId,
        isBotAdmin
      } = await getVerificacao(sock, from, Info, prefix, BOT_PHONE);

      // ========== ⚙️ PERMISSÕES ==========
      if (!isSenderAdmin && !isSenderOwner && !isSenderDonoBot) {
        return sock.sendMessage(from, {
          text: "❌ Apenas administradores, dono do grupo ou dono do bot podem usar este comando."
        }, { quoted: Info });
      }

      if (!isBotAdmin) {
        return sock.sendMessage(from, {
          text: "🤖 Preciso ser admin para advertir membros! Me torne administrador do grupo."
        }, { quoted: Info });
      }

      // ========== 🎯 IDENTIFICAR ALVO ==========
      let mentioned = [];

      if (Info.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
        mentioned = Info.message.extendedTextMessage.contextInfo.mentionedJid;
      }

      const quotedMsg = Info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quotedMsg && quotedMsg.extendedTextMessage?.contextInfo?.mentionedJid) {
        mentioned = quotedMsg.extendedTextMessage.contextInfo.mentionedJid;
      }

      if (mentioned.length === 0 && Info.message?.extendedTextMessage?.contextInfo?.participant) {
        mentioned = [Info.message.extendedTextMessage.contextInfo.participant];
      }

      if (mentioned.length === 0) {
        return sock.sendMessage(from, {
          text: "❌ Marque a mensagem do usuário ou use @ para advertir. Apenas um por vez!"
        }, { quoted: Info });
      }

      const alvoLid = mentioned[0];
      const targetParticipant = participants.find(p => p.id === alvoLid);

      // ========== 👥 VALIDAÇÕES ==========
      if (!targetParticipant) {
        return sock.sendMessage(from, {
          text: "⚠️ Este usuário não está mais no grupo."
        }, { quoted: Info });
      }

      // Verifica se não está tentando se auto-adverter
      if (alvoLid === (Info.key.participant || Info.key.remoteJid)) {
        return sock.sendMessage(from, {
          text: "❌ Você não pode se auto-adverter!"
        }, { quoted: Info });
      }

      // Verifica se não está tentando advertir o bot
      if (alvoLid === botId) {
        return sock.sendMessage(from, {
          text: "🤖 Não posso me auto-adverter! 😅"
        }, { quoted: Info });
      }

      const isTargetAdmin = targetParticipant.admin === "admin" || targetParticipant.admin === "superadmin";

      // Verifica se está tentando advertir outro admin (apenas dono do bot pode)
      if (isTargetAdmin && !isSenderDonoBot) {
        return sock.sendMessage(from, {
          text: "⛔ Não posso advertir outro administrador! Apenas o DONO DO BOT pode advertir ADMs."
        }, { quoted: Info });
      }

      // ========== 📊 SISTEMA DE ADVERTÊNCIAS ==========
      const advertDir = './database/adverte';
      const advertFile = path.join(advertDir, 'adverte.json');

      // Garante que a pasta existe
      if (!fs.existsSync(advertDir)) {
        fs.mkdirSync(advertDir, { recursive: true });
      }

      // Carrega as advertências existentes
      let warningsData = {};
      if (fs.existsSync(advertFile)) {
        try {
          const fileContent = fs.readFileSync(advertFile, 'utf8');
          warningsData = JSON.parse(fileContent);
        } catch (error) {
          console.error("Erro ao ler arquivo de advertências:", error);
          warningsData = {};
        }
      }

      // Inicializa o grupo se não existir
      if (!warningsData[from]) {
        warningsData[from] = {};
      }

      const userWarnings = warningsData[from][alvoLid] || 0;
      const newWarningCount = userWarnings + 1;

      // Atualiza o contador
      warningsData[from][alvoLid] = newWarningCount;

      // Salva no arquivo
      try {
        fs.writeFileSync(advertFile, JSON.stringify(warningsData, null, 2));
      } catch (error) {
        console.error("Erro ao salvar advertência:", error);
        return sock.sendMessage(from, {
          text: "❌ Erro ao salvar advertência no banco de dados."
        }, { quoted: Info });
      }

      // Reage indicando processamento
      await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

      // ========== ⚠️ MENSAGENS DE ADVERTÊNCIA ==========
      const alvoDisplay = alvoLid.split('@')[0];
      let warningMessage = '';
      
      if (newWarningCount === 1) {
        warningMessage = `
⚠️ *PRIMEIRA ADVERTÊNCIA*

👤 *Membro:* @${alvoDisplay}
📊 *Advertências:* 1/3
📝 *Status:* ⚠️ Aviso

💡 *Observação:* 
Esta é sua primeira advertência. Ao atingir 3 advertências, você será banido automaticamente do grupo.
        `.trim();
      } else if (newWarningCount === 2) {
        warningMessage = `
🚨 *SEGUNDA ADVERTÊNCIA*

👤 *Membro:* @${alvoDisplay}
📊 *Advertências:* 2/3
📝 *Status:* 🚨 Último Aviso

⚠️ *Atenção:* 
Esta é sua segunda advertência. A próxima resultará em banimento automático do grupo.
        `.trim();
      } else if (newWarningCount >= 3) {
        // ========== 🔨 BANIMENTO AUTOMÁTICO ==========
        warningMessage = `
🔨 *BANIMENTO AUTOMÁTICO*

👤 *Membro:* @${alvoDisplay}
📊 *Advertências:* 3/3
📝 *Status:* ❌ BANIDO

⚡ *Motivo:* 
Atingiu o limite máximo de 3 advertências.
        `.trim();

        // Executa o banimento
        await sock.groupParticipantsUpdate(from, [alvoLid], "remove");
        
        // Remove as advertências do usuário banido
        delete warningsData[from][alvoLid];
        fs.writeFileSync(advertFile, JSON.stringify(warningsData, null, 2));
        
        await sock.sendMessage(from, {
          text: warningMessage,
          mentions: [alvoLid]
        }, { quoted: Info });
        
        // Confirmação com reação
        await sock.sendMessage(from, { react: { text: "🔨", key: Info.key } });
        return;
      }

      // Envia a mensagem de advertência
      await sock.sendMessage(from, {
        text: warningMessage,
        mentions: [alvoLid]
      }, { quoted: Info });

      // Confirmação com reação
      await sock.sendMessage(from, { react: { text: "⚠️", key: Info.key } });

    } catch (error) {
      console.error("Erro no comando adverter:", error);
      
      try {
        await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
      } catch {}
      
      let errorMessage = "❌ Ocorreu um erro ao advertir o membro.";
      
      if (error.message.includes("not authorized")) {
        errorMessage = "❌ Não tenho permissão para moderar este grupo.";
      }
      
      await sock.sendMessage(from, { 
        text: errorMessage 
      }, { quoted: Info });
    }
  }
};