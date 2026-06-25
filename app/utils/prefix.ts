type RuntimePrefixGlobal = { __PREFIX__?: string };

export function setRuntimePrefix(prefix: string) {
  (globalThis as RuntimePrefixGlobal).__PREFIX__ = prefix;
}

export function getRuntimePrefix() {
  if (typeof document !== "undefined") {
    const prefix = document.documentElement.dataset.headplanePrefix;
    if (prefix) {
      return prefix;
    }
  }

  return (globalThis as RuntimePrefixGlobal).__PREFIX__ ?? "/admin";
}
