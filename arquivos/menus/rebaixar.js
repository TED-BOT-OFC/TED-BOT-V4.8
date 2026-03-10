// ./arquivos/menus/rebaixar.js
module.exports = async (sock, from, Info, prefix, BOT_PHONE, getVerificacao) => {
  try {
    const groupMetadata = from.endsWith("@g.us") ? await sock.groupMetadata(from) : { subject: "Chat Privado", participants: [] };
    const { participants, isSenderAdmin, isSenderOwner, isSenderDonoBot, isBotAdmin, donoBotNumero } =
      await getVerificacao(sock, from, Info, prefix, BOT_PHONE);

    // Permissão: Apenas admins, dono do grupo ou dono do bot podem rebaixar
    if (!isSenderAdmin && !isSenderOwner && !isSenderDonoBot) {
      return sock.sendMessage(from, { 
        text: "❌ Apenas administradores podem usar este comando." 
      }, { quoted: Info });
    }

    if (!isBotAdmin) {
      return sock.sendMessage(from, { 
        text: "🤖 Preciso ser admin para rebaixar alguém!" 
      }, { quoted: Info });
    }

    // ====== IDENTIFICAÇÃO DO ALVO ======
    let mentioned = [];

    if (Info.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      mentioned = Info.message.extendedTextMessage.contextInfo.mentionedJid;
    }

    if (mentioned.length === 0 && Info.message?.extendedTextMessage?.contextInfo?.participant) {
      mentioned = [Info.message.extendedTextMessage.contextInfo.participant];
    }

    // Se não marcou ninguém, avisa o usuário (evita o rebaixamento em massa acidental)
    if (mentioned.length === 0) {
      return sock.sendMessage(from, { 
        text: "❌ Marque a mensagem do usuário ou use @ para rebaixar de administrador." 
      }, { quoted: Info });
    }

    const alvo = mentioned[0];
    
    // Verificações de segurança antes de rebaixar
    const participant = participants.find(p => p.id === alvo);
    if (!participant) {
        return sock.sendMessage(from, { text: "⚠️ Usuário não encontrado no grupo." }, { quoted: Info });
    }

    const isAlvoAdmin = participant.admin === 'admin' || participant.admin === 'superadmin';
    if (!isAlvoAdmin) {
        return sock.sendMessage(from, { text: "⚠️ Este usuário já não é um administrador." }, { quoted: Info });
    }

    const alvoNumero = (participant.phoneNumber || participant.jid?.split('@')[0] || alvo.split('@')[0]).replace(/[^0-9]/g, "");
    const isAlvoDonoBot = alvoNumero === donoBotNumero;
    const isAlvoSuperAdmin = participant.admin === 'superadmin';

    // Não permite rebaixar o dono do bot ou o criador do grupo (superadmin)
    if (isAlvoDonoBot || isAlvoSuperAdmin) {
        return sock.sendMessage(from, { text: "🚫 Não posso rebaixar o dono do bot ou o criador do grupo." }, { quoted: Info });
    }

    // Executa o rebaixamento
    await sock.groupParticipantsUpdate(from, [alvo], "demote");

    const alvoDisplay = alvo.split('@')[0];
    await sock.sendMessage(from, { 
      text: `✅ @${alvoDisplay} foi rebaixado(a) e não é mais administrador(a).`,
      mentions: [alvo]
    }, { quoted: Info });

  } catch (err) {
    console.error("❌ Erro ao rebaixar:", err);
    await sock.sendMessage(from, { text: "❌ Ocorreu um erro ao tentar rebaixar." }, { quoted: Info });
  }
};
