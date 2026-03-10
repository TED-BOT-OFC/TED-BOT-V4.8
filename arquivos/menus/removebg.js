const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'removebg',
    alias: ['rbg', 'removerfundo'],
    description: 'Remove o fundo de uma imagem',
    category: 'Utilidades',
    async execute(sock, from, Info, args, command, config) {
        try {
            const quoted = Info.message?.extendedTextMessage?.contextInfo?.quotedMessage || {};
            const msgContent = Info.message || {};
            
            const isImage = !!msgContent.imageMessage || !!quoted.imageMessage;
            
            if (!isImage) {
                return sock.sendMessage(from, {
                    text: "❌ Envie ou marque uma imagem para remover o fundo."
                }, { quoted: Info });
            }

            const mediaObj = msgContent.imageMessage || quoted.imageMessage;
            
            await sock.sendMessage(from, { react: { text: "✂️", key: Info.key } });

            // Baixa a imagem
            const stream = await downloadContentFromMessage(mediaObj, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const boundary = '---' + Date.now();
            const formData = Buffer.concat([
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="i.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
                buffer,
                Buffer.from(`\r\n--${boundary}--\r\n`)
            ]);

            const { data } = await axios.post('https://systemzone.store/api/removebg', formData, {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`
                }
            });

            if (!data.status) {
                await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
                return sock.sendMessage(from, { text: "❌ Falha ao remover o fundo da imagem." }, { quoted: Info });
            }

            await sock.sendMessage(from, { 
                image: { url: data.imagem }, 
                caption: "✅ Fundo removido com sucesso!" 
            }, { quoted: Info });
            
            await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });

        } catch (error) {
            console.error('❌ Erro no comando removebg:', error);
            await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
            await sock.sendMessage(from, { text: "❌ Ocorreu um erro ao processar a imagem." }, { quoted: Info });
        }
    }
};
