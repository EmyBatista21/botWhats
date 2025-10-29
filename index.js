// 🚀 index.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { scheduledMessages, BOT_STATUS_MESSAGE, WELCOME_MESSAGE_GROUP } = require('./config');
const { sendMessageSafe } = require('./utils');
const { handleMessage } = require('./handlers/messageHandler');
const { handleGroupJoin } = require('./handlers/groupHandler');

// Inicializa o cliente com autenticação local
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
  console.log('📱 Escaneie o QR code:');
    
    // 1. Geração limpa da string Data URL
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error('Erro ao gerar Data URL:', err);
            return;
        }
        
        // 2. Imprime a string limpa que o navegador pode ler
        console.log('🚨 QR Code Data URL (Copie e cole no navegador para escanear):');
        console.log(url); 
    }); 
});

client.on('authenticated', () => {
  console.log('✅ Autenticado!');
});

client.on('auth_failure', msg => {
  console.error('❌ Falha na autenticação', msg);
});

// Evento: bot conectado
client.on('ready', async () => {
  console.log('✅ Bot conectado!');

  // Inicializa envio automático e envia mensagem de status de conexão
  scheduledMessages.forEach((item) => {
    // A função utilitária agora precisa do objeto client
    setInterval(() => {
      sendMessageSafe(client, item.chatId, item.message);
    }, item.interval);

    // Envia mensagens de status inicial
    sendMessageSafe(client, item.chatId, BOT_STATUS_MESSAGE);
    sendMessageSafe(client, item.chatId, WELCOME_MESSAGE_GROUP);
  });
});

// Evento: recebimento de mensagens (conectado ao handler modularizado)
client.on('message', (message) => handleMessage(client, message));

// Evento: boas-vindas para novos membros (conectado ao handler modularizado)
client.on('group_join', (notification) => handleGroupJoin(client, notification));

client.initialize();