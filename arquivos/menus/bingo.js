const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../database/bingo/bingo_config.json');

function loadConfig() {
    try {
        if (!fs.existsSync(configPath)) return null;
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
        console.log("Erro ao ler config do bingo:", e);
        return null;
    }
}

function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (e) {
        console.log("Erro ao salvar config do bingo:", e);
    }
}

module.exports = async (sock, from, Info, args, prefix, numerodono) => {
    try {
        let config = loadConfig();
        if (!config) {
            return sock.sendMessage(from, { text: "❌ Erro ao carregar configuração do Bingo." }, { quoted: Info });
        }

        // ================= VERIFICAÇÃO SEGURA =================
        let verification = { isSenderDonoBot: false };

        try {
            const { getVerificacao } = require("../../database/sistema/verificador");
            verification = await getVerificacao(
                sock,
                from,
                Info,
                { numerodono, prefix },
                (sock.user?.id || "").split(":")[0]
            );
        } catch (e) {
            console.log("Erro no verificador:", e);
        }

        const sender = Info.key.participant || Info.key.remoteJid;
        const isDono = verification.isSenderDonoBot;
        const isAutorizado = config.autorizados?.includes(sender);
        const temPermissao = isDono || isAutorizado;

        const subCommand = args[0]?.toLowerCase();

        // ================= MOSTRAR BINGO =================
        if (!subCommand) {
            let msg = `${config.texto_base}\n\n`;

            const sortedNumbers = Object.keys(config.numeros || {}).sort((a, b) => parseInt(a) - parseInt(b));

            for (const num of sortedNumbers) {
                const user = config.numeros[num] || "";
                msg += `${num}- ${user}\n`;
            }

            return sock.sendMessage(from, {
                image: { url: config.imagem },
                caption: msg.trim()
            }, { quoted: Info });
        }

        // ================= SEM PERMISSÃO =================
        if (!temPermissao) {
            return sock.sendMessage(from, {
                text: "🚫 Você não tem permissão para editar o Bingo."
            }, { quoted: Info });
        }

        // ================= COMANDOS =================
        switch (subCommand) {

            case 'set': {
                const num = args[1];
                const nome = args.slice(2).join(" ");

                if (!num) {
                    return sock.sendMessage(from, { text: `❌ Use: ${prefix}bingo set [Número] [Nome]` }, { quoted: Info });
                }

                const numFormatado = num.padStart(2, '0');

                config.numeros[numFormatado] = nome ? `${nome} ✅` : "";
                saveConfig(config);

                await sock.sendMessage(from, { text: `✅ Número ${numFormatado} atualizado!` }, { quoted: Info });
                break;
            }

            case 'add':
            case 'autorizar': {
                if (!isDono) {
                    return sock.sendMessage(from, { text: "🚫 Apenas o dono pode autorizar." }, { quoted: Info });
                }

                const mentioned = Info.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                if (!mentioned) {
                    return sock.sendMessage(from, { text: "❌ Marque a pessoa para autorizar." }, { quoted: Info });
                }

                if (!config.autorizados.includes(mentioned)) {
                    config.autorizados.push(mentioned);
                    saveConfig(config);
                    await sock.sendMessage(from, {
                        text: `✅ @${mentioned.split('@')[0]} agora pode editar o Bingo!`,
                        mentions: [mentioned]
                    }, { quoted: Info });
                } else {
                    await sock.sendMessage(from, { text: "⚠️ Usuário já autorizado." }, { quoted: Info });
                }
                break;
            }

            case 'remove':
            case 'desautorizar': {
                if (!isDono) {
                    return sock.sendMessage(from, { text: "🚫 Apenas o dono pode remover autorizações." }, { quoted: Info });
                }

                const mentioned = Info.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                if (!mentioned) {
                    return sock.sendMessage(from, { text: "❌ Marque a pessoa para remover." }, { quoted: Info });
                }

                config.autorizados = config.autorizados.filter(id => id !== mentioned);
                saveConfig(config);

                await sock.sendMessage(from, {
                    text: `❌ @${mentioned.split('@')[0]} não pode mais editar o Bingo.`,
                    mentions: [mentioned]
                }, { quoted: Info });
                break;
            }

            case 'texto': {
                const novoTexto = args.slice(1).join(" ");
                if (!novoTexto) {
                    return sock.sendMessage(from, { text: "❌ Digite o novo texto." }, { quoted: Info });
                }

                config.texto_base = novoTexto;
                saveConfig(config);
                await sock.sendMessage(from, { text: "✅ Texto base atualizado!" }, { quoted: Info });
                break;
            }

            case 'img': {
                const novaImg = args[1];
                if (!novaImg) {
                    return sock.sendMessage(from, { text: "❌ Digite a URL da imagem." }, { quoted: Info });
                }

                config.imagem = novaImg;
                saveConfig(config);
                await sock.sendMessage(from, { text: "✅ Imagem atualizada!" }, { quoted: Info });
                break;
            }

            case 'reset': {
                config.numeros = {};
                saveConfig(config);
                await sock.sendMessage(from, { text: "✅ Bingo resetado com sucesso!" }, { quoted: Info });
                break;
            }

            default: {
                let helpMsg = `*COMANDOS BINGO*\n\n` +
                    `• *${prefix}bingo* - Mostra o bingo\n\n` +
                    `*⚙️ EDIÇÃO:*\n` +
                    `• *${prefix}bingo set [N°] [Nome]*\n` +
                    `• *${prefix}bingo texto [Texto]*\n` +
                    `• *${prefix}bingo img [URL]*\n` +
                    `• *${prefix}bingo reset*\n\n` +
                    `*👤 AUTORIZAÇÃO (só dono):*\n` +
                    `• *${prefix}bingo add* (marcando alguém)\n` +
                    `• *${prefix}bingo remove* (marcando alguém)`;

                await sock.sendMessage(from, { text: helpMsg }, { quoted: Info });
            }
        }

    } catch (err) {
        console.error("Erro geral no bingo:", err);
        await sock.sendMessage(from, { text: "❌ Erro no sistema de Bingo." }, { quoted: Info });
    }
};