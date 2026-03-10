#!/usr/bin/env node

// ===============================
// 🛡️ TEMUX - VERSÃO ROBUSTA
// ===============================

process.removeAllListeners('warning');

console.log('🛡️ Temux Robusto - Iniciando...');

// Função para carregar ESM e converter para CommonJS
async function loadAndConvertESM() {
    try {
        console.log('📦 Convertendo Baileys ESM → CommonJS...');
        
        const baileysESM = await import('@whiskeysockets/baileys');
        
        // Cria um objeto compatível com CommonJS
        const baileysCommonJS = {
            // Propriedades que o connect.js usa
            default: baileysESM.default,
            DisconnectReason: baileysESM.DisconnectReason,
            useMultiFileAuthState: baileysESM.useMultiFileAuthState,
            fetchLatestBaileysVersion: baileysESM.fetchLatestBaileysVersion,
            
            // Para garantir compatibilidade
            ...baileysESM
        };
        
        console.log('✅ Baileys convertido com sucesso');
        return baileysCommonJS;
        
    } catch (error) {
        console.error('❌ Falha na conversão:', error);
        throw error;
    }
}

// INICIALIZAÇÃO ROBUSTA
async function initialize() {
    try {
        // 1. Converte Baileys
        const baileysCommonJS = await loadAndConvertESM();
        
        // 2. Injeta no sistema de módulos
        require.cache[require.resolve('@whiskeysockets/baileys')] = {
            exports: baileysCommonJS
        };
        
        // 3. Inicia aplicação
        console.log('🚀 Iniciando connect.js...');
        require('./connect.js');
        
        console.log('🎉 Sistema operacional!');
        
    } catch (error) {
        console.error('💥 Falha na inicialização:', error);
        process.exit(1);
    }
}

// EXECUTA
initialize();