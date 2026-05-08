const Docker = require("dockerode");
const docker = new Docker({
    socketPath: "/var/run/docker.sock"
});

async function getContainers() {
    const containers = await docker.listContainers();

    return containers.map(c => ({
        id: c.Id.slice(0, 12),
        name: c.Names[0].replace("/", ""),
        image: c.Image,
        state: c.State,
        status: c.Status
    }));
}

module.exports = {
    getContainers
};