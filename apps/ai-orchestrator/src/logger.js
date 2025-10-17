// src/logger.js
const levels = ['debug', 'info', 'warn', 'error'];

export function createLogger(level = 'debug') {
    const minLevelIndex = levels.includes(level) ? levels.indexOf(level) : levels.indexOf('debug');

    const log = (lvl, msg, meta = {}) => {
        if (!levels.includes(lvl)) return;
        if (levels.indexOf(lvl) < minLevelIndex) return;

        console.log(
            JSON.stringify({
                t: new Date().toISOString(),
                lvl: lvl.toUpperCase(),
                msg,
                ...meta,
            })
        );
    };

    return log;
}
