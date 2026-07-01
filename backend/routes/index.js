const express = require("express");
const authRouter = require("./auth");
const reposRouter = require("./repos");
const rulesRouter = require("./rules");
const eventsRouter = require("./events");

const router = express.Router();

router.use("/auth", authRouter);
router.use("/repos", reposRouter);
router.use("/rules", rulesRouter);
router.use("/events", eventsRouter);

module.exports = router;
