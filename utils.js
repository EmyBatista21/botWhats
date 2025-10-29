// 🛠️ utils.js

/**
 * Função segura para envio de mensagens
 * @param {Client} client Instância do cliente whatsapp-web.js
 * @param {string} chatId ID do chat de destino
 * @param {string} text Texto da mensagem
 * @param {object} options Opções de envio (ex: { mentions: [...] })
 */
async function sendMessageSafe(client, chatId, text, options = {}) {
  try {
    const cleanText = text.normalize("NFKC");
    await client.sendMessage(chatId, cleanText, options);
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem:', err.message);
  }
}

/**
 * Função para obter todos os membros do grupo (IDs serializados)
 * ... (código inalterado)
 */
async function getAllParticipants(client, chatId) {
  try {
    const chat = await client.getChatById(chatId);
    if (chat && chat.participants) {
      return chat.participants.map(p => p.id._serialized);
    }
    return [];
  } catch (err) {
    console.error('❌ Erro ao obter participantes:', err.message);
    return [];
  }
}

/**
 * Verifica se um contato é um administrador ou co-administrador em um chat.
 * Tenta forçar a atualização dos metadados para resolver o cache de admin.
 * @param {Client} client Instância do cliente whatsapp-web.js
 * @param {string} chatId ID serializado do grupo
 * @param {string} participantId ID serializado do participante
 * @returns {Promise<boolean>} Retorna true se for admin/co-admin, false caso contrário.
 */
async function isAdmin(client, chatId, participantId) {
  try {
    const chat = await client.getChatById(chatId);
    
    if (!chat || !chat.isGroup) {
      return false; 
    }
    
    let participantsList = chat.participants;
    
    // Tenta forçar o recarregamento dos metadados do grupo (CRÍTICO)
    if (typeof chat.fetchGroupMetadata === 'function') {
        const metadata = await chat.fetchGroupMetadata();
        if (metadata && metadata.participants) {
            participantsList = metadata.participants;
        }
    }
    
    // --- LINHAS DE DEBBUG ---
    // Loga o ID que estamos procurando
    console.log(`[DEBUG ADMIN] Procurando Admin ID: ${participantId}`);
    
    // Encontra o participante
    const participant = participantsList.find(p => p.id._serialized === participantId);

    if (participant) {
        console.log(`[DEBUG ADMIN] Status encontrado: isAdmin=${participant.isAdmin}, isSuperAdmin=${participant.isSuperAdmin}`);
    } else {
        // Se o ID não for encontrado, é um problema de formato!
        console.log(`[DEBUG ADMIN] ID não encontrado na lista de participantes!`);
        // Para ver se o formato do ID é o problema, descomente as próximas duas linhas:
        // console.log(`[DEBUG ADMIN] IDs na lista:`);
        // participantsList.forEach(p => console.log(`    ${p.id._serialized} (Admin: ${p.isAdmin})`));
    }
    // --- FIM DEBBUG ---

    // Retorna o status
    const isActuallyAdmin = participant ? participant.isAdmin || participant.isSuperAdmin : false;
    
    if (isActuallyAdmin === false) {
        // Se ainda for falso, vamos checar se o bot tem permissão (auto-checagem)
        const botId = client.info.wid._serialized;
        const botParticipant = participantsList.find(p => p.id._serialized === botId);
        
        if (!botParticipant || (!botParticipant.isAdmin && !botParticipant.isSuperAdmin)) {
             console.error('⚠️ [DEBUG ADMIN] O BOT NÃO É ADMINISTRADOR DO GRUPO. O BOT PRECISA DE PERMISSÃO DE ADMIN PARA LER STATUS DE OUTROS MEMBROS.');
        }
    }

    return isActuallyAdmin;

  } catch (err) {
    console.error('❌ Erro no isAdmin (falha de busca de metadados):', err.message);
    return false;
  }
}

module.exports = {
  sendMessageSafe,
  getAllParticipants,
  isAdmin 
};