const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: ["*.token", "*.password", "*.secret", "*.privateKey", "req.headers.authorization"],
});

module.exports = logger;
