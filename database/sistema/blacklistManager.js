const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const configPath = path.join(__dirname, 'blacklist.json');

/**
 * Carrega a configuração da blacklist do arquivo.
 * @returns {object} O objeto de configuração.
 */
function loadBlacklistConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
    // Se o arquivo não existir, retorna o estado padrão e cria o arquivo
    const defaultConfig = { ativo: false, usuarios: [], mensagens: [] };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    return defaultConfig;
  } catch (error) {
    console.error(chalk.red(`❌ Erro ao carregar blacklist.json: ${error.message}`));
    return { ativo: false, usuarios: [], mensagens: [] };
  }
}

/**
 * Salva a configuração da blacklist no arquivo.
 * @param {object} config - O objeto de configuração completo.
 */
function saveBlacklistConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error(chalk.red(`❌ Erro ao salvar blacklist.json: ${error.message}`));
  }
}

/**
 * Verifica se o recurso blacklist está ativo.
 * @returns {boolean} True se ativo, false caso contrário.
 */
function isBlacklistActive() {
  return loadBlacklistConfig().ativo;
}

/**
 * Adiciona um usuário à blacklist.
 * @param {string} jid - O JID do usuário.
 * @returns {boolean} True se adicionado, false se já existia.
 */
function addUsuario(jid) {
  const config = loadBlacklistConfig();
  if (!config.usuarios.includes(jid)) {
    config.usuarios.push(jid);
    saveBlacklistConfig(config);
    return true;
  }
  return false;
}

/**
 * Remove um usuário da blacklist.
 * @param {string} jid - O JID do usuário.
 * @returns {boolean} True se removido, false se não existia.
 */
function removeUsuario(jid) {
  const config = loadBlacklistConfig();
  const index = config.usuarios.indexOf(jid);
  if (index !== -1) {
    config.usuarios.splice(index, 1);
    saveBlacklistConfig(config);
    return true;
  }
  return false;
}

/**
 * Adiciona uma mensagem (texto) à blacklist.
 * @param {string} text - O texto da mensagem.
 * @returns {boolean} True se adicionado, false se já existia.
 */
function addMensagem(text) {
  const config = loadBlacklistConfig();
  if (!config.mensagens.includes(text)) {
    config.mensagens.push(text);
    saveBlacklistConfig(config);
    return true;
  }
  return false;
}

/**
 * Remove uma mensagem da blacklist.
 * @param {string} text - O texto da mensagem.
 * @returns {boolean} True se removido, false se não existia.
 */
function removeMensagem(text) {
  const config = loadBlacklistConfig();
  const index = config.mensagens.indexOf(text);
  if (index !== -1) {
    config.mensagens.splice(index, 1);
    saveBlacklistConfig(config);
    return true;
  }
  return false;
}

/**
 * Verifica se um usuário ou mensagem está na blacklist.
 * @param {string} jid - O JID do usuário.
 * @param {string} text - O texto da mensagem.
 * @returns {boolean} True se estiver na blacklist.
 */
function isBlacklisted(jid, text) {
  const config = loadBlacklistConfig();
  if (!config.ativo) return false;
  
  if (jid && config.usuarios.includes(jid)) return true;
  if (text && config.mensagens.some(m => text.toLowerCase().includes(m.toLowerCase()))) return true;
  
  return false;
}

/**
 * Ativa ou desativa a blacklist.
 * @param {boolean} status - True para ativar, false para desativar.
 */
function setBlacklistStatus(status) {
  const config = loadBlacklistConfig();
  config.ativo = status;
  saveBlacklistConfig(config);
}

module.exports = {
  loadBlacklistConfig,
  isBlacklistActive,
  addUsuario,
  removeUsuario,
  addMensagem,
  removeMensagem,
  isBlacklisted,
  setBlacklistStatus
};
