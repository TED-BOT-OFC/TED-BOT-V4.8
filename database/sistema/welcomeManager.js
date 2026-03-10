const fs = require('fs');
const path = require('path');

const welcomePath = path.join(__dirname, 'welcome.json');

function loadWelcomeData() {
    try {
        if (!fs.existsSync(welcomePath)) {
            fs.writeFileSync(welcomePath, JSON.stringify({}, null, 2));
        }
        return JSON.parse(fs.readFileSync(welcomePath, 'utf-8'));
    } catch (err) {
        console.error("Erro ao carregar welcome.json:", err);
        return {};
    }
}

function saveWelcomeData(data) {
    try {
        fs.writeFileSync(welcomePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Erro ao salvar welcome.json:", err);
    }
}

const welcomeData = loadWelcomeData();

module.exports = {
    getWelcomeConfig: (groupId) => {
        return welcomeData[groupId] || { 
            enabled: false, 
            caption: "Olá @user, seja bem-vindo(a) ao grupo *#group*! 🎉\n\n• Respeite as regras\n• Evite enviar links\n• Divirta-se!",
            leaveCaption: "👋 @user saiu do grupo *#group*."
        };
    },
    setWelcomeStatus: (groupId, status) => {
        if (!welcomeData[groupId]) {
            welcomeData[groupId] = { 
                enabled: status, 
                caption: "Olá @user, seja bem-vindo(a) ao grupo *#group*! 🎉\n\n• Respeite as regras\n• Evite enviar links\n• Divirta-se!",
                leaveCaption: "👋 @user saiu do grupo *#group*."
            };
        } else {
            welcomeData[groupId].enabled = status;
        }
        saveWelcomeData(welcomeData);
    },
    setWelcomeCaption: (groupId, caption) => {
        if (!welcomeData[groupId]) {
            welcomeData[groupId] = { enabled: false, caption: caption, leaveCaption: "👋 @user saiu do grupo *#group*." };
        } else {
            welcomeData[groupId].caption = caption;
        }
        saveWelcomeData(welcomeData);
    },
    setLeaveCaption: (groupId, caption) => {
        if (!welcomeData[groupId]) {
            welcomeData[groupId] = { 
                enabled: false, 
                caption: "Olá @user, seja bem-vindo(a) ao grupo *#group*! 🎉\n\n• Respeite as regras\n• Evite enviar links\n• Divirta-se!",
                leaveCaption: caption 
            };
        } else {
            welcomeData[groupId].leaveCaption = caption;
        }
        saveWelcomeData(welcomeData);
    }
};
