const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { startMetrics } = require("./services/metrics");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

startMetrics(io);

server.listen(3939);