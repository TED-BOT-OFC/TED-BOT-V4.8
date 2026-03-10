const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'autofigu.json');

function loadAutoFigu() {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (err) {
        console.error("Erro ao carregar autofigu.json:", err);
    }
    return {};
}

function saveAutoFigu(data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Erro ao salvar autofigu.json:", err);
    }
}

function isAutoFiguActive(groupId) {
    const data = loadAutoFigu();
    return !!data[groupId];
}

function toggleAutoFigu(groupId, status) {
    const data = loadAutoFigu();
    data[groupId] = status;
    saveAutoFigu(data);
}

module.exports = {
    isAutoFiguActive,
    toggleAutoFigu
};
