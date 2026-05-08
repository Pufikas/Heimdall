const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const PORT = 3939;
const { getContainers } = require("./container_api");

app.use(express.static("public"));

function getRamUsage() {
    const data = fs.readFileSync("/host/proc/meminfo", "utf8");
    const total = parseInt(data.match(/MemTotal:\s+(\d+)/)[1]);
    const available = parseInt(data.match(/MemAvailable:\s+(\d+)/)[1]);
    const used = total - available;
    const cached = parseInt(data.match(/Cached:\s+(\d+)/)[1]);

    return { cached, total, used, free: available, percent: (used / total) * 100 };
}

let lastIdle = 0;
let lastTotal = 0;

function getCpuUsage() {
  const data = fs.readFileSync("/host/proc/stat", "utf8");
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
    exec("df /host/root --output=size,used,avail,pcent", (err, stdout) => {
        if (err) return callback(null);

        // lines[0] -> header, lines[1] -> values
        const lines = stdout.trim().split("\n");
        const [total, used, free, percent] = lines[1].trim().split(/\s+/);

        const data = { total, used, free, percent: (used / total) * 100 };

        callback(data);
    });
}

function getUptime() {
    const seconds = parseFloat(fs.readFileSync("/host/proc/uptime", "utf8").split(" ")[0]);
    return seconds;
}

const cpuName = (() => {
    const data = fs.readFileSync("/host/proc/cpuinfo", "utf8");
    const match = data.match(/model name\s+:\s+(.+)/);

    if (!match) return "Unknown CPU";

    return match[1].replace(/Intel\(R\)\s*/g, "").replace(/Core\(TM\)\s*/g, "").replace(/\s*CPU\s*/g, "").trim();
})();

function getCpuTemps() {
    try {
        const base = "/host/sys/class/hwmon";
        const dirs = fs.readdirSync(base);

        for (const dir of dirs) {
            const hwmonPath = `${base}/${dir}`;
            const namePath = `${hwmonPath}/name`;

            if (!fs.existsSync(namePath)) continue;

            const name = fs.readFileSync(namePath, "utf8").toLowerCase();

            // for intel cpu
            if (name.includes("coretemp")) {
                const files = fs.readdirSync(hwmonPath);
                const temps = [];

                for (const file of files) {
                    if (file.startsWith("temp") && file.endsWith("_input")) {
                        const id = file.match(/temp(\d+)_input/)[1];

                        const labelPath = `${hwmonPath}/temp${id}_label`;
                        const inputPath = `${hwmonPath}/temp${id}_input`;

                        if (!fs.existsSync(inputPath)) continue;

                        const temp = parseInt(fs.readFileSync(inputPath, "utf8")) / 1000;

                        let label = `temp${id}`;
                        if (fs.existsSync(labelPath)) {
                            label = fs.readFileSync(labelPath, "utf8").trim();
                        }

                        // only include actual cpu cores    
                        if (label.toLowerCase().includes("core")) {
                            temps.push({ core: label, temp });
                        }
                    }
                }

                return temps;
            }
        }

        return [];
    } catch {
        return [];
    }
}

const hostname = fs.readFileSync("/host/proc/sys/kernel/hostname", "utf8").trim();

app.get("/api/stats", (req, res) => {
    const ram = getRamUsage();

    getDiskUsage((disk) => {
        res.json({ 
            cpu: getCpuUsage(),
            ram: {
                cached: ram.cached,
                percent: ram.percent,
                used: ram.used,
                total: ram.total,
                free: ram.free
            }, 
            disk,
            uptime: getUptime(),
            hostname,
            cpuName,
            cpuTemps: getCpuTemps()
        });
    });
});

app.get("/api/containers", async (req, res) => {
    const cont = await getContainers();

    res.json({
        cont
    });
});

app.listen(PORT, () => {
    console.log(`Running on ${PORT} port`);
});