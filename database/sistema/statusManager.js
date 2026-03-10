
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const configPath = path.join(__dirname, 'statusConfig.json');

/**
 * Carrega a configuração de status do arquivo.
 * @returns {object} O objeto de configuração.
 */
function loadStatusConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
    // Se o arquivo não existir, retorna o estado padrão e cria o arquivo
    const defaultConfig = { 
      online: true, // Por padrão, o bot inicia online
      readReceipts: true // Por padrão, as confirmações de leitura estão ativas
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    return defaultConfig;
  } catch (error) {
    console.error(chalk.red(`❌ Erro ao carregar statusConfig.json: ${error.message}`));
    return { online: true, readReceipts: true };
  }
}

/**
 * Salva a configuração de status no arquivo.
 * @param {boolean} online - O novo estado online (true para ON, false para OFF).
 * @param {boolean} readReceipts - O novo estado de confirmação de leitura (true para ON, false para OFF).
 */
function saveStatusConfig(online, readReceipts) {
  try {
    const config = { online, readReceipts };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(chalk.hex('#00BFFF')(`🌐 Status: ${online ? 'ONLINE' : 'OFFLINE'} | ✅ Confirmação de Leitura: ${readReceipts ? 'ATIVADA' : 'DESATIVADA'} e salvo em statusConfig.json`));
    console.log(chalk.hex('#00BFFF')(`[FILE] statusConfig.json atualizado: Online=${online}, ReadReceipts=${readReceipts}`));
  } catch (error) {
    console.error(chalk.red(`❌ Erro ao salvar statusConfig.json: ${error.message}`));
  }
}

/**
 * Verifica se o bot está online.
 * @returns {boolean} True se online, false caso contrário.
 */
function isOnline() {
  return loadStatusConfig().online;
}

/**
 * Verifica se as confirmações de leitura estão ativas.
 * @returns {boolean} True se ativas, false caso contrário.
 */
function areReadReceiptsActive() {
  return loadStatusConfig().readReceipts;
}

module.exports = {
  loadStatusConfig,
  saveStatusConfig,
  isOnline,
  areReadReceiptsActive
};

