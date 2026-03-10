const config = require("../config.json");

// Função para gerar data/hora formatada
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString("pt-BR");
    const time = now.toLocaleTimeString("pt-BR");
    return { date, time };
}

function generatmdono() {
    const { date, time } = getCurrentDateTime();

    return `
╔═════ ∘◦ ✨ ◦∘ ═════╗
    👑 MENU DONO 👑
╚═════ ∘◦ ✨ ◦∘ ═════╝

🗓️ _${date}_
🕰️ _${time}_
👤 _Dono: ${config.NickDono}_

┏━────╯⌬╰────━┓
┃   *⚙️ SISTEMA*
┃ ▸ 🧩 ${config.prefix}fotomenu           - *Menu de fotos*
┃ ▸ 🌐 ${config.prefix}verificado-global  - *Verificação global*
┃ ▸ 🚫 ${config.prefix}antipv (on/off)
┃ ▸ ✔️ ${config.prefix}visualizarmsg
┃ ▸ 🚫 ${config.prefix}bangp
┃ ▸ 🧩 ${config.prefix}addsticker (reply)
┃ ▸ ⏰️${config.prefix}#tempo-pg
┃ ▸ ⏰️${config.prefix}cooldown
┗━────╮⌬╭────━┛

`;
}

module.exports = generatmdono;