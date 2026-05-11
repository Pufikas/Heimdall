const fs = require("fs");
const { HOST_ROOT } = require("../services/utils");

function getCpuName() {
    const data = fs.readFileSync(`${HOST_ROOT}/proc/cpuinfo`, "utf8");
    const match = data.match(/model name\s+:\s+(.+)/);

    if (!match) return "Unknown CPU";

    return match[1].replace(/Intel\(R\)\s*/g, "").replace(/Core\(TM\)\s*/g, "").replace(/\s*CPU\s*/g, "").trim();
};

const hostname = fs.readFileSync(`${HOST_ROOT}/proc/sys/kernel/hostname`, "utf8").trim();


module.exports = {
    getCpuName,
    hostname
};