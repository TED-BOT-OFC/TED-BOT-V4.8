const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const FormData = require('form-data');

module.exports = {
    comando: ['pixgallery', 'pixgal', 'catbox'],
    exec: async (sock, from, Info, args, prefix, sasah) => {
        try {
            const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: sasah });

            // Melhoria na detecção de imagem: verifica se é uma imagem direta ou marcada (quoted)
            const quoted = Info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const isQuotedImage = quoted?.imageMessage;
            const isImage = Info.message?.imageMessage;

            if (!isQuotedImage && !isImage) {
                return reply("❌ Envie ou marque uma imagem com o comando. Exemplo: #catbox\n\n*Nota:* O limite máximo de upload é de 200MB.");
            }

            // Define qual mensagem de imagem será processada
            const imageMessage = isQuotedImage ? quoted.imageMessage : isImage;

            await reply("⏳ Fazendo upload para o Catbox...\n\n_Lembrete: O tamanho máximo permitido é 200MB._");

            // Download da imagem do WhatsApp
            const stream = await downloadContentFromMessage(imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            // Verificação de tamanho (200MB = 200 * 1024 * 1024 bytes)
            const maxSize = 200 * 1024 * 1024;
            if (buffer.length > maxSize) {
                return reply(`❌ O arquivo é muito grande! O limite do Catbox é de 200MB. Seu arquivo tem ${(buffer.length / (1024 * 1024)).toFixed(2)}MB.`);
            }

            // Preparação do FormData para o Catbox
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', buffer, {
                filename: 'upload.jpg',
                contentType: 'image/jpeg'
            });

            // Upload para a API do Catbox
            const uploadResponse = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: {
                    ...form.getHeaders()
                }
            });

            const fileUrl = uploadResponse.data;

            if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.startsWith('http')) {
                throw new Error("Não foi possível obter o link do Catbox. Resposta: " + fileUrl);
            }

            // Extração de informações do link
            const fileName = fileUrl.split('/').pop();

            const mensagemFinal = `✅ *Upload concluído com sucesso!*\n\n` +
                `🔗 *Link Direto:* ${fileUrl}\n` +
                `📄 *Nome do Arquivo:* ${fileName}\n` +
                `🌐 *Serviço:* Catbox.moe\n` +
                `⚖️ *Tamanho:* ${(buffer.length / (1024 * 1024)).toFixed(2)}MB\n\n` +
                `_Nota: O limite do serviço é 200MB. Uploads anônimos não podem ser deletados._`;

            // Tenta baixar a imagem para enviar como prévia
            let imageBuffer;
            try {
                const imageResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
                imageBuffer = Buffer.from(imageResponse.data);
            } catch {
                imageBuffer = null;
            }

            if (imageBuffer) {
                await sock.sendMessage(from, { image: imageBuffer, caption: mensagemFinal }, { quoted: sasah });
            } else {
                await sock.sendMessage(from, { text: mensagemFinal }, { quoted: sasah });
            }

        } catch (e) {
            console.error("Erro no upload Catbox:", e);
            let errorMsg = "❌ Erro ao realizar upload para o Catbox.";

            if (e.response) {
                errorMsg += `\nStatus: ${e.response.status}\nDetalhes: ${e.response.data || 'Sem detalhes'}`;
            } else {
                errorMsg += `\nDetalhes: ${e.message}`;
            }

            await sock.sendMessage(from, { text: errorMsg }, { quoted: sasah });
        }
    }
};
