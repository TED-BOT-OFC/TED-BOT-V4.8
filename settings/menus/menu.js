const config = require("../config.json");

// 🎄 Função para gerar data/hora formatada
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString("pt-BR");
    const time = now.toLocaleTimeString("pt-BR");
    return { date, time };
}

// 🎅 MENU DE NATAL — ${config.NomeDoBot}
function generateMenu() {
    const { date, time } = getCurrentDateTime();

    return `╔══════════════╗
   🎭 ${config.NomeDoBot} 🎭
╚══════════════╝
📅 ${date} • ⏰ ${time}  
👑 Dono: ${config.NickDono}
─────── ✦ MENU ✦ ───────
🎉 PRINCIPAL
▸ ${config.prefix}menuadm  
▸ ${config.prefix}brincadeiras  
▸ ${config.prefix}menulogos  
⚙️ SISTEMA
▸ ${config.prefix}ping  
▸ ${config.prefix}status  
▸ ${config.prefix}stats  
▸ ${config.prefix}roubar  
▸ ${config.prefix}revelar  
▸ ${config.prefix}sticker  
▸ ${config.prefix}legenda  
▸ ${config.prefix}toimg  
▸ ${config.prefix}nahida  
▸ ${config.prefix}nami  
✨ CONVERSÃO
▸ ${config.prefix}totext  
▸ ${config.prefix}ptvmsg  
▸ ${config.prefix}attp  
▸ ${config.prefix}ttp
▸ ${config.prefix}brat  
▸ ${config.prefix}gerarlink  
▸ ${config.prefix}rvisu  
📥 DOWNLOADS
▸ ${config.prefix}tomp3  
▸ ${config.prefix}8d (Efeito 3D) 🎧
▸ ${config.prefix}shazam  
▸ ${config.prefix}play  
▸ ${config.prefix}playvid2
▸ ${config.prefix}sc  
▸ ${config.prefix}ttk
▸ ${config.prefix}ttk2  
▸ ${config.prefix}tiktok
▸ ${config.prefix}tiktok2  
▸ ${config.prefix}kwai  
▸ ${config.prefix}instamp3
▸ ${config.prefix}instamp4  
▸ ${config.prefix}myinstants  
▸ ${config.prefix}Pintemp3
▸ ${config.prefix}Pintemp4  
▸ ${config.prefix}Pinterest 
▸ ${config.prefix}Pinterest2  
▸ ${config.prefix}gif  
▸ ${config.prefix}robloxcodes  
👤 PERFIL
▸ ${config.prefix}perfil  
▸ ${config.prefix}perfilff  
───── ✦ BOA FOLIA ✦ ─────
`;
}

module.exports = generateMenu;
