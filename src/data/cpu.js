const fs = require("fs");
const { HOST_ROOT } = require("../services/utils");

let lastIdle = 0;
let lastTotal = 0;

function getCpuUsage() {
  const data = fs.readFileSync(`${HOST_ROOT}/proc/stat`, "utf8");
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

function getCpuTemps() {
    try {
        const base = `${HOST_ROOT}/sys/class/hwmon`;
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

module.exports = { 
    getCpuUsage,
    getCpuTemps
};