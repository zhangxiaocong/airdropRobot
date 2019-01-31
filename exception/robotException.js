const log4js = require('log4js');
log4js.configure({
    appenders: {
        out: { type: 'stdout' },
        app: { type: 'file', filename: 'airdrop/exception/humanrobot.log' }
    },
    categories: {
        default: { appenders: [ 'out', 'app' ], level: 'debug' }
    }
});

let logger = log4js.getLogger('robot');

module.exports = logger;
logger.debug("aaaa");
