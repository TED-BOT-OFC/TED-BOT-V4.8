const fs = require('fs');
const path = require('path');
const { getVerificacao } = require("../../database/sistema/verificador");
const { NomeDoBot } = require("../../settings/config.json");

const dbPath = path.join(__dirname, "../../database/sistema/autoRespostas.json");

function loadDB() {
    try {
        if (fs.existsSync(dbPath)) {
            return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }
    } catch (e) {
        console.error("Erro ao carregar autoRespostas.json:", e);
    }
    return {};
}

function saveDB(db) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

module.exports = async function autoRespostaCommand(sock, from, Info, prefix, BOT_PHONE, args) {
    try {
        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, { text: "❌ Este comando só funciona em grupos." }, { quoted: Info });
        }

        const { isSenderAdmin, isSenderOwner, isSenderDonoBot } = await getVerificacao(sock, from, Info, prefix, BOT_PHONE);
        
        if (!isSenderAdmin && !isSenderOwner && !isSenderDonoBot) {
            return sock.sendMessage(from, { text: "🚫 Apenas administradores podem configurar respostas automáticas." }, { quoted: Info });
        }

        if (args.length === 0) {
            return sock.sendMessage(from, {
                text: `🤖 *CONFIGURAÇÃO DE RESPOSTA AUTOMÁTICA*\n\n` +
                      `Use este comando para definir palavras que o bot responderá automaticamente.\n\n` +
                      `✅ *Adicionar/Editar:* ${prefix}auto [palavra] [resposta]\n` +
                      `❌ *Remover:* ${prefix}auto del [palavra]\n` +
                      `📋 *Listar:* ${prefix}auto lista\n\n` +
                      `💡 *Dica:* Para frases, use o separador *|*\n` +
                      `📌 *Exemplo:* ${prefix}auto oi ted | Olá, me chamo ${NomeDoBot}`
            }, { quoted: Info });
        }

        const db = loadDB();
        if (!db[from]) db[from] = {};

        const subCommand = args[0].toLowerCase();

        if (subCommand === 'lista') {
            const keys = Object.keys(db[from]);
            if (keys.length === 0) {
                return sock.sendMessage(from, { text: "📋 Não há respostas automáticas configuradas neste grupo." }, { quoted: Info });
            }
            let lista = "📋 *RESPOSTAS AUTOMÁTICAS NESTE GRUPO:*\n\n";
            keys.forEach((k, i) => {
                lista += `${i + 1}. *${k}* -> ${db[from][k].substring(0, 50)}${db[from][k].length > 50 ? '...' : ''}\n`;
            });
            return sock.sendMessage(from, { text: lista }, { quoted: Info });
        }

        if (subCommand === 'del') {
            const keyword = args.slice(1).join(' ').toLowerCase();
            if (!keyword) return sock.sendMessage(from, { text: "❌ Informe a palavra que deseja remover." }, { quoted: Info });
            
            if (db[from][keyword]) {
                delete db[from][keyword];
                saveDB(db);
                return sock.sendMessage(from, { text: `✅ Resposta para *"${keyword}"* removida com sucesso!` }, { quoted: Info });
            } else {
                return sock.sendMessage(from, { text: `❌ Não encontrei uma resposta para *"${keyword}"*.` }, { quoted: Info });
            }
        }

        // Adicionar ou Editar
        let keyword, response;
        const fullArgs = args.join(' ');
        
        if (fullArgs.includes('|')) {
            const parts = fullArgs.split('|');
            keyword = parts[0].trim().toLowerCase();
            response = parts.slice(1).join('|').trim();
        } else {
            keyword = args[0].toLowerCase();
            response = args.slice(1).join(' ');
        }

        if (!response) {
            return sock.sendMessage(from, { 
                text: `❌ Você precisa definir uma resposta para a palavra *"${keyword}"*.\n\n` +
                      `💡 Para palavras com mais de um termo, use o separador *|*.\n` +
                      `📌 Exemplo: *${prefix}auto oi ted | Olá, me chamo ${NomeDoBot}*` 
            }, { quoted: Info });
        }

        db[from][keyword] = response;
        saveDB(db);

        await sock.sendMessage(from, { 
            text: `✅ *Sucesso!*\n\nAgora, sempre que alguém disser *"${keyword}"*, eu responderei automaticamente.` 
        }, { quoted: Info });

        return;

    } catch (error) {
        console.error("Erro no comando autoResposta:", error);
        await sock.sendMessage(from, { text: "❌ Ocorreu um erro ao processar o comando." }, { quoted: Info });
    }
}
