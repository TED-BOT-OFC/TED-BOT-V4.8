const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const configPath = path.join(__dirname, 'viewOnceConfig.json');

/**
 * Carrega a configuração de viewOnce do arquivo.
 * @returns {object} O objeto de configuração.
 */
function loadViewOnceConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
    // Se o arquivo não existir, retorna o estado padrão e cria o arquivo
    const defaultConfig = { ativo: false };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    return defaultConfig;
  } catch (error) {
    console.error(chalk.red(`❌ Erro ao carregar viewOnceConfig.json: ${error.message}`));
    return { ativo: false };
  }
}

/**
 * Salva a configuração de viewOnce no arquivo.
 * @param {boolean} ativo - O novo estado (true para ON, false para OFF).
 */
function saveViewOnceConfig(ativo) {
  try {
    const config = { ativo };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(chalk.hex('#FFD700')(`👁️ ViewOnce ${ativo ? 'ATIVADO' : 'DESATIVADO'} e salvo em viewOnceConfig.json`));
    console.log(chalk.hex('#FFD700')(`[FILE] viewOnceConfig.json atualizado: ${ativo}`));
  } catch (error) {
    console.error(chalk.red(`❌ Erro ao salvar viewOnceConfig.json: ${error.message}`));
  }
}

/**
 * Verifica se o recurso viewOnce está ativo.
 * @returns {boolean} True se ativo, false caso contrário.
 */
function isViewOnceActive() {
  return loadViewOnceConfig().ativo;
}

module.exports = {
  loadViewOnceConfig,
  saveViewOnceConfig,
  isViewOnceActive
};
