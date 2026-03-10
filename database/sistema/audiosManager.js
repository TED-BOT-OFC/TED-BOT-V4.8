const fs = require('fs');
const path = require('path');

const audiosConfigPath = path.join(__dirname, 'audiosConfig.json');

function loadAudiosConfig() {
    try {
        if (fs.existsSync(audiosConfigPath)) {
            const data = fs.readFileSync(audiosConfigPath, 'utf8');
            return JSON.parse(data);
        }
        const defaultConfig = { 
            enabled: true 
        };
        fs.writeFileSync(audiosConfigPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
        return defaultConfig;
    } catch (error) {
        console.error(`Erro ao carregar audiosConfig.json: ${error.message}`);
        return { enabled: true };
    }
}

function saveAudiosConfig(enabled) {
    try {
        const config = { enabled };
        fs.writeFileSync(audiosConfigPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error(`Erro ao salvar audiosConfig.json: ${error.message}`);
    }
}

function areAudiosEnabled() {
    return loadAudiosConfig().enabled;
}

module.exports = {
    loadAudiosConfig,
    saveAudiosConfig,
    areAudiosEnabled
};
