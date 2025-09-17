module.exports = function({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../catalogs/ryukoc.js");
    const moment = require("moment");

    return function({ event }) {
        const timeStart = Date.now();
        const time = moment.tz("Asia/Manila").format("HH:MM:ss L");
        const { userBanned, threadBanned } = global.data;
        const { events } = global.client;
        const { allowInbox } = global.ryuko;
        const { developermode, approval, PREFIX } = global.config;
        const { APPROVED } = global.approved;

        let { senderID, threadID } = event;
        senderID = String(senderID);
        threadID = String(threadID);

        // Check if the thread is approved
        const notApproved = `This box is not approved.\nUse "${PREFIX}request" to send an approval request from bot operators.`;
        if (!APPROVED.includes(threadID) && approval) {
            return api.sendMessage(notApproved, threadID, async (err, info) => {
                if (err) {
                    return logger.error(`Can't send the message`);
                }
                await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds
                return api.unsendMessage(info.messageID); 
            });
        }

        // Skip if user or thread is banned
        if (userBanned.has(senderID) || threadBanned.has(threadID) || (!allowInbox && senderID === threadID)) return;

        // Iterate over registered events and check if event type matches
        for (const [key, value] of events.entries()) {
            if (value.config.eventType.includes(event.logMessageType)) {
                const eventRun = events.get(key);
                try {
                    const Obj = {
                        api: api,
                        event: event,
                        models: models,
                        Users: Users,
                        Threads: Threads,
                        Currencies: Currencies
                    };
                    eventRun.run(Obj);

                    // Log execution if in developer mode
                    if (developermode) {
                        logger(global.getText('handleEvent', 'executeEvent', time, eventRun.config.name, threadID, Date.now() - timeStart) + '\n', 'event');
                    }
                } catch (error) {
                    // Log error if event handling fails
                    logger(global.getText('handleEvent', 'eventError', eventRun.config.name, JSON.stringify(error)), "error");
                }
            }
        }
        return;
    };
};
