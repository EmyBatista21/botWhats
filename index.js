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
async function sendMessageSafe(chatId, text, options = {}) {
  try {
    const cleanText = text.normalize("NFKC");
    await client.sendMessage(chatId, cleanText, options);
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem:', err.message);
  }
}

// Função para obter todos os membros do grupo
async function getAllParticipants(chatId) {
  const chat = await client.getChatById(chatId);
  return chat.participants.map(p => p.id._serialized);
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

// Comandos dinâmicos
const commands = {
  '!ping': 'pong 🏓',
  '!ajuda': 'Lista de comandos:\n!ping\n!ajuda\n!menu\n!pausar\n!remover @\n!aviso [mensagem]',
  '!menu': 'Opções disponíveis:\n1. Status\n2. Informações\n3. Suporte',
  '!pausar': '⚠️ Cururu vai dormir agora 💤😴💤.'
};

// Respostas automáticas simples
const autoResponses = {
  'oie bot': 'Olá',
  'bom dia bot': '🌞 Bom dia, pessoal!',
  'boa tarde bot': '☀️ Boa tarde, pessoal!',
  'boa noite bot': '🌙 Boa noite, pessoal!',
  'ver admin bot': 'Mostrar Usuarios do Admin'
};

// Evento: bot conectado
client.on('ready', async () => {
  console.log('✅ Bot conectado!');

  for (const item of scheduledMessages) {
    await sendMessageSafe(item.chatId, '✅ Cururu acabou de se conectar e está online!');
    await sendMessageSafe(item.chatId, 'Olá pessoal');
  }
});

// Evento: recebimento de mensagens
client.on('message', async (message) => {
  const text = message.body.trim();
  const chat = await message.getChat();

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
    if (!message.mentionedIds.length) {
      await sendMessageSafe(message.from, '❌ Por favor, mencione o usuário que deseja remover.');
      return;
    }

    try {
      await chat.removeParticipants(message.mentionedIds);
      await sendMessageSafe(message.from, '✅ Usuário removido com sucesso.');
    } catch (err) {
      console.error('❌ Erro ao remover participante:', err.message);
      await sendMessageSafe(message.from, '❌ Não foi possível remover o participante. Verifique se você tem permissão.');
    }
    return;
  }

  // 3️⃣ Comando menção fantasma (!aviso)
  if (text.toLowerCase().startsWith('!aviso')) {
    const avisoMsg = text.replace('!aviso', '').trim();
    if (!avisoMsg) {
      await sendMessageSafe(message.from, '⚠️ Use assim: !aviso [sua mensagem]');
      return;
    }

    const participants = await getAllParticipants(chat.id._serialized);

    // Envia mensagem "silenciosa" mencionando todos sem mostrar os @
    await sendMessageSafe(chat.id._serialized, avisoMsg, { mentions: participants });
    console.log(`📣 Aviso enviado para ${participants.length} membros do grupo ${chat.name}`);
    return;
  }

  // 4️⃣ Outros comandos
  if (commands[text.toLowerCase()]) {
    await sendMessageSafe(message.from, commands[text.toLowerCase()]);
    return;
  }

  // 5️⃣ Respostas automáticas
  Object.keys(autoResponses).forEach(async (keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(text)) {
      await sendMessageSafe(message.from, autoResponses[keyword]);
    }
  });

  // 6️⃣ Log das mensagens recebidas
  console.log(`📌 Mensagem de ${message.from}: ${message.body}`);
});

// Evento: boas-vindas para novos membros
client.on('group_join', async (notification) => {
  const chat = await notification.getChat();
  const participants = notification.recipientIds || [notification.id._serialized];

  for (const participantId of participants) {
    const contact = await client.getContactById(participantId);
    const welcomeMessage = `👋 Olá, ${contact.pushname || contact.number}! Bem-vinda ao grupo ${chat.name}!`;
    await sendMessageSafe(chat.id._serialized, welcomeMessage);
  }
});

client.initialize();
