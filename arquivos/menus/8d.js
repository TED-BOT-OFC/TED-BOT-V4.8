const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

// Diretório temporário para processamento de áudio
const tempDir = path.join(__dirname, '..', '..', 'temp');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

module.exports = async (sock, sasah, Info, { from, prefix }) => {
    try {
        const contextInfo = Info.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = contextInfo?.quotedMessage;
        const audioMsg = quotedMsg?.audioMessage || Info.message?.audioMessage;

        if (!audioMsg) {
            return sock.sendMessage(from, {
                text: `❌ Envie ou responda um áudio.\n\nExemplo:\n${prefix}8d`
            }, { quoted: sasah });
        }

        await sock.sendMessage(from, {
            text: `🎧 *Convertendo áudio para 8D (360°)...*\n\nVolume normalizado e efeito 360° aplicado.`
        }, { quoted: sasah });

        // Download do áudio
        const stream = await downloadContentFromMessage(audioMsg, 'audio');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const id = Date.now();
        const input = path.join(tempDir, `in_${id}.mp3`);
        const output = path.join(tempDir, `out_${id}.mp3`);

        fs.writeFileSync(input, buffer);

        /**
         * FILTRO 8D OTIMIZADO:
         * 1. apulsator: Cria o efeito de rotação (hz=0.125 = 8 segundos por volta).
         * 2. volume=1.5: Aplica um ganho de 50% no volume para compensar a perda do filtro.
         * 3. dynaudnorm: Normaliza o áudio dinamicamente para manter o volume alto sem estourar.
         */
        const args = [
            '-i', input,
            '-af', 'apulsator=hz=0.125:amount=1:offset_l=0:offset_r=0.5,volume=1.5,dynaudnorm',
            '-y',
            output
        ];

        execFile('ffmpeg', args, async (err) => {
            if (err) {
                console.error("Erro FFmpeg:", err);
                if (fs.existsSync(input)) fs.unlinkSync(input);
                return sock.sendMessage(from, { text: '❌ Erro ao processar o áudio.' }, { quoted: sasah });
            }

            await sock.sendMessage(from, {
                audio: fs.readFileSync(output),
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: sasah });

            // Limpeza de arquivos temporários
            if (fs.existsSync(input)) fs.unlinkSync(input);
            if (fs.existsSync(output)) fs.unlinkSync(output);
        });

    } catch (err) {
        console.error("Erro no comando 8D:", err);
        sock.sendMessage(from, {
            text: '❌ Ocorreu um erro inesperado ao processar o comando.'
        }, { quoted: sasah });
    }
}
