// index.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const { sendMessageSafe } = require('./utils/whatsapp');
const { scheduledMessages } = require('./commands');
const { handleMessage } = require('./handlers/messageHandler');
const { handleGroupJoin } = require('./handlers/groupHandler'); // Assumindo que você criará este

// Inicializa o cliente com autenticação local
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
  console.log('📱 Escaneie o QR code:');
  qrcode.generate(qr, { small: true });
});

// Evento: bot conectado
client.on('ready', async () => {
  console.log('✅ Bot conectado!');

  // Inicializa envio automático
  scheduledMessages.forEach((item) => {
    setInterval(() => {
      // Passa o objeto client como primeiro argumento
      sendMessageSafe(client, item.chatId, item.message);
    }, item.interval);
  });

  // Mensagens iniciais
  for (const item of scheduledMessages) {
    await sendMessageSafe(client, item.chatId, '✅ Cururu acabou de se conectar e está online!');
    await sendMessageSafe(client, item.chatId, 'Olá pessoal');
  }
});

// Evento: recebimento de mensagens
client.on('message', async (message) => {
  const result = await handleMessage(client, message);

  // Lógica de desligamento - tratada aqui porque afeta o processo global
  if (result === 'PAUSAR') {
    console.log('⚠️ Comando !pausar recebido. Enviando aviso para os grupos...');
    for (const item of scheduledMessages) {
      await sendMessageSafe(client, item.chatId, '⚠️ O bot vai se desligar agora.');
    }
    console.log('✅ Avisos enviados. Aguardando 3 segundos antes de encerrar...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    process.exit();
  }
});

// Evento: boas-vindas para novos membros (Opcional: Mantenha ou mova para handlers/group.js)
client.on('group_join', async (notification) => {
  const chat = await notification.getChat();
  const participants = notification.recipientIds || [notification.id._serialized];

  for (const participantId of participants) {
    const contact = await client.getContactById(participantId);
    const welcomeMessage = `👋 Olá, ${contact.pushname || contact.number}! Bem-vinda ao grupo ${chat.name}!`;
    await sendMessageSafe(client, chat.id._serialized, welcomeMessage);
  }
});

client.initialize();