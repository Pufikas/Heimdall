const fs = require("fs");
const { HOST_ROOT } = require("../services/utils");

function getRamUsage() {
    const data = fs.readFileSync(`${HOST_ROOT}/proc/meminfo`, "utf8");
    const total = parseInt(data.match(/MemTotal:\s+(\d+)/)[1]);
    const available = parseInt(data.match(/MemAvailable:\s+(\d+)/)[1]);
    const used = total - available;
    const cached = parseInt(data.match(/Cached:\s+(\d+)/)[1]);

    return { cached, total, used, free: available, percent: (used / total) * 100 };
}

module.exports = {
    getRamUsage
};