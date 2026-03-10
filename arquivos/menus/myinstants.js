const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function myinstantsCommand({ sock, from, args, Info, prefix }) {
    const reply = (texto) => sock.sendMessage(from, { text: texto }, { quoted: Info });

    try {
        const query = args.join(" ");
        if (!query) return reply(`❌ Por favor, digite o nome do áudio que deseja buscar.\nExemplo: ${prefix}myinstants cavalo`);

        // Notifica o usuário que a busca começou
        await reply(`🔎 Buscando "${query}" no MyInstants...`);

        // URL de busca do MyInstants
        const searchUrl = `https://www.myinstants.com/pt/search/?name=${encodeURIComponent(query)}`;
        
        const { data: html } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(html);
        const results = [];

        $('.instant').each((i, el) => {
            if (i < 5) { // Limitar aos 5 primeiros resultados para não sobrecarregar
                const name = $(el).find('.instant-link').text().trim();
                const link = 'https://www.myinstants.com' + $(el).find('.instant-link').attr('href');
                const onclick = $(el).find('.small-button').attr('onclick');
                const audioPath = onclick ? onclick.match(/'(.*?)'/)[1] : null;
                
                if (name && audioPath) {
                    results.push({
                        name,
                        link,
                        audio: 'https://www.myinstants.com' + audioPath
                    });
                }
            }
        });

        if (results.length === 0) {
            return reply(`❌ Nenhum áudio encontrado para "${query}".`);
        }

        // Pega o primeiro resultado (mais relevante)
        const topResult = results[0];

        // Baixa o áudio
        const audioResponse = await axios.get(topResult.audio, { responseType: 'arraybuffer' });
        const audioBuffer = Buffer.from(audioResponse.data);

        // Envia o áudio para o usuário
        await sock.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${topResult.name}.mp3`,
            ptt: false
        }, { quoted: Info });

        // Opcional: Enviar uma mensagem com o nome do áudio enviado
        // await reply(`✅ Enviando áudio: *${topResult.name}*`);

    } catch (err) {
        console.error("❌ Erro no MyInstants:", err);
        await reply("❌ Ocorreu um erro ao buscar ou enviar o áudio.");
    }
};
