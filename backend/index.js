const express = require("express");
const cors = require("cors");
const config = require("./config");
const logger = require("./lib/logger");
const webhookRouter = require("./routes/webhook");
const rootRouter = require("./routes");

const app = express();

app.use(cors());

// mounted before express.json() so the webhook route sees the raw request
// body — needed to verify GitHub's HMAC signature against the exact bytes sent
app.use("/webhook", webhookRouter);

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/", rootRouter);

app.listen(config.PORT || 3000, () => {
  logger.info(`Server is running on port ${config.PORT || 3000}`);
});
