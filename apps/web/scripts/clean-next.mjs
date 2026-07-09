/**
 * Remove .next build cache (Windows-safe retries after port kill).
 */
import fs from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

const nextDir = path.resolve(".next");

if (!fs.existsSync(nextDir)) {
  console.log(".next folder not found — nothing to clean");
  process.exit(0);
}

const maxAttempts = 8;
const delayMs = 400;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    console.log("Removed .next cache");
    process.exit(0);
  } catch (err) {
    if (attempt === maxAttempts) {
      console.error(`Failed to remove .next after ${maxAttempts} attempts:`, err.message);
      process.exit(1);
    }
    console.log(`Waiting for .next to unlock (attempt ${attempt}/${maxAttempts})...`);
    await setTimeout(delayMs);
  }
}
