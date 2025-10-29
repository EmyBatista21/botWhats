// ⚙️ config.js

/**
 * Configurações Gerais
 */
const BOT_STATUS_MESSAGE = '✅ Cururu acabou de conectar e está online!';
const WELCOME_MESSAGE_GROUP = 'Olá pessoal';

/**
 * Mensagens automáticas programadas
 * chatId deve ser o ID real do grupo (ex: '120363419682113226@g.us')
 */
const scheduledMessages = [
  {
    chatId: '120363419682113226@g.us', // Substitua pelo ID real do grupo
    message: '💡 Lembrete diário: Inserir regras aqui!',
    interval: 1800000 // 30 minutos (1800000 ms)
  }
];

/**
 * Comandos dinâmicos
 */
const commands = {
  '!ping': 'pong 🏓',
  '!ajuda': 'Lista de comandos:\n!ping\n!ajuda\n!menu\n!pausar\n!remover @\n!aviso [mensagem]\n!admins',
  '!menu': 'Opções disponíveis:\n1. Status\n2. Informações\n3. Suporte',
  '!pausar': '⚠️ Cururu vai dormir agora 💤😴💤.'
};

/**
 * Respostas automáticas simples
 */
const autoResponses = {
  'oie bot': 'Olá',
  'bom dia bot': '🌞 Bom dia, pessoal!',
  'boa tarde bot': '☀️ Boa tarde, pessoal!',
  'boa noite bot': '🌙 Boa noite, pessoal!',
  'ver admin bot': '🫡 Comando recebido. Buscando administradores...'
};

module.exports = {
  scheduledMessages,
  commands,
  autoResponses,
  BOT_STATUS_MESSAGE,
  WELCOME_MESSAGE_GROUP
};