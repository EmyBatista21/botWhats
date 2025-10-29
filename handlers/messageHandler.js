// 💬 handlers/messageHandler.js

const { sendMessageSafe, getAllParticipants, isAdmin } = require('../utils');
const { commands, autoResponses } = require('../config');

// Defina os comandos que requerem permissão de administrador
const ADMIN_COMMANDS = ['!pausar', '!remover', '!aviso'];

/**
 * Função auxiliar para verificar permissão e enviar aviso.
 */
async function checkAdminPermission(client, message, chat, command) {
  
  if (!chat.isGroup) {
      // Permite !pausar no PV (embora só afete grupos configurados)
      return command !== '!pausar' ? true : true; 
  }
  
  let senderId = message.author; // O ID original (@lid)
  const chatId = chat.id._serialized;
  
  if (!senderId) {
      console.error("❌ FALHA: ID do remetente nulo.");
      return false; 
  }

  // CORREÇÃO CRÍTICA DO FORMATO: Tenta serializar o ID para o formato correto.
  try {
      const contact = await client.getContactById(message.author);
      senderId = contact.id._serialized; // Pega o ID no formato oficial/serializado
  } catch (e) {
      // Fallback em caso de falha na consulta (lógica que resolveu o problema do @lid)
      if (senderId.includes('@lid')) {
          senderId = senderId.replace('@lid', '@c.us');
      } else if (!senderId.includes('@')) {
          senderId = `${senderId}@c.us`;
      }
  }

  const isGroupAdmin = await isAdmin(client, chatId, senderId);

  if (!isGroupAdmin) {
    console.log(`🚫 Bloqueado: ${senderId} tentou usar ${command} sem ser admin.`);
    await sendMessageSafe(client, message.from, `🚫 O comando **${command}** só pode ser usado por administradores do grupo.`);
    return false;
  }
  
  console.log(`✅ Permissão Concedida: ${senderId} é admin e usou ${command}.`);
  return true;
}


/**
 * Trata as mensagens recebidas e executa comandos ou respostas automáticas.
 * @param {Client} client Instância do cliente
 * @param {Message} message Objeto da mensagem recebida
 */
async function handleMessage(client, message) {
  const text = message.body.trim();
  const lowerText = text.toLowerCase();
  const chat = await message.getChat();

  // 6️⃣ Log das mensagens recebidas
  console.log(`📌 Mensagem de ${message.from}: ${message.body}`);

  // Verifica se o comando é restrito a admins
  const commandUsed = lowerText.split(' ')[0];
  const isRestrictedCommand = ADMIN_COMMANDS.includes(commandUsed);

  if (isRestrictedCommand) {
    const hasPermission = await checkAdminPermission(client, message, chat, commandUsed);
    if (!hasPermission) {
      return; // Para a execução se não for admin
    }
  }

  // --- Lógica dos Comandos ---

  // 1️⃣ Comando pausar
  if (lowerText === '!pausar') {
    return handlePauseCommand(client, message);
  }

  // 2️⃣ Comando remover participante pelo @
  if (lowerText.startsWith('!remover')) {
    return handleRemoveCommand(client, message, chat);
  }

  // 3️⃣ Comando menção fantasma (!aviso)
  if (lowerText.startsWith('!aviso')) {
    return handleAvisoCommand(client, message, chat);
  }

  // NOVO: 4️⃣ Comando Listar Admins
  if (lowerText === '!admins') { 
    return handleVerAdminCommand(client, message, chat);
  }
  
  // 5️⃣ Outros comandos (do config.commands)
  if (commands[lowerText]) {
    await sendMessageSafe(client, message.from, commands[lowerText]);
    return;
  }

  // 6️⃣ Respostas automáticas
  handleAutoResponses(client, message, text);
}

/**
 * Trata o comando !pausar
 */
async function handlePauseCommand(client, message) {
  const { scheduledMessages } = require('../config'); 

  console.log('⚠️ Comando !pausar recebido. Enviando aviso para os grupos...');
  
  for (const item of scheduledMessages) {
    await sendMessageSafe(client, item.chatId, '⚠️ O bot vai se desligar agora.');
  }

  console.log('✅ Avisos enviados. Aguardando 3 segundos antes de encerrar...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  process.exit();
}

/**
 * Trata o comando !remover
 */
async function handleRemoveCommand(client, message, chat) {
  if (!message.mentionedIds.length) {
    await sendMessageSafe(client, message.from, '❌ Por favor, mencione o usuário que deseja remover.');
    return;
  }

  try {
    await chat.removeParticipants(message.mentionedIds);
    await sendMessageSafe(client, message.from, '✅ Usuário removido com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao remover participante:', err.message);
    await sendMessageSafe(client, message.from, '❌ Não foi possível remover o participante. Verifique se o bot é administrador e se tem permissão.');
  }
}

/**
 * Trata o comando !aviso
 */
async function handleAvisoCommand(client, message, chat) {
  if (!chat.isGroup) {
      await sendMessageSafe(client, message.from, '❌ O comando !aviso só pode ser usado em grupos.');
      return;
  }

  const avisoMsg = message.body.trim().replace('!aviso', '').trim();
  if (!avisoMsg) {
    await sendMessageSafe(client, message.from, '⚠️ Use assim: !aviso [sua mensagem]');
    return;
  }

  const participants = await getAllParticipants(client, chat.id._serialized);

  // Envia mensagem "silenciosa" mencionando todos sem mostrar os @
  await sendMessageSafe(client, chat.id._serialized, avisoMsg, { mentions: participants });
  console.log(`📣 Aviso enviado para ${participants.length} membros do grupo ${chat.name}`);
}

/**
 * Trata o comando para listar e mencionar todos os administradores do grupo
 */
async function handleVerAdminCommand(client, message, chat) {
  if (!chat.isGroup) {
    await sendMessageSafe(client, message.from, '❌ Este comando só pode ser usado em grupos.');
    return;
  }

  try {
    // 1. Força a obtenção dos metadados do chat para ter a lista mais recente
    let groupMetadata = chat;
    if (typeof chat.fetchGroupMetadata === 'function') {
        groupMetadata = await chat.fetchGroupMetadata();
    }
    
    // 2. Filtra a lista para encontrar todos os admins
    // A lista de participantes vem diretamente de groupMetadata.participants
    const admins = groupMetadata.participants.filter(p => p.isAdmin || p.isSuperAdmin);

    await sendMessageSafe(client, message.from, '🫡 Comando recebido. Buscando administradores...');
    
    if (admins.length === 0) {
      await sendMessageSafe(client, message.from, '⚠️ Não há administradores neste grupo (exceto, talvez, o criador).');
      return;
    }

    // 3. Monta a mensagem e a lista de IDs para menção
    let responseText = '👑 **ADMINISTRADORES DO GRUPO:**\n\n';
    let mentionsArray = [];
    
    admins.forEach((admin, index) => {
      const adminId = admin.id._serialized;
      mentionsArray.push(adminId);
      
      // Adiciona o número do telefone na mensagem, sem o @ para evitar poluição visual
      // O ID completo é usado no array 'mentions' para a notificação
      responseText += `${index + 1}. @${adminId.split('@')[0]}\n`; 
    });

    // 4. Envia a mensagem, usando a opção 'mentions' para notificar os admins
    await sendMessageSafe(client, message.from, responseText, {
      mentions: mentionsArray
    });

  } catch (err) {
    console.error('❌ Erro ao listar administradores:', err.message);
    await sendMessageSafe(client, message.from, '❌ Ocorreu um erro ao buscar os administradores. Verifique se o bot é administrador do grupo.');
  }
}


/**
 * Trata respostas automáticas
 */
function handleAutoResponses(client, message, text) {
  Object.keys(autoResponses).forEach(async (keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(text)) {
      await sendMessageSafe(client, message.from, autoResponses[keyword]);
    }
  });
}

module.exports = { handleMessage };