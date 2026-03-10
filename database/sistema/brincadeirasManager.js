const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'brincadeiras.json');

const loadConfig = () => {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (err) {
        console.error("Erro ao carregar brincadeiras.json:", err);
    }
    return {};
};

const saveConfig = (config) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
    } catch (err) {
        console.error("Erro ao salvar brincadeiras.json:", err);
    }
};

const brincadeirasManager = {
    ativar: (groupId) => {
        const config = loadConfig();
        config[groupId] = true;
        saveConfig(config);
    },
    desativar: (groupId) => {
        const config = loadConfig();
        config[groupId] = false;
        saveConfig(config);
    },
    estaAtivo: (groupId) => {
        const config = loadConfig();
        // Por padrão, brincadeiras estão ativas se não houver configuração
        return config[groupId] !== false;
    }
};

module.exports = brincadeirasManager;
