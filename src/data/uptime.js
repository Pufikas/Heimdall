const fs = require("fs");

function getUptime() {
    const seconds = parseFloat(fs.readFileSync("/host/proc/uptime", "utf8").split(" ")[0]);
    return seconds;
}

module.exports = {
    getUptime
};