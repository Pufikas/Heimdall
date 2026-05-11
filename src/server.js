const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { collectMetrics } = require("./services/metrics");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

function startMetrics(io) {
    tick(io);

    setInterval(() => {
        tick(io);
    }, 2000);
}

async function tick(io) {
    try {
        let metrics = await collectMetrics();
        
        io.emit("stats", metrics);

    } catch (err) {
        console.error("Metrics error:", err);
    }
}

io.on("connection", (socket) => {

    console.log("client connected");

    socket.on("disconnect", () => {
        console.log("client disconnected");
    });
});

startMetrics(io);

server.listen(3939);