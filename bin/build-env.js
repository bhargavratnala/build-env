#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateKeyPair, encryptEnv } from "../src/crypto.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [command, inputFile] = process.argv.slice(2);

function usage() {
  console.log(`
build-env CLI

Usage:
  build-env generate
  build-env build [.env]

Examples:
  build-env generate
  build-env build .env
`);
}

export function saveKeyPair(privateKey, publicKey) {
  fs.writeFileSync("private_key", privateKey);
  fs.writeFileSync("public_key.pem", publicKey);
}

export function readPublicKey() {
  return fs.readFileSync("public_key.pem", "utf8");
}

switch (command) {
  case "generate": {
    const { privateKey, publicKey } = generateKeyPair();
    saveKeyPair(privateKey, publicKey);
    console.log("✅ RSA key pair generated");
    break;
  }

  case "build": {
    const envFile = inputFile || "build.env";
    if (!fs.existsSync(envFile)) {
      console.error(`❌ File not found: ${envFile}`);
      process.exit(1);
    }

    const envText = fs.readFileSync(envFile, "utf8");
    const publicKeyPem = readPublicKey();
    const encrypted = encryptEnv(envText, publicKeyPem);
    fs.writeFileSync("public/build.env.json", encrypted);

    console.log("✅ Encrypted env written to public/build.env.json");
    break;
  }

  default:
    usage();
}
