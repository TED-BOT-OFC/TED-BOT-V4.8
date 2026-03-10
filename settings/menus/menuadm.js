const config = require("../config.json");

// Função para gerar data/hora formatada
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString("pt-BR");
    const time = now.toLocaleTimeString("pt-BR");
    return { date, time };
}

function generateMenuAdm() {
    const { date, time } = getCurrentDateTime();

    return `
╔═════ ∘◦ ✨ ◦∘ ═════╗
       👑  *MENU ADMIN*  👑
╚═════ ∘◦ ✨ ◦∘ ═════╝

📅 *Data:* _${date}_
⏰ *Hora:* _${time}_
👤 *Dono:* _${config.NickDono}_

┌──────────────────
│  🛠️  *CONFIGURAÇÕES GERAIS*
├──────────────────
│ 👁️  ${config.prefix}views 1/0
│    ↳ _Ativar/Desativar visualizações_
│ 💾  ${config.prefix}backup
│    ↳ _Backup completo do sistema_
│ 🔄  ${config.prefix}restart
│    ↳ _Reinicialização do bot_
│

┌──────────────────
│  🛡️  *PROTEÇÃO & SEGURANÇA*
├──────────────────
│ 🚫  ${config.prefix}antilinkhard
│    ↳ _Anti-link global (Todos os grupos)_
│ 🚫  ${config.prefix}antilinkhard2 (on/off)
│ 🔗  ${config.prefix}antilinkgrupo
│    ↳ _Anti-link apenas neste grupo_
│ 📣  ${config.prefix}totag
│    ↳ _Mencionar todos os membros_
│ 🔒  ${config.prefix}grupo f/a
│    ↳ _Fechar/Abrir grupo_
│ ⏰  ${config.prefix}tempo-pg HH:MM/HH:MM
│    ↳ _Programar Fechar/Abrir_
│ 🔒  ${config.prefix}d
│    ↳ _Configurações de detecção_
│ 👋  ${config.prefix}welcome
│    ↳ _Boas-vindas & Legendas_
│ ⏰️ ${config.prefix}#tempo-pg
│    ↳ _Ajustar tempo de postagem_
│ ⏰️ ${config.prefix}cooldown
│    ↳ _Definir intervalo entre comandos_
│

┌──────────────────
│  ⚡  *GERENCIAMENTO*
├──────────────────
│ ❌  ${config.prefix}ban @user
│    ↳ _Banir membro do grupo_
│ 🚫  ${config.prefix}blacklist @user
│    ↳ Adicionar membro à blacklist
│ 🚫  ${config.prefix}#brincadeiras on/off
│    ↳ Ativar o modo brincadeiras
│ 🤭  ${config.prefix}marcar
│    ↳ _Marcar membro específico_
│ 🚨 ${config.prefix}adverter
│    ↳ _adverter ao usuário_
│ 📥 ${config.prefix}autofigu
│    ↳ _autofigu ao Sticker_
│ 👑  ${config.prefix}promover
│    ↳ _Conceder administração_
│ 🔻  ${config.prefix}rebaixar
│    ↳ _Remover administração_
│ 🔊  ${config.prefix}audio
│    ↳ Enviar áudio aleatório
│ 🔊  ${config.prefix}mute
│    ↳ _Silenciar membro_
│ 🔇  ${config.prefix}unmute
│    ↳ _Remover silenciamento_
│ 🔗  ${config.prefix}linkgp
│    ↳ _Gerar link do grupo_
│ 📜  ${config.prefix}regras
│    ↳ _Exibir regras do grupo_
│ 🧩  ${config.prefix}addsticker
│    ↳ Salvar figurinha enviada
│

💫 *Comandos disponíveis: 18*
🔧 *Prefixo atual: ${config.prefix}*

╔═════ ∘◦ 🌟 ◦∘ ═════╗
     📍 *Use com sabedoria!*
╚═════ ∘◦ 🌟 ◦∘ ═════╝
`;
}

module.exports = generateMenuAdm;