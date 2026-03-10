const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const webp = require('node-webpmux');

const execAsync = promisify(exec);

module.exports = {
  name: 'brat',
  alias: ['b', 'bratsticker'],
  description: 'Gera imagem BRAT e envia figurinha',
  category: 'Utilidades',

  async execute(sock, from, Info, args, command, config) {
    try {
      if (!args[0]) {
        return sock.sendMessage(from, {
          text: '❌ Use: !brat seu texto aqui'
        }, { quoted: Info });
      }

      const texto = args.join(' ');
      const pushname = Info.pushName || 'Usuário';
      const nomebot = config.NomeDoBot || config.nomebot || 'Bot';

      await sock.sendMessage(from, {
        react: { text: '⏳', key: Info.key }
      });

      const api = `https://systemzone.store/api/brat?text=${encodeURIComponent(texto)}`;
      const res = await axios.get(api);

      if (!res.data?.status || !res.data?.imagem) {
        return sock.sendMessage(from, {
          text: '❌ Erro ao gerar imagem.'
        }, { quoted: Info });
      }

      const imageUrl = res.data.imagem;

      const imgBuffer = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      }).then(r => Buffer.from(r.data));

      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const id = Date.now();
      const input = path.join(tempDir, `brat_${id}.png`);
      const output = path.join(tempDir, `brat_${id}.webp`);
      const final = path.join(tempDir, `brat_final_${id}.webp`);

      fs.writeFileSync(input, imgBuffer);

      // FFMPEG para converter para webp no tamanho correto
      await execAsync(`ffmpeg -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba" -vcodec libwebp -lossless 1 -preset picture -an -vsync 0 -y "${output}"`);

      const img = new webp.Image();
      await img.load(output);

      const pack = {
        'sticker-pack-id': `brat-${id}`,
        'sticker-pack-name': `Bot: ${nomebot}`,
        'sticker-pack-publisher': `Solicitante: ${pushname}`,
        emojis: ['🔥']
      };

      const exifAttr = Buffer.from([
        0x49,0x49,0x2a,0x00,
        0x08,0x00,0x00,0x00,
        0x01,0x00,
        0x41,0x57,
        0x07,0x00,
        0x00,0x00,
        0x00,0x00,
        0x16,0x00,
        0x00,0x00
      ]);

      const json = Buffer.from(JSON.stringify(pack), 'utf8');
      exifAttr.writeUInt32LE(json.length, 14);

      img.exif = Buffer.concat([exifAttr, json]);
      await img.save(final);

      await sock.sendMessage(from, {
        sticker: fs.readFileSync(final)
      }, { quoted: Info });

      await sock.sendMessage(from, {
        react: { text: '✅', key: Info.key }
      });

      // Limpeza segura
      setTimeout(() => {
        [input, output, final].forEach(f => {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        });
      }, 5000);

    } catch (err) {
      console.error('❌ Erro BRAT:', err);
      await sock.sendMessage(from, {
        text: '❌ Erro ao gerar figurinha.'
      }, { quoted: Info });
    }
  }
};
