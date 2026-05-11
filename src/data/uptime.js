const fs = require("fs");
const { HOST_ROOT } = require("../services/utils");

function getUptime() {
    const seconds = parseFloat(fs.readFileSync(`${HOST_ROOT}/proc/uptime`, "utf8").split(" ")[0]);
    return seconds;
}

module.exports = {
    getUptime
};