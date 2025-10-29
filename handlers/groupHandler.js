// 👥 handlers/groupHandler.js

const { sendMessageSafe } = require('../utils');

/**
 * Trata o evento de um novo membro entrando no grupo (group_join).
 * @param {Client} client Instância do cliente
 * @param {Notification} notification Objeto de notificação
 */
async function handleGroupJoin(client, notification) {
  const chat = await notification.getChat();
  // notification.recipientIds pode ser null, dependendo da versão, usa id._serialized como fallback
  const participants = notification.recipientIds || [notification.id.participant];

  for (const participantId of participants) {
    try {
      const contact = await client.getContactById(participantId);
      const pushName = contact.pushname || contact.number;
      const welcomeMessage = `👋 Olá, ${pushName}! Bem-vinda ao grupo ${chat.name}!`;
      await sendMessageSafe(client, chat.id._serialized, welcomeMessage);
    } catch (err) {
      console.error(`❌ Erro ao enviar boas-vindas para ${participantId}:`, err.message);
    }
  }
}

module.exports = { handleGroupJoin };