const { getCpuUsage, getCpuTemps } = require("../data/cpu");
const { getDiskUsage } = require("../data/disk");
const { getContainers } = require("../data/docker");
const { getRamUsage } = require("../data/ram");
const { getCpuName, hostname } = require("../data/system");
const { getUptime } = require("../data/uptime");

let metrics = {};

async function collectMetrics() {
    metrics = {
        cpu: getCpuUsage(),
        ram: getRamUsage(),
        disk: await getDiskUsage(),
        uptime: getUptime(),
        hostname,
        cpuName: getCpuName(),
        cpuTemps: getCpuTemps(),
        containers: await getContainers()
    };
}

async function startMetrics(io) {
    try {
        await collectMetrics();
        io.emit("stats", metrics);
    } catch (err) {
        console.error(err);
    }
    
    setInterval(startMetrics, 2000);
}

module.exports = {
    startMetrics
};