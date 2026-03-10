
🎰 O que é esse sistema de Bingo?

É uma função do bot onde você consegue:

✔️ Colocar os nomes das pessoas em números
✔️ Mostrar uma imagem do bingo
✔️ Exibir a lista atualizada de quem comprou cada número
✔️ Editar tudo isso a qualquer momento
✔️ Manter salvo mesmo se o bot desligar

Ou seja: dá pra rodar rifa, bingo beneficente, sorteio de números, tudo automático no WhatsApp.


---

🧠 Comando principal: #bingo

Quando você digita:

#bingo

O bot mostra:

A imagem do bingo

O texto de anúncio

A lista de números e participantes


É tipo o “painel geral” do seu bingo.


---

✍️ Como colocar o nome de alguém em um número

Quando alguém comprar um número, você usa:

#bingo set NÚMERO NOME

Exemplo:

#bingo set 10 João - Jataúba

O bot vai registrar que o número 10 agora pertence ao João.

🆕 Agora os números são ilimitados!

Antes era só de 01 a 30.
Agora pode ser:

#bingo set 31 Maria
#bingo set 57 Carlos
#bingo set 100 Ana

O sistema vai criando os números automaticamente conforme você usa. Muito mais flexível.


---

🖼️ Como mudar a imagem do bingo

Se você quiser trocar a imagem que aparece quando alguém usa #bingo:

#bingo img https://link-da-imagem.jpg

A partir daí, sempre que o bingo for exibido, vai aparecer essa nova imagem.


---

📝 Como mudar o texto do anúncio

Você também pode mudar a frase que acompanha o bingo:

#bingo texto Participe da nossa rifa beneficente!

Esse texto aparece junto com a imagem e a lista. Serve pra divulgar, explicar prêmio, valor, data do sorteio, etc.


---

🔄 Como limpar tudo e começar outro bingo

Depois que o sorteio acabar, é só usar:

#bingo reset

Isso apaga todos os nomes e deixa o bingo zerado pra você começar outro.

💾 Mesmo assim, enquanto você não usar o reset, os dados ficam salvos, mesmo se o bot desligar.


---

🔐 Sistema de Segurança (MUUUITO importante)

Agora não é qualquer um que pode mexer no bingo.

👑 Quem pode editar:

O dono do bot

Pessoas autorizadas pelo dono


➕ Autorizar alguém a ajudar

Responda uma mensagem da pessoa e use:

#bingo add

Pronto. Essa pessoa agora pode usar #bingo set, #bingo texto, #bingo img, etc.

➖ Remover a autorização

Responda a mensagem da pessoa e use:

#bingo remove

Ela perde o acesso de edição.

Isso evita que qualquer membro do grupo saia bagunçando seu bingo.
