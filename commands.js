// commands.js

const commands = {
  '!ping': 'pong 🏓',
  '!ajuda': 'Lista de comandos:\n!ping\n!ajuda\n!menu\n!pausar\n!remover @\n!aviso [mensagem]',
  '!menu': 'Opções disponíveis:\n1. Status\n2. Informações\n3. Suporte',
  '!pausar': '⚠️ Cururu vai dormir agora 💤😴💤.'
};

const autoResponses = {
  'oie bot': 'Olá',
  'bom dia bot': '🌞 Bom dia, pessoal!',
  'boa tarde bot': '☀️ Boa tarde, pessoal!',
  'boa noite bot': '🌙 Boa noite, pessoal!',
  'ver admin bot': 'Mostrar Usuarios do Admin'
};

const scheduledMessages = [
  {
    chatId: '120363419682113226@g.us', // substitua pelo ID real do grupo
    message: '💡 Lembrete diário: não esqueçam de conferir as novidades!',
    interval: 1800000 // 30 minutos
  }
];

module.exports = {
  commands,
  autoResponses,
  scheduledMessages,
};