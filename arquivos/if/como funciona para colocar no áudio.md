Para adicionar novos áudios que respondem a palavras-chave e respeitam o comando de ligar/desligar, você deve seguir estes três passos:

### 1. Criar o arquivo de função do áudio
Crie um novo arquivo na pasta `arquivos/if/` (por exemplo, `bomdia.js`). Você pode copiar o código do `amor.js` e apenas alterar o link do áudio e o nome da função:

```javascript
// arquivos/if/bomdia.js
const fs = require('fs');
const axios = require('axios');
const { convertAudioToOgg } = require('./convertAudio');

async function enviarAudioBomDia(from, sock, Info) {
  const audioLink = "LINK_DO_SEU_AUDIO_AQUI"; // Link direto do MP3
  // ... resto do código igual ao amor.js ...
}

module.exports = { enviarAudioBomDia };
```

### 2. Importar no `index.js`
No topo do seu arquivo `index.js`, onde estão os outros `require`, adicione a importação da sua nova função:

```javascript
const { enviarAudioBomDia } = require('./arquivos/if/bomdia.js');
```

### 3. Adicionar o Gatilho (Trigger)
Localize no `index.js` o bloco onde colocamos a verificação `if (areAudiosEnabled())` e adicione sua nova palavra-chave ali dentro:

```javascript
// 🔥 Gatilho de palavra-chave (áudio)
if (areAudiosEnabled()) {
  if (body.toLowerCase().includes("amor")) {
    await enviarAudioAmor(from, sock, Info);
  }

  if (body.toLowerCase().includes("gay")) {
    await enviarAudioGay(from, sock, Info);
  }

  // ADICIONE O NOVO AQUI:
  if (body.toLowerCase().includes("bom dia")) {
    await enviarAudioBomDia(from, sock, Info);
  }
}
```

### Dica Importante:
Ao colocar o novo gatilho dentro do bloco `if (areAudiosEnabled())`, ele automaticamente passará a obedecer aos comandos `/audios on` e `/audios off` que criamos. Se você desativar, todos os áudios (amor, gay e o novo) pararão de funcionar juntos.