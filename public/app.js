const cpuHistory = [];
const ramHistory = [];
const MAX_POINTS = 10;

function pushValue(arr, value) {
    arr.push(value);
    if (arr.length > MAX_POINTS) arr.shift();
}

function renderGraph(arr) {
    return arr.map(p => {
        if (p > 80) return "█";
        if (p > 50) return "▓";
        if (p > 20) return "▒";
        return "░";
    }).join("");
}

function formatGB(kb) {
  return (kb / 1024 / 1024).toFixed(2);
}

function formatUptime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

async function updContainer() {
    const cont = await fetch("/api/containers");
    const containers = await cont.json();
    const contWrap = document.getElementById("docker");

    contWrap.innerHTML = "";

    containers.forEach(c => {
        const li = document.createElement("li");
        li.title = c.image;
        li.innerText = `${c.name} • ${c.state}`;

        contWrap.append(li);
    });
}

async function update() {
    const res = await fetch("/api/stats");
    const data = await res.json();
    
    pushValue(cpuHistory, data.cpu);
    pushValue(ramHistory, data.ram.percent);
    
    document.getElementById("hostname").innerText = data.hostname;

    const tempsText = data.cpuTemps.map(t => `${t.core}: ${t.temp.toFixed(0)}°C`).join("\n");

    document.getElementById("cpu").innerText =
        `${data.cpuName}\n` +
        `CPU  ${data.cpu.toFixed(1).padStart(5)}%\n` +
        renderGraph(cpuHistory) + "\n" + tempsText;

    document.getElementById("ram").innerText = `RAM  ${data.ram.percent.toFixed(1).padStart(10)}%\n` + 
        renderGraph(ramHistory) + '\n' + 
        `${formatGB(data.ram.used)} / ${formatGB(data.ram.total)} GB`;

    document.getElementById("disk").innerText =
        `DISK ${data.disk.percent.toFixed(1).toString().padStart(10)}%\n\n` +
        `${formatGB(data.disk.used)} / ${formatGB(data.disk.total)} GB\n` +
        `UP ${formatUptime(data.uptime)}`;
}

update();

setInterval(update, 2000);
setInterval(updContainer, 10000);