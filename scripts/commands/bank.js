module.exports.config = {
  name: "bank",
  version: "2.0.0",
  permission: 0,
  credits: "ChatGPT + Jaylord",
  description: "Bank system with UID checker (auto-update name on /bank)",
  premium: false,
  prefix: true, 
  category: "economy",
  usages: "bank, bank all, bank add <uid> <amount>",
  cooldowns: 3,
};

module.exports.languages = {
  "en": {
    "listBank": "Bank Account List",
    "noAccounts": "🏦 No accounts found in the bank.",
    "addedCoins": "✅ Added %1 coins to %2's account.",
    "onlyAdmin": "❌ Only bot admins can add coins.",
    "usageAdd": "❌ Usage: /bank add <uid> <amount>",
    "checkBalance": "🏦 Bank Account 🏦\n\n👤 %1\n💰 Balance: %2 coins",
  }
};

const BOT_ADMINS = ["61559999326713"]; // Bot admins

// Helper function to fetch username by UID
async function getUserName(uid, Users) {
  try {
    const name = await Users.getNameUser(uid);
    return name || uid; // Default to UID if no name found
  } catch {
    return uid; // Fallback if an error occurs
  }
}

// Format balance message
function formatBalance(user, balance) {
  return `🏦 Bank Account 🏦\n\n👤 ${user}\n💰 Balance: ${balance.toLocaleString()} coins`;
}

module.exports.run = async ({ api, event, args, Users }) => {
  const { threadID, senderID, messageID } = event;
  const command = args[0] ? args[0].toLowerCase() : "";

  // Command: /bank all (list all bank accounts)
  if (command === "all") {
    let allData = (await getData(`bank`)) || {};
    let results = [];

    for (let uid in allData) {
      let name = await getUserName(uid, Users);

      // Auto-update name in DB if it differs
      if (allData[uid].name !== name) {
        allData[uid].name = name;
        await setData(`bank/${uid}`, allData[uid]); // Save updated name
      }

      results.push({
        uid,
        name,
        balance: allData[uid].balance || 0
      });
    }

    if (results.length === 0) {
      return api.sendMessage(global.getText("en", "noAccounts"), threadID, messageID);
    }

    results.sort((a, b) => b.balance - a.balance);

    let msg = `📋 ${global.getText("en", "listBank")} (Total: ${results.length}) 📋\n`;
    for (let i = 0; i < results.length; i++) {
      msg += `\n${i + 1}. 👤 ${results[i].name} — 💰 ${results[i].balance.toLocaleString()} coins`;
    }

    return api.sendMessage(msg, threadID, messageID);
  }

  // Command: /bank add <uid> <amount> (add coins to a user)
  if (command === "add") {
    if (!BOT_ADMINS.includes(senderID)) {
      return api.sendMessage(global.getText("en", "onlyAdmin"), threadID, messageID);
    }

    const targetUID = args[1];
    const amount = parseInt(args[2]);

    if (!targetUID || isNaN(amount) || amount <= 0) {
      return api.sendMessage(global.getText("en", "usageAdd"), threadID, messageID);
    }

    let userData = (await getData(`bank/${targetUID}`)) || {
      uid: targetUID,
      name: await getUserName(targetUID, Users),
      balance: 0
    };

    userData.balance += amount;

    let freshName = await getUserName(targetUID, Users);
    if (userData.name !== freshName) {
      userData.name = freshName;
    }

    await setData(`bank/${targetUID}`, userData);

    return api.sendMessage(
      global.getText("en", "addedCoins", amount.toLocaleString(), userData.name),
      threadID,
      messageID
    );
  }

  // Command: /bank (check own balance)
  let userData = (await getData(`bank/${senderID}`)) || {
    uid: senderID,
    name: await getUserName(senderID, Users),
    balance: 0
  };

  let freshName = await getUserName(senderID, Users);
  if (userData.name !== freshName) {
    userData.name = freshName;
    await setData(`bank/${senderID}`, userData); // Save updated name
  }

  return api.sendMessage(
    formatBalance(userData.name, userData.balance),
    threadID,
    messageID
  );
};
