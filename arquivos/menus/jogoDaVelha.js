const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/jogoDaVelha.json');

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

function checkWin(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
        [0, 4, 8], [2, 4, 6]             // Diagonais
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return board.includes(null) ? null : 'draw';
}

function renderBoard(board) {
    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
    const b = board.map((v, i) => v || emojis[i]);
    return ` ${b[0]} | ${b[1]} | ${b[2]} \n----------- \n ${b[3]} | ${b[4]} | ${b[5]} \n----------- \n ${b[6]} | ${b[7]} | ${b[8]} `;
}

module.exports = async function jogoDaVelhaCommand(sock, from, Info, prefix) {
    const sender = Info.key.participant || Info.key.remoteJid;
    const body = Info.message?.conversation || Info.message?.extendedTextMessage?.text || "";
    const args = body.trim().split(/ +/).slice(1);
    const data = loadData();

    // Comando de Reset (!rv)
    if (body.startsWith(prefix + 'rv')) {
        if (data[from]) {
            delete data[from];
            saveData(data);
            return sock.sendMessage(from, { text: "> 🔄 O jogo da velha foi resetado." }, { quoted: Info });
        }
        return sock.sendMessage(from, { text: "⚠️ Não há nenhuma partida em andamento neste grupo." }, { quoted: Info });
    }

    // Se não houver jogo no grupo
    if (!data[from]) {
        const mentioned = Info.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) {
            return sock.sendMessage(from, { text: `🎮 *JOGO DA VELHA (PvP)*\n\nPara desafiar alguém, use: *${prefix}velha @usuario*` }, { quoted: Info });
        }

        if (mentioned === sender) {
            return sock.sendMessage(from, { text: "⚠️ Você não pode desafiar a si mesmo!" }, { quoted: Info });
        }

        data[from] = {
            p1: sender,
            p2: mentioned,
            board: Array(9).fill(null),
            turn: sender,
            status: 'waiting',
            symbols: { [sender]: '❌', [mentioned]: '⭕' }
        };
        saveData(data);

        const msg = `『📌 ESPERANDO O OPONENTE ⚔️』\n\n@${sender.split('@')[0]} está te desafiando para uma partida de jogo da velha.\n\n@${mentioned.split('@')[0]} Use 『S』 para aceitar ou 『N』 para recusar.\n\nPara resetar o jogo, use o comando !rv.`;
        return sock.sendMessage(from, { text: msg, mentions: [sender, mentioned] }, { quoted: Info });
    }

    const game = data[from];

    // Fase de Aceitação
    if (game.status === 'waiting') {
        if (sender !== game.p2) return; // Apenas o desafiado pode responder

        const response = body.trim().toUpperCase();
        if (response === 'S') {
            game.status = 'playing';
            saveData(data);
            let msg = `✅ O desafio foi aceito!\n\n`;
            msg += `❌: @${game.p1.split('@')[0]}\n`;
            msg += `⭕: @${game.p2.split('@')[0]}\n\n`;
            msg += renderBoard(game.board);
            msg += `\n\n> 🎯 Vez de @${game.turn.split('@')[0]} (❌)`;
            return sock.sendMessage(from, { text: msg, mentions: [game.p1, game.p2] }, { quoted: Info });
        } else if (response === 'N') {
            delete data[from];
            saveData(data);
            return sock.sendMessage(from, { text: "> ❌ O desafio foi recusado." }, { quoted: Info });
        }
        return;
    }

    // Fase de Jogo
    if (game.status === 'playing') {
        // Se for um número de 1 a 9 (aceita o número normal ou o emoji se o bot capturar o texto do emoji)
        const input = body.trim().replace(/[^1-9]/g, '');
        if (/^[1-9]$/.test(input)) {
            if (sender !== game.p1 && sender !== game.p2) return; // Apenas jogadores da partida

            if (sender !== game.turn) {
                return sock.sendMessage(from, { text: "⚠️ Não é a sua vez!" }, { quoted: Info });
            }

            const move = parseInt(input) - 1;
            if (game.board[move] !== null) {
                return sock.sendMessage(from, { text: "⚠️ Essa posição já está ocupada!" }, { quoted: Info });
            }

            game.board[move] = game.symbols[sender];
            const result = checkWin(game.board);

            if (result) {
                let msg = renderBoard(game.board) + "\n\n";
                if (result === 'draw') {
                    msg += "🤝 A partida terminou em empate!";
                } else {
                    msg += `🏆 @${sender.split('@')[0]} venceu a partida de Jogo da Velha!`;
                }
                delete data[from];
                saveData(data);
                return sock.sendMessage(from, { text: msg, mentions: [sender] }, { quoted: Info });
            }

            // Troca de turno
            game.turn = game.turn === game.p1 ? game.p2 : game.p1;
            saveData(data);

            let msg = renderBoard(game.board);
            msg += `\n\n> 🎯 Vez de @${game.turn.split('@')[0]} (${game.symbols[game.turn]})`;
            return sock.sendMessage(from, { text: msg, mentions: [game.turn] }, { quoted: Info });
        }
    }
};
