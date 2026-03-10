const path = require('path');
const fs = require('fs');

// Caminho para o arquivo JSON que substituirá o banco de dados SQLite
const dbPath = path.join(__dirname, '../activity.json');

// Função auxiliar para ler o banco de dados
const readDB = () => {
    try {
        if (!fs.existsSync(dbPath)) {
            return {};
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler banco de dados de atividade:', error);
        return {};
    }
};

// Função auxiliar para salvar o banco de dados
const saveDB = (data) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao salvar banco de dados de atividade:', error);
    }
};

const activityManager = {
    /**
     * Registra ou atualiza a atividade de um usuário
     * @param {string} groupId - ID do grupo
     * @param {string} userId - ID do usuário (JID)
     * @param {string} userName - Nome do usuário (PushName)
     * @param {string} type - Tipo de atividade: 'message', 'command', 'sticker'
     */
    trackActivity: (groupId, userId, userName, type) => {
        if (!groupId || !userId) return;

        const db = readDB();
        
        // Inicializa a estrutura se não existir
        if (!db[groupId]) db[groupId] = {};
        if (!db[groupId][userId]) {
            db[groupId][userId] = {
                userId: userId,
                userName: userName,
                messages: 0,
                commands: 0,
                stickers: 0
            };
        }

        // Atualiza os dados
        const column = type === 'message' ? 'messages' : (type === 'command' ? 'commands' : 'stickers');
        db[groupId][userId][column] += 1;
        db[groupId][userId].userName = userName; // Atualiza o nome caso mude

        saveDB(db);
    },

    /**
     * Obtém o ranking dos 10 mais ativos de um grupo
     * @param {string} groupId - ID do grupo
     * @returns {Promise<Array>} - Lista dos 10 mais ativos
     */
    getRanking: (groupId) => {
        return new Promise((resolve) => {
            const db = readDB();
            
            if (!db[groupId]) {
                return resolve([]);
            }

            // Converte o objeto de usuários em array
            const users = Object.values(db[groupId]);

            // Ordena pela soma total de atividades
            const sortedUsers = users.sort((a, b) => {
                const totalA = (a.messages || 0) + (a.commands || 0) + (a.stickers || 0);
                const totalB = (b.messages || 0) + (b.commands || 0) + (b.stickers || 0);
                return totalB - totalA;
            });

            // Retorna os 10 primeiros
            resolve(sortedUsers.slice(0, 10));
        });
    }
};

module.exports = activityManager;
