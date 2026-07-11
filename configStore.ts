/**
 * Persistent key-value config store backed by a local JSON file.
 * Survives server restarts. Writes are synchronous to keep the API simple.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../lib/logger.js";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../data");
const CONFIG_FILE = join(DATA_DIR, "bot-config.json");

type ConfigData = Record<string, string>;

function load(): ConfigData {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as ConfigData;
    }
  } catch (err) {
    logger.warn({ err }, "Failed to read bot config file — starting fresh");
  }
  return {};
}

function save(data: ConfigData): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    logger.error({ err }, "Failed to write bot config file");
  }
}

const store: ConfigData = load();

export function getConfig(key: string): string | undefined {
  return store[key];
}

export function setConfig(key: string, value: string): void {
  store[key] = value;
  save(store);
}
