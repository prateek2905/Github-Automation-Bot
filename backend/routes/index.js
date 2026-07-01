const express = require("express");
const authRouter = require("./auth");
const reposRouter = require("./repos");

const router = express.Router();

router.use("/auth", authRouter);
router.use("/repos", reposRouter);

module.exports = router;
