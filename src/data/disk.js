const { exec } = require("child_process");

async function getDiskUsage(callback) {
    exec("df /host/root --output=size,used,avail,pcent", (err, stdout) => {
        if (err) return callback(null);

        // lines[0] -> header, lines[1] -> values
        const lines = stdout.trim().split("\n");
        const [total, used, free, percent] = lines[1].trim().split(/\s+/);

        const data = { total, used, free, percent: (used / total) * 100 };

        callback(data);
    });
}

module.exports = {
    getDiskUsage
};