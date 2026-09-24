/**
 * 369 AKR UNIVERSE - Admin Identity Vault Seed Generator
 * Generates a bcryptjs salt and hash for the initial SuperAdmin account.
 * Pure JavaScript - 100% Edge-safe & Node-safe.
 */
const bcrypt = require("bcryptjs");

const USERNAME = "superadmin";
const PLAINTEXT_PASSWORD = "SuperAdmin@369!";
const SALT_ROUNDS = 12;

console.log("=================================================");
console.log("369 AKR UNIVERSE - Cryptographic Identity Vault");
console.log("Generating seed hash using bcryptjs...");
console.log("=================================================");

const salt = bcrypt.genSaltSync(SALT_ROUNDS);
const hash = bcrypt.hashSync(PLAINTEXT_PASSWORD, salt);

// Verify immediate correctness
const isValid = bcrypt.compareSync(PLAINTEXT_PASSWORD, hash);

console.log(`Username:       ${USERNAME}`);
console.log(`Password:       ${PLAINTEXT_PASSWORD}`);
console.log(`Salt Rounds:    ${SALT_ROUNDS}`);
console.log(`Generated Hash: ${hash}`);
console.log(`Self-Check:     ${isValid ? "VERIFIED (MATCH)" : "FAILED"}`);
console.log("=================================================");
