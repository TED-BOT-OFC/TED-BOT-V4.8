const axios = require("axios");

async function perfilffCommand(sock, from, Info, args, prefix, API_KEY_TED) {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: Info });

    try {
        const id = args[0];
        if (!id) {
            return reply(`❌ *ERRO:* Você precisa informar o ID do Free Fire!\n\n📌 *Uso:* ${prefix}perfilff <ID>\n💡 *Exemplo:* ${prefix}perfilff 121440556`);
        }

        await sock.sendMessage(from, { react: { text: "⏳", key: Info.key } });

        const apiUrl = `https://tedzinho.com.br/api/perfilff?apikey=${API_KEY_TED}&id=${id}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.status !== "OK" || !data.resultado || data.resultado.status !== "OK") {
            await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
            return reply("❌ *ERRO:* Não foi possível encontrar informações para este ID. Verifique se o ID está correto.");
        }

        const res = data.resultado;
        const perfil = res.perfil;
        const datas = res.datas;
        const guilda = res.guilda;

        const menuText = `╭─❑ 𝐏𝐄𝐑𝐅𝐈𝐋 𝐅𝐑𝐄𝐄 𝐅𝐈𝐑𝐄 ❑─╮
│
│ 👤 *Nick:* ${perfil.nick}
│ 🆔 *ID:* ${perfil.id}
│ 🆙 *Nível:* ${perfil.level}
│ ❤️ *Likes:* ${perfil.likes}
│ 🌎 *Região:* ${perfil.regiao}
│ ✨ *XP:* ${perfil.xp}
│ 🎫 *Booyah Pass:* ${perfil.booyah}
│ 🎮 *Versão:* ${perfil.versao}
│ 📝 *Bio:* ${perfil.bio}
│
├─❑ 𝐃𝐀𝐓𝐀𝐒 ❑─╮
│ 📅 *Criação:* ${datas.criacao}
│ 🕒 *Último Login:* ${datas.ultimo_login}
│
├─❑ 𝐆𝐔𝐈𝐋𝐃𝐀 ❑─╮
│ 🛡️ *Nome:* ${guilda.nome}
│ 🆔 *ID:* ${guilda.id}
│ 📈 *Nível:* ${guilda.nivel}
│ 👥 *Membros:* ${guilda.membros}
│
╰─❑ 𝐓𝐄𝐃-𝐁𝐎𝐓 ❑─╯`;

        await sock.sendMessage(from, {
            image: { url: perfil.avatar },
            caption: menuText
        }, { quoted: Info });

        await sock.sendMessage(from, { react: { text: "✅", key: Info.key } });

    } catch (error) {
        console.error("Erro no comando perfilff:", error);
        await sock.sendMessage(from, { react: { text: "❌", key: Info.key } });
        reply("❌ *ERRO:* Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.");
    }
}

module.exports = perfilffCommand;
