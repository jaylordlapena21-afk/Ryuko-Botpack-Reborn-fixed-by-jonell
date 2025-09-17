module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../catalogs/ryukoc.js");
    return function ({ event }) {
        const { allowInbox } = global.ryuko;
        const { userBanned, threadBanned } = global.data;
        const { commands, eventRegistered } = global.client;
        let { senderID, threadID } = event;
        senderID = String(senderID);
        threadID = String(threadID);

        // Check if user or thread is banned, or if inbox is not allowed and sender is the same as thread
        if (userBanned.has(senderID) || threadBanned.has(threadID) || (!allowInbox && senderID === threadID)) return;

        // Iterate over all registered events for matching event types
        for (const eventReg of eventRegistered) {
            const cmd = commands.get(eventReg);
            let getText2;

            if (cmd.languages && typeof cmd.languages === 'object') {
                getText2 = (...values) => {
                    const commandModule = cmd.languages || {};
                    if (!commandModule.hasOwnProperty(global.config.language)) {
                        return api.sendMessage(global.getText('handleCommand', 'notFoundLanguage', cmd.config.name), threadID, event.messageID); 
                    }
                    let lang = cmd.languages[global.config.language][values[0]] || '';
                    for (let i = values.length; i > 0; i--) {
                        const expReg = RegExp('%' + i, 'g');
                        lang = lang.replace(expReg, values[i]);
                    }
                    return lang;
                };
            } else {
                getText2 = () => {};
            }

            try {
                const Obj = {
                    event: event,
                    api: api,
                    models: models,
                    Users: Users,
                    Threads: Threads,
                    Currencies: Currencies,
                    getText: getText2
                };
                if (cmd) cmd.handleEvent(Obj);
            } catch (error) {
                logger(`Error in handling event: ${cmd.config.name} - ${JSON.stringify(error)}`, 'error');
            }
        }
    };
};
