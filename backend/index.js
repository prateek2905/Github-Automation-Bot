const express = require("express");
const cors = require("cors");
const config = require("./config");
const logger = require("./lib/logger");
const rootRouter = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/", rootRouter);

app.listen(config.PORT || 3000, () => {
  logger.info(`Server is running on port ${config.PORT || 3000}`);
});
