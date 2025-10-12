const express = require("express");
const { exec } = require("child_process");
const path = require("path");

const app = express();
app.use(express.json());

const stacks = {
  python: {
    image: "python:3.11-slim",
    command:
      'bash -lc "cd /app && pip install --no-cache-dir -r requirements.txt || true && python app.py"',
    port: 8000
  },
  node: {
    image: "node:20-alpine",
    command: 'bash -lc "cd /app && npm install || true && node index.js"',
    port: 3000
  },
  static: {
    image: "node:20-alpine",
    command: 'bash -lc "cd /app && npx live-server --port=4173 --host=0.0.0.0"',
    port: 4173
  }
};

app.post("/run", (req, res) => {
  const { projectId, stack } = req.body;
  if (!projectId || !stack) {
    return res.status(400).json({ error: "projectId and stack required" });
  }
  const config = stacks[stack];
  if (!config) {
    return res.status(400).json({ error: "Unsupported stack" });
  }

  const port = 5000 + Math.floor(Math.random() * 1000);
  const projectPath = path.join("/srv/projects", projectId);
  const cmd = `docker run --rm -d -m 512m --cpus=0.5 -p ${port}:${config.port} -v ${projectPath}:/app ${config.image} ${config.command}`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error("Runner error", stderr);
      return res.status(500).json({ error: stderr || error.message });
    }
    res.json({ url: `http://localhost:${port}`, container: stdout.trim() });
  });
});

app.listen(4000, () => console.log("Runner ready on 4000"));
