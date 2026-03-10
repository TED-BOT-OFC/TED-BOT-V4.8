const axios = require("axios");
const fs = require("fs");
const path = require("path");

const playpriCommand = require("./playpri.js");
const MEDIA_STORAGE_PATH = playpriCommand.mediaStorage;

async function tedCommand(sock, from, Info, args, prefix, API_KEY_TED) {
    const emojiSuccess = ["💥", "✨", "🌟", "🔥", "💫", "💢", "💦"];
    const randomEmoji = emojiSuccess[Math.floor(Math.random() * emojiSuccess.length)];
    
    try {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: Info });
        
        const question = args.join(" ");
        if (!question) {
            await sock.sendMessage(from, { 
                react: { text: "❌", key: Info.key } 
            });
            return reply(`🤖 *TED BOT IA V4.6*\n━━━━━━━━━━━━━━━━━━━━\n📌 *Uso:* ${prefix}ted <sua pergunta>\n\n📝 *Exemplos:*\n• ${prefix}ted quem criou você?\n• ${prefix}ted como baixar vídeos?\n• ${prefix}ted me explique os comandos\n━━━━━━━━━━━━━━━━━━━━`);
        }
        
        await sock.sendMessage(from, { 
            react: { text: "⏳", key: Info.key } 
        });
        
        const storagePath = path.resolve(MEDIA_STORAGE_PATH);
        
        let systemPrompt = "";
        
        if (fs.existsSync(storagePath)) {
            try {
                const content = fs.readFileSync(storagePath, "utf8");
                const data = JSON.parse(content);
                
                if (data.conversation_template) {
                    systemPrompt = data.conversation_template
                        .replace(/\[PREFIX\]/g, prefix)
                        .replace(/\[QUESTION\]/g, question);
                } else {
                    systemPrompt = `Ted Bot V4.6: ${question}`;
                }
            } catch {
                systemPrompt = `Ted Bot: ${question}`;
            }
        } else {
            systemPrompt = `Você é o Ted Bot V4.6. Pergunta: ${question}`;
        }
        
        const apiUrl = `https://systemzone.store/api/systemai?q=${encodeURIComponent(systemPrompt)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;
        
        if (!data || data.status !== true || !data.response) {
            await sock.sendMessage(from, { 
                react: { text: "❌", key: Info.key } 
            });
            return reply("❌ A IA não respondeu. Tente novamente!");
        }
        
        const responseText = `🤖 *TED BOT IA V4.6*
━━━━━━━━━━━━━━━━━━━━
${data.response}
━━━━━━━━━━━━━━━━━━━━
⚡ *Use ${prefix}menu para ver todos os comandos!*`;
        
        await sock.sendMessage(from, { 
            text: responseText 
        }, { quoted: Info });
        
        await sock.sendMessage(from, { 
            react: { text: randomEmoji, key: Info.key } 
        });
        
    } catch (error) {
        await sock.sendMessage(from, { 
            react: { text: "❌", key: Info.key } 
        });
        await sock.sendMessage(from, { 
            text: "❌ Erro ao processar sua pergunta."
        }, { quoted: Info });
    }
}

module.exports = tedCommand;