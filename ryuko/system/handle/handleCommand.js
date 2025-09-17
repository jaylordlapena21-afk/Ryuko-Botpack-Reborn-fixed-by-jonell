module.exports = function ({ api, models, Users, Threads, Currencies }) {
  const stringSimilarity = require('string-similarity');
  const logger = require("../../catalogs/ryukoc.js");
  const moment = require("moment-timezone");

  return async function ({ event }) {
    const { body, senderID, threadID, messageID } = event;
    const { allowInbox, adminOnly } = global.ryuko;
    const { PREFIX, ADMINBOT, OPERATOR, approval } = global.config;
    const { APPROVED } = global.approved;
    const { userBanned, threadBanned } = global.data;
    const { commands, cooldowns } = global.client;
    const dateNow = Date.now();
    const time = moment.tz("Asia/Manila").format("HH:MM:ss DD/MM/YYYY");

    const threadSetting = global.data.threadData.get(threadID) || {};
    const args = (body || '').trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    const command = commands.get(commandName);

    const notApproved = `𝗔𝗽𝗽𝗿𝗼𝘃𝗮𝗹 𝗧𝗵𝗿𝗲𝗮𝗱\n${global.line}\nThis box is not approved.\nuse "${PREFIX}request" to send a approval request from bot operators`;
    const replyAD = 'mode - only bot admin can use bot';

    // Check if the command starts with prefix
    if (body && body.startsWith(PREFIX)) {
      // Check if the thread is approved
      if (approval && !APPROVED.includes(threadID)) {
        return sendNotApprovedMessage();
      }

      // Handle approval request
      if (body.startsWith(`${PREFIX}request`) && approval) {
        return handleApprovalRequest();
      }

      // Check if the user is banned
      if (userBanned.has(senderID) || threadBanned.has(threadID)) {
        return handleBan(senderID, threadID);
      }

      // Check if adminOnly command is used by non-admin
      if (adminOnly && !ADMINBOT.includes(senderID) && !OPERATOR.includes(senderID)) {
        return api.sendMessage(replyAD, threadID, messageID);
      }

      // Handle the command execution if not banned
      if (command) {
        return handleCommandExecution();
      }
    }

    // Handle command cooldown
    if (cooldowns.has(command.config.name)) {
      return handleCooldown();
    }

    // General Error Logging
    try {
      // Add the rest of the logic for handling commands, permissions, etc.
    } catch (error) {
      logger(`Error executing command ${commandName}: ${error}`, 'error');
    }

    // Helper function to send not-approved message
    function sendNotApprovedMessage() {
      return api.sendMessage(notApproved, threadID, messageID, async (err, info) => {
        if (err) logger(`Error sending not approved message: ${err}`, 'error');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return api.unsendMessage(info.messageID);
      });
    }

    // Handle approval request logic
    async function handleApprovalRequest() {
      if (APPROVED.includes(threadID)) {
        return api.sendMessage(`✅ Already Approved\n${global.line}\nThis box is already approved`, threadID, messageID);
      }

      let request;
      try {
        const groupname = await global.data.threadInfo.get(threadID).threadName || "Name does not exist";
        request = `🪧 Group Chat Request\n${global.line}\n${groupname} is requesting approval`;
      } catch (error) {
        request = `❓ Bot User Request\n${global.line}\nBot user is requesting approval`;
      }

      return api.sendMessage(`${request}`, OPERATOR[0], () => {
        return api.sendMessage(`📬 Your approval request has been sent from bot operator`, threadID, messageID);
      });
    }

    // Handle banned users and threads
    function handleBan(senderID, threadID) {
      const banMessage = userBanned.has(senderID) ? `User is banned` : `Thread is banned`;
      return api.sendMessage(banMessage, threadID, messageID);
    }

    // Handle command execution logic
    function handleCommandExecution() {
      // Additional command handling logic here
    }

    // Handle cooldown logic
    function handleCooldown() {
      const expirationTime = 5000;  // Example cooldown time in ms
      if (dateNow < cooldowns.get(senderID) + expirationTime) {
        return api.sendMessage(`⏱️ Please wait before trying again`, threadID, messageID);
      }
      cooldowns.set(senderID, dateNow);
    }
  };
};
