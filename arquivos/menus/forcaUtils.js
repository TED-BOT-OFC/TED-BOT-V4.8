const palavrasForca = [
  { tema: 'Fruta', palavra: 'banana', dica: 'Amarela e longa' },
  { tema: 'Animal', palavra: 'elefante', dica: 'Maior animal terrestre' },
  { tema: 'País', palavra: 'brasil', dica: 'Tem o Cristo Redentor' },
  { tema: 'Objeto', palavra: 'computador', dica: 'Usado para programar' },
  { tema: 'Planeta', palavra: 'marte', dica: 'Conhecido como planeta vermelho' },
  { tema: 'Filme', palavra: 'avatar', dica: 'Azuis e Pandora' },
  { tema: 'Profissão', palavra: 'engenheiro', dica: 'Trabalha com projetos' }
];

// Jogos em andamento (id: grupo ou usuário)
const jogosForca = {};

// Boneco da forca (etapas de erro)
const bonecoForca = [
  `
    +---+
        |
        |
        |
       ===`,
  `
    +---+
    O   |
        |
        |
       ===`,
  `
    +---+
    O   |
    |   |
        |
       ===`,
  `
    +---+
    O   |
   /|   |
        |
       ===`,
  `
    +---+
    O   |
   /|\\  |
        |
       ===`,
  `
    +---+
    O   |
   /|\\  |
   /    |
       ===`,
  `
    +---+
    O   |
   /|\\  |
   / \\  |
       ===`,
];

// 🆕 Iniciar novo jogo
function iniciarJogoForca(id) {
  if (palavrasForca.length === 0) return null;

  const sorteio = palavrasForca[Math.floor(Math.random() * palavrasForca.length)];
  const palavra = sorteio.palavra.toLowerCase();
  const tema = sorteio.tema;
  const dica = sorteio.dica;

  jogosForca[id] = {
    palavra,
    tema,
    dica,
    display: Array(palavra.length).fill('_'),
    letrasUsadas: [],
    erros: 0,
    status: 'playing'
  };

  return jogosForca[id];
}

// 🎨 Mostrar estado atual do jogo
function getGameDisplay(jogo) {
  return `
🎯 Tema: ${jogo.tema}
💡 Dica: ${jogo.dica}

📝 Palavra: ${jogo.display.join(' ')}
🔠 Letras usadas: ${jogo.letrasUsadas.join(', ') || 'Nenhuma'}
❌ Erros: ${jogo.erros}/${bonecoForca.length - 1}

${bonecoForca[jogo.erros]}
  `;
}

// 🔍 Verificar letra ou palavra
function verificarLetra(id, tentativa) {
  const jogo = jogosForca[id];
  if (!jogo) return null;

  const tentativaFormatada = tentativa.toLowerCase();

  // Tentativa de letra única
  if (tentativaFormatada.length === 1) {
    if (jogo.letrasUsadas.includes(tentativaFormatada)) {
      jogo.status = 'repeated';
      return jogo;
    }

    if (!/^[a-záéíóúãõç]$/i.test(tentativaFormatada)) {
      jogo.status = 'invalid';
      return jogo;
    }

    jogo.letrasUsadas.push(tentativaFormatada);

    if (jogo.palavra.includes(tentativaFormatada)) {
      for (let i = 0; i < jogo.palavra.length; i++) {
        if (jogo.palavra[i] === tentativaFormatada) {
          jogo.display[i] = tentativaFormatada;
        }
      }
      jogo.status = jogo.display.includes('_') ? 'playing' : 'won';
    } else {
      jogo.erros++;
      jogo.status = jogo.erros >= bonecoForca.length - 1 ? 'lost' : 'playing';
    }

    return jogo;
  }

  // Tentativa de palavra inteira
  if (tentativaFormatada === jogo.palavra) {
    jogo.display = jogo.palavra.split('');
    jogo.status = 'won';
  } else {
    jogo.erros++;
    jogo.status = jogo.erros >= bonecoForca.length - 1 ? 'lost' : 'playing';
  }

  return jogo;
}

// ➕ Adicionar novas palavras dinamicamente
function addPalavraForca(tema, palavra, dica) {
  palavrasForca.push({
    tema: tema.toLowerCase(),
    palavra: palavra.toLowerCase(),
    dica
  });
}

module.exports = {
  jogosForca,
  palavrasForca,
  bonecoForca,
  iniciarJogoForca,
  getGameDisplay,
  verificarLetra,
  addPalavraForca
};