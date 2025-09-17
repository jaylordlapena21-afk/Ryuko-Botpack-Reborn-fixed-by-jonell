module.exports = function ({ api, models }) {
    // Interval for notifications (every minute)
    setInterval(function () {
        if (global.config.notification) {
            require("./handle/handleNotification.js")({ api });
        }
    }, 1000 * 60); // 60 seconds = 1 minute

    const Users = require("./controllers/users")({ models, api }),
          Threads = require("./controllers/threads")({ models, api }),
          Currencies = require("./controllers/currencies")({ models });

    const logger = require("../catalogs/ryukoc.js");
    const chalk = require("chalk");
    const gradient = require("gradient-string");
    const crayon = gradient('yellow', 'lime', 'green');
    const sky = gradient('#3446eb', '#3455eb', '#3474eb');

    // Initialize environment
    (async function () {
        try {
            const process = require("process");
            const [threads, users] = await Promise.all([Threads.getAll(), Users.getAll(['userID', 'name', 'data'])]);

            threads.forEach(data => {
                const idThread = String(data.threadID);
                global.data.allThreadID.push(idThread);
                global.data.threadData.set(idThread, data.data || {});
                global.data.threadInfo.set(idThread, data.threadInfo || {});
                if (data.data && data.data.banned) {
                    global.data.threadBanned.set(idThread, {
                        'reason': data.data.reason || '',
                        'dateAdded': data.data.dateAdded || ''
                    });
                }
                if (data.data && data.data.commandBanned && data.data.commandBanned.length !== 0) {
                    global.data.commandBanned.set(idThread, data.data.commandBanned);
                }
                if (data.data && data.data.NSFW) {
                    global.data.threadAllowNSFW.push(idThread);
                }
            });

            users.forEach(dataU => {
                const idUsers = String(dataU.userID);
                global.data.allUserID.push(idUsers);
                if (dataU.name && dataU.name.length !== 0) {
                    global.data.userName.set(idUsers, dataU.name);
                }
                if (dataU.data && dataU.data.banned) {
                    global.data.userBanned.set(idUsers, {
                        'reason': dataU.data.reason || '',
                        'dateAdded': dataU.data.dateAdded || ''
                    });
                }
                if (dataU.data && dataU.data.commandBanned && dataU.data.commandBanned.length !== 0) {
                    global.data.commandBanned.set(idUsers, dataU.data.commandBanned);
                }
            });

            global.loading(`Deployed ${chalk.blueBright(`${global.data.allThreadID.length}`)} groups and ${chalk.blueBright(`${global.data.allUserID.length}`)} users\n\n${chalk.blue(`RYUKO PROJECT VERSION 4.0.0 and fixed by Jonell Magallanes (CCPROJECTS)`)}\n`, "data");
        } catch (error) {
            logger.loader(`Can't load environment variable, error: ${error}`, 'error');
        }
    })();

    const operator = global.config.OPERATOR.length;
    const admin = global.config.ADMINBOT.length;
    const approved = global.approved.APPROVED.length;
    const premium = global.premium.PREMIUMUSERS.length;

    console.log(`${crayon(``)}${sky(`Data -`)} Bot Name: ${chalk.blueBright((!global.config.BOTNAME) ? "Ryuko" : global.config.BOTNAME)}\n${sky(`Data -`)} Bot ID: ${chalk.blueBright(api.getCurrentUserID())}\n${sky(`Data -`)} Bot Prefix: ${chalk.blueBright(global.config.PREFIX)}\n${sky(`Data -`)} Deployed ${chalk.blueBright(operator)} Bot Operators and ${chalk.blueBright(admin)} Admins`);
    
    if (global.config.approval) {
        console.log(`${sky(`Data -`)} Deployed ${chalk.blueBright(approved)} Approved Groups`);
    }

    if (global.config.premium) {
        console.log(`${sky(`Data -`)} Deployed ${chalk.blueBright(premium)} Premium Users`);
    }

    // Handler Functions
    const handleCommand = require("./handle/handleCommand.js")({ api, Users, Threads, Currencies, models });
    const handleCommandEvent = require("./handle/handleCommandEvent.js")({ api, Users, Threads, Currencies, models });
    const handleReply = require("./handle/handleReply.js")({ api, Users, Threads, Currencies, models });
    const handleReaction = require("./handle/handleReaction.js")({ api, Users, Threads, Currencies, models });
    const handleEvent = require("./handle/handleEvent.js")({ api, Users, Threads, Currencies, models });
    const handleCreateDatabase = require("./handle/handleCreateDatabase.js")({ api, Threads, Users, Currencies, models });
    const handleRefresh = require("./handle/handleRefresh")({ api, Users, Threads, Currencies });

    // Consolidated event handler
    return (event) => {
        switch (event.type) {
            case "message":
            case "message_reply":
            case "message_unsend":
                handleCreateDatabase({ event });
                handleCommand({ event });
                handleReply({ event });
                handleCommandEvent({ event });
                break;
            case "change_thread_image": 
                // handle thread image change
                break;
            case "event":
                handleEvent({ event });
                handleRefresh({ event });
                break;
            case "message_reaction":
                handleReaction({ event });
                break;
            default:
                break;
        }
    };
};
