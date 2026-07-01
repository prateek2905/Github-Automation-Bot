const crypto = require("crypto");

const STATE_TTL_MS = 10 * 60 * 1000;
const pending = new Map();

function createState() {
  const state = crypto.randomBytes(16).toString("hex");
  pending.set(state, Date.now());
  return state;
}

// one-time use: consuming a state removes it, so replaying the callback URL fails
function consumeState(state) {
  const issuedAt = pending.get(state);
  pending.delete(state);
  if (!issuedAt) return false;
  return Date.now() - issuedAt < STATE_TTL_MS;
}

module.exports = { createState, consumeState };
