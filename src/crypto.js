import forge from "node-forge";

/* ---------- KEY MANAGEMENT ---------- */

export function generateKeyPair() {
  const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  const asn1 = forge.pki.privateKeyToAsn1(privateKey);
  const der = forge.asn1.toDer(asn1).getBytes();
  const base64Key = forge.util.encode64(der);
  return { privateKey: base64Key, publicKey: forge.pki.publicKeyToPem(publicKey) };
}

export function loadPublicKey(publicKeyPem) {
  return forge.pki.publicKeyFromPem(
    publicKeyPem
  );
}

export function loadPrivateKey(privateKeyValue) {
  const der = forge.util.decode64(privateKeyValue);
  const asn1 = forge.asn1.fromDer(der);
  const privateKey = forge.pki.privateKeyFromAsn1(asn1);
  return privateKey;
}

/* ---------- HYBRID ENCRYPTION ---------- */

export function encryptEnv(envText, publicKeyPem) {
  const publicKey = loadPublicKey(publicKeyPem);

  // AES key
  const aesKey = forge.random.getBytesSync(32);
  const iv = forge.random.getBytesSync(12);

  // Encrypt env using AES-GCM
  const cipher = forge.cipher.createCipher("AES-GCM", aesKey);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(envText, "utf8"));
  cipher.finish();

  const encryptedEnv = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();

  // Encrypt AES key using RSA
  const encryptedKey = publicKey.encrypt(aesKey, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });

  return JSON.stringify({
    key: forge.util.encode64(encryptedKey),
    iv: forge.util.encode64(iv),
    tag: forge.util.encode64(tag),
    data: forge.util.encode64(encryptedEnv),
  });
}

export function decryptEnv(privateKeyValue, payload) {
  const privateKey = loadPrivateKey(privateKeyValue);
  
  const parsed = JSON.parse(payload);

  const aesKey = privateKey.decrypt(
    forge.util.decode64(parsed.key),
    "RSA-OAEP",
    { md: forge.md.sha256.create() }
  );

  const decipher = forge.cipher.createDecipher("AES-GCM", aesKey);
  decipher.start({
    iv: forge.util.decode64(parsed.iv),
    tag: forge.util.decode64(parsed.tag),
  });
  decipher.update(
    forge.util.createBuffer(forge.util.decode64(parsed.data))
  );
  decipher.finish();

  return decipher.output.toString("utf8");
}