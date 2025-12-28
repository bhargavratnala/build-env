let envStore = Object.create(null);

export function setEnvObject(obj) {
  envStore = Object.freeze({ ...obj });
}

export function getEnvObject() {
  return envStore;
}

export function get(key, defaultValue = undefined) {
  return envStore[key] ?? defaultValue;
}

export function has(key) {
  return Object.prototype.hasOwnProperty.call(envStore, key);
}