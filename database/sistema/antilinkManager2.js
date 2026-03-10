const fs = require('fs');
const path = require('path');

class AntiLinkHard2Manager {
  constructor() {
    this.file = path.join(__dirname, 'antilinkhard2Settings.json');
    this.settings = this.loadSettings();
    this.allowedDomains = ['youtube.com', 'youtu.be', 'instagram.com', 'tiktok.com', 'vm.tiktok.com', 'kwai.com'];
  }

  loadSettings() {
    try {
      if (fs.existsSync(this.file)) {
        return JSON.parse(fs.readFileSync(this.file, 'utf8'));
      }
    } catch (err) {
      // Silencioso
    }
    return {};
  }

  saveSettings() {
    try {
      fs.writeFileSync(this.file, JSON.stringify(this.settings, null, 2));
    } catch (err) {
      // Silencioso
    }
  }

  // Ativa o antilinkhard2 em um grupo
  enable(groupId) {
    if (!this.settings[groupId]) this.settings[groupId] = {};
    this.settings[groupId].enabled = true;
    this.settings[groupId].updatedAt = new Date().toISOString();
    this.saveSettings();
  }

  // Desativa o antilinkhard2
  disable(groupId) {
    if (this.settings[groupId]) {
      this.settings[groupId].enabled = false;
      this.settings[groupId].updatedAt = new Date().toISOString();
      this.saveSettings();
    }
  }

  // Verifica se está ativo
  isEnabled(groupId) {
    return this.settings[groupId]?.enabled || false;
  }

  // Método principal que intercepta mensagens
  async checkMessage(sock, from, Info) {
    try {
      // Verifica se é grupo e se anti-link está ativo
      if (!from.endsWith('@g.us') || !this.isEnabled(from)) {
        return false; // Não intercepta
      }

      const body = Info.message?.conversation ||
                   Info.message?.extendedTextMessage?.text ||
                   Info.message?.imageMessage?.caption ||
                   Info.message?.videoMessage?.caption || "";

      // Regex para detectar qualquer link
      const regexLink = /(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/\S*)?/gi;
      
      const links = body.match(regexLink);
      
      if (links && links.length > 0) {
        const hasForbiddenLink = links.some(link => {
          const domain = this.extractDomain(link);
          return !this.isDomainAllowed(domain);
        });

        if (hasForbiddenLink) {
          const participant = Info.key.participant || Info.key.remoteJid;

          // Verifica se é admin
          const metadata = await sock.groupMetadata(from);
          const participantInfo = metadata.participants.find(p => p.id === participant);
          const isAdmin = participantInfo && (participantInfo.admin === 'admin' || participantInfo.admin === 'superadmin');

          // Se não for admin, aplica punição
          if (!isAdmin) {
            await this.applyPunishment(sock, from, participant, Info);
            return true; // Interceptou a mensagem
          }
        }
      }
      
      return false; // Não interceptou
    } catch (err) {
      return false;
    }
  }

  // Extrai domínio do link
  extractDomain(url) {
    try {
      let domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
      domain = domain.split('/')[0];
      return domain.toLowerCase();
    } catch (err) {
      return url;
    }
  }

  // Verifica se o domínio é permitido
  isDomainAllowed(domain) {
    return this.allowedDomains.some(allowed => {
      return domain === allowed || domain.endsWith('.' + allowed);
    });
  }

  // Método para aplicar a punição completa
  async applyPunishment(sock, groupId, participant, Info) {
    try {
      // 1️⃣ Tenta apagar a mensagem
      try {
        await sock.sendMessage(groupId, { delete: Info.key });
      } catch (deleteError) {}

      // 2️⃣ Remove o usuário
      try {
        await sock.groupParticipantsUpdate(groupId, [participant], 'remove');
      } catch (removeError) {}

      // 3️⃣ Fecha o grupo
      try {
        await sock.groupSettingUpdate(groupId, 'announcement');
      } catch (groupError) {}

      // 4️⃣ Envia aviso com lista de links permitidos
      const allowedList = this.allowedDomains.map(domain => `• ${domain}`).join('\n');
      
      await sock.sendMessage(groupId, {
        text: `🚨 *AntiLinkHard2 Ativo!*\n\n🔗 Link não permitido detectado!\n@${participant.split('@')[0]} foi *banido*.\n\n✅ *Links Permitidos:*\n${allowedList}\n\nO grupo foi *fechado temporariamente* por segurança.`,
        mentions: [participant]
      });

      // 5️⃣ Reabre automaticamente em 5 segundos
      setTimeout(async () => {
        try {
          await sock.groupSettingUpdate(groupId, 'not_announcement');
          await sock.sendMessage(groupId, {
            text: '✅ O grupo foi reaberto automaticamente após verificação.'
          });
        } catch (reopenError) {}
      }, 5000);

    } catch (err) {
      // Silencioso em caso de erro geral
    }
  }

  // Método para adicionar domínios permitidos (opcional)
  addAllowedDomain(domain) {
    if (!this.allowedDomains.includes(domain)) {
      this.allowedDomains.push(domain);
    }
  }

  // Método para remover domínios permitidos (opcional)
  removeAllowedDomain(domain) {
    const index = this.allowedDomains.indexOf(domain);
    if (index > -1) {
      this.allowedDomains.splice(index, 1);
    }
  }

  // Método para listar domínios permitidos
  getAllowedDomains() {
    return [...this.allowedDomains];
  }
}

module.exports = AntiLinkHard2Manager;