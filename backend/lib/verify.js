const crypto = require("crypto");
const config = require("../config");

// signature must be computed over the exact raw bytes GitHub sent — the body
// must NOT be parsed/re-serialized before this check, or the byte sequence
// (key order, whitespace, unicode escaping) can differ and verification
// fails even for a legitimate request
function verifyGithubSignature(rawBody, signatureHeader) {
  if (!signatureHeader || !config.GITHUB_APP_WEBHOOK_SECRET) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", config.GITHUB_APP_WEBHOOK_SECRET).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

module.exports = { verifyGithubSignature };
