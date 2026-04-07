import fs from 'node:fs';
import path from 'node:path';

const LOG_FILE = path.join(import.meta.dirname, 'log.txt');

/**
 * Logs an action to both console and log.txt with timestamp.
 * @param {string} category - e.g. ACTION, TRANSITION, CACHE_HIT, CACHE_MISS, ERROR, SEARCH
 * @param {string} message
 */
export function log(category, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${category}: ${message}\n`;

  // Print to console
  const color = {
    ACTION: '\x1b[36m',     // cyan
    TRANSITION: '\x1b[32m', // green
    CACHE_HIT: '\x1b[33m',  // yellow
    CACHE_MISS: '\x1b[35m', // magenta
    ERROR: '\x1b[31m',      // red
    SEARCH: '\x1b[34m',     // blue
  }[category] || '\x1b[0m';

  console.log(`${color}[${category}]\x1b[0m ${message}`);

  // Append to log file (survives crashes)
  fs.appendFileSync(LOG_FILE, line);
}
