const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const PORT = 3939;

app.use(express.static("public"));

function getRamUsage() {
    const data = fs.readFileSync("/proc/meminfo", "utf8");
    const total = parseInt(data.match(/MemTotal:\s+(\d+)/)[1]);
    const available = parseInt(data.match(/MemAvailable:\s+(\d+)/)[1]);
    const used = total - available;
    const cached = parseInt(data.match(/Cached:\s+(\d+)/)[1]);

    return { cached, total, used, free: available, percent: (used / total) * 100 };
}

let lastIdle = 0;
let lastTotal = 0;

function getCpuUsage() {
  const data = fs.readFileSync("/proc/stat", "utf8");
  const line = data.split("\n")[0];

  const values = line.split(/\s+/).slice(1).map(Number);

  const idle = values[3];
  const total = values.reduce((a, b) => a + b, 0);

  const idleDiff = idle - lastIdle;
  const totalDiff = total - lastTotal;

  lastIdle = idle;
  lastTotal = total;

  if (totalDiff === 0) return 0;

  return (1 - idleDiff / totalDiff) * 100;
}

function getDiskUsage(callback) {
    exec("df / --output=size,used,avail,pcent", (err, stdout) => {
        if (err) return callback(null);

        // lines[0] -> header, lines[1] -> values
        const lines = stdout.trim().split("\n");
        const [total, used, free, percent] = lines[1].trim().split(/\s+/);

        const data = { total, used, free, percent: (used / total) * 100 };

        callback(data);
    });
}

function getUptime() {
    const seconds = parseFloat(fs.readFileSync("/proc/uptime", "utf8").split(" ")[0]);
    return seconds;
}

function getHostname() {
    const hostname = fs.readFileSync("/proc/sys/kernel/hostname", "utf8");

    return hostname;
}

app.get("/api/stats", (req, res) => {
    const ram = getRamUsage();
    const cpu = getCpuUsage();
    const uptime = getUptime();
    const hostname = getHostname();

    getDiskUsage((disk) => {
        res.json({ 
            cpu, 
            ram: {
                cached: ram.cached,
                percent: ram.percent,
                used: ram.used,
                total: ram.total,
                free: ram.free
            }, 
            disk,
            uptime,
            hostname
        });
    });
});

app.listen(PORT, () => {
    console.log(`Running on ${PORT} port`);
});