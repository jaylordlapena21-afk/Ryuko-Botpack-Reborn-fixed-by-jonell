module.exports.config = {
  name: "help",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "august",
  description: "Guide for new users",
  category: "system",
  usages: "/help",
  prefix: true,
  premium: false,
  cooldowns: 5
};

const mathSansBold = {
  A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜",
  J: "𝗝", K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥",
  S: "𝗦", T: "𝗧", U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭", a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶",
  j: "𝗷", k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿",
  s: "𝘀", t: "𝘁", u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇"
};

module.exports.handleEvent = function ({ api, event, getText }) {
  const { commands } = global.client;
  const { threadID, messageID, body } = event;

  if (!body || typeof body !== "string" || !body.includes("commands")) return;

  const splitBody = body.slice(body.indexOf("commands")).trim().split(/\s+/);
  if (splitBody.length < 2 || !commands.has(splitBody[1].toLowerCase())) return;

  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const command = commands.get(splitBody[1].toLowerCase());
  const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;

  return api.sendMessage(
    getText(
      "moduleInfo",
      command.config.name,
      command.config.description,
      `${prefix}${command.config.name} ${command.config.usages || ""}`,
      command.config.category,
      command.config.cooldowns,
      command.config.hasPermission === 0
        ? getText("user")
        : command.config.hasPermission === 1
        ? getText("adminGroup")
        : getText("adminBot"),
      command.config.credits
    ),
    threadID,
    messageID
  );
};

module.exports.run = async function ({ api, event, args }) {
  const uid = event.senderID;
  const userName = (await api.getUserInfo(uid))[uid].name;

  const { commands } = global.client;
  const { threadID, messageID } = event;
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;

  const categories = new Set();
  const categorizedCommands = new Map();

  for (const [name, value] of commands) {
    const categoryName = value.config.category;
    if (!categories.has(categoryName)) {
      categories.add(categoryName);
      categorizedCommands.set(categoryName, []);
    }
    categorizedCommands.get(categoryName).push(`│ ✧ ${value.config.name}`);
  }

  let msg = `Hey ${userName}, these are commands that may help your assignments and essays:\n`;

  for (const categoryName of categories) {
    const categoryNameSansBold = categoryName.split("").map(c => mathSansBold[c] || c).join("");
    msg += `╭─❍「 ${categoryNameSansBold} 」\n`;
    msg += categorizedCommands.get(categoryName).join("\n");
    msg += "\n╰───────────⟡\n";
  }

  msg += `├─────☾⋆\n│ » Total commands: [ ${commands.size} ]\n│「 ☾⋆ PREFIX: ${global.config.PREFIX} 」\n╰──────────⧕\n\nOwner: ${global.config.BOTOWNER}`;

  return api.shareContact(msg, api.getCurrentUserID(), event.threadID);
};
