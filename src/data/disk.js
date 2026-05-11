const { exec } = require("child_process");
const util = require("util");
const { HOST_ROOT } = require("../services/utils");

const execAsync = util.promisify(exec);

async function getDiskUsage() {
    const diskData = await execAsync(`df -k ${HOST_ROOT}/root`);
    const lines = diskData.stdout.trim().split("\n");
    const parts = lines[1].trim().split(/\s+/);

    const total = Number(parts[1]);
    const used = Number(parts[2]);
    const free = Number(parts[3]);

    const data = { total, used, free, percent: (used / total) * 100 };
    return data;
}

module.exports = {
    getDiskUsage
};