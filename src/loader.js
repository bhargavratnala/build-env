import { decryptEnv } from "./crypto.js";
import { setEnvObject } from "./store.js";

export async function loadEncryptedEnv(privateKey, filename = "build.env.json") {
  const config = await fetch(filename).then((res) => res.text());
  const decrypted = decryptEnv(privateKey, config);

  const envObject = Object.create(null);

  decrypted.split("\n").forEach((line) => {
    if (!line || line.startsWith("#")) return;

    const idx = line.indexOf("=");
    if (idx === -1) return;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();

    envObject[key] = value;
  });

  setEnvObject(envObject);
  return envObject;
}