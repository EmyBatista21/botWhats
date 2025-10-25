const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Inicializa o cliente com autenticação local
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
  console.log('📱 Escaneie o QR code:');
  qrcode.generate(qr, { small: true });
});

// Função segura para envio de mensagens
async function sendMessageSafe(chatId, text) {
  try {
    const cleanText = text.normalize("NFKC"); // normaliza caracteres
    await client.sendMessage(chatId, cleanText);
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem:', err.message);
  }
}

// Mensagens automáticas programadas
const scheduledMessages = [
  {
    chatId: '120363419682113226@g.us', // substitua pelo ID real do grupo
    message: '💡 Lembrete diário: não esqueçam de conferir as novidades!',
    interval: 1800000 // 30 minutos
  }
];

// Inicializa envio automático
scheduledMessages.forEach((item) => {
  setInterval(() => {
    sendMessageSafe(item.chatId, item.message);
  }, item.interval);
});

// Comandos dinâmicos em português
const commands = {
  '!ping': 'pong 🏓',
  '!ajuda': 'Lista de comandos:\n!ping\n!ajuda\n!menu\n!pausar\n!remover @',
  '!menu': 'Opções disponíveis:\n1. Status\n2. Informações\n3. Suporte',
  '!pausar': '⚠️ O bot vai se desligar agora.'
};

// Respostas automáticas
const autoResponses = {
  'bom dia': '🌞 Bom dia, pessoal!',
  'boa tarde': '☀️ Boa tarde, pessoal!',
  'boa noite': '🌙 Boa noite, pessoal!',
  'admin': 'Adicionar Usuario do Admin'
};

// Evento: bot conectado
client.on('ready', async () => {
  console.log('✅ Bot conectado!');

  // Aviso para todos os grupos
  for (const item of scheduledMessages) {
    await sendMessageSafe(item.chatId, '✅ O bot acabou de se conectar e está online!');
  }
});

// Evento: recebimento de mensagens
client.on('message', async (message) => {
  const text = message.body;

  // 1️⃣ Comando pausar
  if (text.toLowerCase() === '!pausar') {
    console.log('⚠️ Comando !pausar recebido. Enviando aviso para os grupos...');
    for (const item of scheduledMessages) {
      await sendMessageSafe(item.chatId, '⚠️ O bot vai se desligar agora.');
    }
    console.log('✅ Avisos enviados. Aguardando 3 segundos antes de encerrar...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    process.exit();
  }

  // 2️⃣ Comando remover participante pelo @
  if (text.toLowerCase().startsWith('!remover')) {
    const chat = await message.getChat();
    if (!message.mentionedIds.length) {
      await sendMessageSafe(message.from, '❌ Por favor, mencione o usuário que deseja remover.');
      return;
    }

    try {
      await chat.removeParticipants(message.mentionedIds);
      await sendMessageSafe(message.from, '✅ Usuário(s) removido(s) com sucesso.');
    } catch (err) {
      console.error('❌ Erro ao remover participante:', err.message);
      await sendMessageSafe(message.from, '❌ Não foi possível remover o participante. Verifique se você tem permissão.');
    }
    return;
  }

  // 3️⃣ Outros comandos dinâmicos
  if (commands[text.toLowerCase()]) {
    await sendMessageSafe(message.from, commands[text.toLowerCase()]);
    return;
  }

  // 4️⃣ Respostas automáticas
  Object.keys(autoResponses).forEach(async (keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i'); // case-insensitive
    if (regex.test(text)) {
      await sendMessageSafe(message.from, autoResponses[keyword]);
    }
  });

  // 5️⃣ Exibir chatId de qualquer mensagem (opcional)
  console.log(`📌 Mensagem de ${message.from}: ${message.body}`);
});

// Evento: boas-vindas para novos membros
client.on('group_join', async (notification) => {
  const chat = await notification.getChat();

  // Pega todos os IDs dos novos participantes
  const participants = notification.recipientIds || [notification.id._serialized];

  for (const participantId of participants) {
    const contact = await client.getContactById(participantId);
    const welcomeMessage = `👋 Olá, ${contact.pushname || contact.number}! Bem-vindo(a) ao grupo ${chat.name}!`;
    await sendMessageSafe(chat.id._serialized, welcomeMessage);
  }
});

client.initialize();
