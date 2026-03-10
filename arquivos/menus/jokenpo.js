const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/jokenpo.json');

// Inicializa o banco de dados se não existir
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}), 'utf8');
}

function loadData() {
    try {
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

const NIVEIS = [
    { nome: "Fácil", vitoriasNecessarias: 0, chanceVitoriaMaquina: 30, pontos: 10 },
    { nome: "Médio", vitoriasNecessarias: 5, chanceVitoriaMaquina: 40, pontos: 20 },
    { nome: "Difícil", vitoriasNecessarias: 10, chanceVitoriaMaquina: 50, pontos: 30 },
    { nome: "Expert", vitoriasNecessarias: 20, chanceVitoriaMaquina: 60, pontos: 50 },
    { nome: "Mestre", vitoriasNecessarias: 35, chanceVitoriaMaquina: 70, pontos: 75 },
    { nome: "Lendário", vitoriasNecessarias: 50, chanceVitoriaMaquina: 80, pontos: 100 }
];

function getStatus(userId) {
    const data = loadData();
    if (!data[userId]) {
        data[userId] = {
            vitorias: 0,
            derrotas: 0,
            empates: 0,
            pontos: 0,
            nivelAtual: "Fácil"
        };
        saveData(data);
    }
    return data[userId];
}

function getNivelInfo(vitorias) {
    let nivelAtual = NIVEIS[0];
    for (const nivel of NIVEIS) {
        if (vitorias >= nivel.vitoriasNecessarias) {
            nivelAtual = nivel;
        } else {
            break;
        }
    }
    return nivelAtual;
}

module.exports = async function jokenpoCommand(sock, from, Info, prefix) {
    const sender = Info.key.participant || Info.key.remoteJid;
    const senderName = Info.pushName || "Jogador";
    const body = Info.message?.conversation || Info.message?.extendedTextMessage?.text || "";
    const args = body.trim().split(/ +/).slice(1);
    const escolhaJogador = args[0]?.toLowerCase();

    const status = getStatus(sender);
    const nivelInfo = getNivelInfo(status.vitorias);
    status.nivelAtual = nivelInfo.nome;

    if (!escolhaJogador || !['pedra', 'papel', 'tesoura'].includes(escolhaJogador)) {
        let menu = `🎮 *JOKENPÔ - DESAFIO PROGRESSIVO* 🎮\n\n`;
        menu += `👤 *Jogador:* ${senderName}\n`;
        menu += `🏆 *Nível:* ${status.nivelAtual}\n`;
        menu += `📈 *Vitórias:* ${status.vitorias}\n`;
        menu += `💰 *Pontos:* ${status.pontos}\n\n`;
        menu += `*Como jogar:*\n`;
        menu += `Digite: *${prefix}jokenpo [pedra, papel ou tesoura]*\n\n`;
        menu += `*Dificuldade Atual:* ${nivelInfo.nome}\n`;
        menu += `🤖 Chance da máquina ganhar: ${nivelInfo.chanceVitoriaMaquina}%\n`;
        
        const proximoNivel = NIVEIS.find(n => n.vitoriasNecessarias > status.vitorias);
        if (proximoNivel) {
            menu += `🚀 Faltam ${proximoNivel.vitoriasNecessarias - status.vitorias} vitórias para o nível *${proximoNivel.nome}*!`;
        } else {
            menu += `🔥 Você atingiu o nível máximo!`;
        }

        return sock.sendMessage(from, { text: menu }, { quoted: Info });
    }

    // Lógica da Máquina
    const random = Math.floor(Math.random() * 101);
    let escolhaMaquina;
    let resultado; // 0: Empate, 1: Jogador vence, 2: Máquina vence

    const venceDe = {
        'pedra': 'papel',
        'papel': 'tesoura',
        'tesoura': 'pedra'
    };

    const perdePara = {
        'pedra': 'tesoura',
        'papel': 'pedra',
        'tesoura': 'papel'
    };

    if (random <= nivelInfo.chanceVitoriaMaquina) {
        // Máquina ganha
        escolhaMaquina = venceDe[escolhaJogador];
        resultado = 2;
    } else {
        // Máquina não ganha obrigatoriamente (pode perder ou empatar)
        const opcoesRestantes = [escolhaJogador, perdePara[escolhaJogador]];
        escolhaMaquina = opcoesRestantes[Math.floor(Math.random() * opcoesRestantes.length)];
        resultado = (escolhaMaquina === escolhaJogador) ? 0 : 1;
    }

    const emojis = {
        'pedra': '🪨 Pedra',
        'papel': '📄 Papel',
        'tesoura': '✂️ Tesoura'
    };

    let msgResultado = `🎮 *JOKENPÔ - RESULTADO* 🎮\n\n`;
    msgResultado += `👤 *Você:* ${emojis[escolhaJogador]}\n`;
    msgResultado += `🤖 *Máquina:* ${emojis[escolhaMaquina]}\n\n`;

    if (resultado === 1) {
        status.vitorias++;
        status.pontos += nivelInfo.pontos;
        msgResultado += `🎉 *VOCÊ VENCEU!* (+${nivelInfo.pontos} pontos)\n`;
        
        // Verificar se subiu de nível
        const novoNivel = getNivelInfo(status.vitorias);
        if (novoNivel.nome !== status.nivelAtual) {
            msgResultado += `\n🚀 *UPGRADE!* Você subiu para o nível *${novoNivel.nome}*!`;
            status.nivelAtual = novoNivel.nome;
        }
    } else if (resultado === 2) {
        status.derrotas++;
        msgResultado += `❌ *A MÁQUINA VENCEU!* Mais sorte na próxima.\n`;
    } else {
        status.empates++;
        msgResultado += `🤝 *EMPATE!* Vamos de novo?\n`;
    }

    const data = loadData();
    data[sender] = status;
    saveData(data);

    msgResultado += `\n📊 *Seu Status:* ${status.vitorias}V | ${status.derrotas}D | ${status.empates}E\n`;
    msgResultado += `💰 *Total de Pontos:* ${status.pontos}`;

    return sock.sendMessage(from, { text: msgResultado }, { quoted: Info });
};
