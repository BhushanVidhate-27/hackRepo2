const fs = require("fs/promises");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const statePath = path.join(dataDir, "appState.json");

let cached = null;
let writeChain = Promise.resolve();

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function loadFromDisk() {
  try {
    const raw = await fs.readFile(statePath, "utf8");
    cached = JSON.parse(raw);
  } catch (err) {
    // Missing file or invalid JSON => treat as empty.
    cached = null;
  }
  return cached;
}

async function getState() {
  if (cached !== null) return cached;
  return await loadFromDisk();
}

function queueWrite(nextValue) {
  writeChain = writeChain.then(async () => {
    await ensureDataDir();
    await fs.writeFile(statePath, JSON.stringify(nextValue, null, 2), "utf8");
    cached = nextValue;
  });
  return writeChain;
}

async function setState(partial) {
  const prev = (await getState()) || {};
  const next = {
    ...prev,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  await queueWrite(next);
  return next;
}

async function clearState() {
  cached = null;
  writeChain = writeChain.then(async () => {
    try {
      await fs.unlink(statePath);
    } catch {
      // ignore missing file
    }
  });
  return writeChain;
}

module.exports = {
  statePath,
  getState,
  setState,
  clearState,
};

