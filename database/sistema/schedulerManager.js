const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'schedulerConfig.json');

// Estrutura: { "groupId": { enabled: true, closeTime: "19:00", openTime: "20:00" } }
const defaultSettings = {};

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    } else {
      // Se não existir, cria com as configurações padrão
      saveConfig(defaultSettings);
      return defaultSettings;
    }
  } catch (e) {
    console.error("Erro ao carregar schedulerConfig.json:", e);
    return defaultSettings;
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error("Erro ao salvar schedulerConfig.json:", e);
  }
}

module.exports = {
  loadConfig,
  saveConfig
};
