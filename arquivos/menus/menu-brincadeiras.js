const { getVerificacao } = require("../../database/sistema/verificador");
const brincadeirasManager = require("../../database/sistema/brincadeirasManager");
const generateBrincadeirasMenu = require("../../settings/menus/menu-brincadeiras.js");

async function handleBrincadeirasCommand(sock, from, Info, args, prefix, BOT_PHONE, sasah) {
    const subCommand = args[0]?.toLowerCase();

    // Se for apenas o comando sem argumentos, ou se não for on/off, mostra o menu
    if (!subCommand || (subCommand !== 'on' && subCommand !== 'off')) {
        const menuText = generateBrincadeirasMenu();
        const status = brincadeirasManager.estaAtivo(from) ? "✅ Ativado" : "❌ Desativado";
        
        // Adiciona o status ao menu
        const finalMenu = menuText + `\n*Status atual:* ${status}\n_Use ${prefix}brincadeiras on/off para alterar_`;

        const fs = require("fs");
        const path = require("path");
        const imgPath = path.join(__dirname, "../../settings/todasimg.json");

        let imagens = [];
        try {
            const data = fs.readFileSync(imgPath, "utf8");
            imagens = JSON.parse(data).imagens || [];
        } catch (err) {
            console.error("Erro ao ler todasimg.json:", err);
        }

        if (imagens.length > 0) {
            const imgAleatoria = imagens[Math.floor(Math.random() * imagens.length)];
            return await sock.sendMessage(from, {
                image: { url: imgAleatoria },
                caption: finalMenu,
                contextInfo: { 
                    mentionedJid: [Info.key.participant || Info.key.remoteJid]
                }
            }, { quoted: sasah });
        } else {
            return await sock.sendMessage(from, { text: finalMenu }, { quoted: Info });
        }
    }

    // Se for on/off, verifica permissões
    const { isSenderAdmin, isSenderOwner, isSenderDonoBot } = await getVerificacao(sock, from, Info, { prefix }, BOT_PHONE);

    if (!isSenderAdmin && !isSenderOwner && !isSenderDonoBot) {
        return sock.sendMessage(from, { 
            text: "🚫 *Acesso Negado!*\n\nApenas administradores ou o dono podem usar este comando." 
        }, { quoted: Info });
    }

    if (subCommand === 'on') {
        brincadeirasManager.ativar(from);
        return sock.sendMessage(from, { 
            text: "✅ *Brincadeiras Ativadas!*\n\nOs comandos de diversão agora podem ser usados neste grupo." 
        }, { quoted: Info });
    }

    if (subCommand === 'off') {
        brincadeirasManager.desativar(from);
        return sock.sendMessage(from, { 
            text: "❌ *Brincadeiras Desativadas!*\n\nOs comandos de diversão foram bloqueados neste grupo." 
        }, { quoted: Info });
    }
}

module.exports = handleBrincadeirasCommand;
