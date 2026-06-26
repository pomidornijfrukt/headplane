import type { ServerBuild } from "react-router";

type RuntimePrefixGlobal = { __PREFIX__?: string };

const ASSET_URL_PREFIX = "/assets/";
const ASSET_URL_TEXT_PATTERN = /(^|["'`(])(?:\.\/)?\/?assets\//g;

function normalizePrefix(prefix: string) {
  return prefix === "/" || prefix.endsWith("/") ? prefix : `${prefix}/`;
}

function prefixAssetUrl(url: string, prefix: string) {
  const runtimePrefix = normalizePrefix(prefix);

  if (runtimePrefix === "/") {
    return url;
  }

  if (url.startsWith(runtimePrefix)) {
    return url;
  }

  if (url.startsWith("./assets/")) {
    return `${runtimePrefix}assets/${url.slice("./assets/".length)}`;
  }

  if (url.startsWith("assets/")) {
    return `${runtimePrefix}assets/${url.slice("assets/".length)}`;
  }

  if (url.startsWith(ASSET_URL_PREFIX)) {
    return `${runtimePrefix}assets/${url.slice(ASSET_URL_PREFIX.length)}`;
  }

  return url;
}

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

export function rewriteRuntimeAssetUrls(contents: string, prefix: string) {
  const runtimePrefix = normalizePrefix(prefix);

  if (runtimePrefix === "/") {
    return contents;
  }

  return contents.replace(
    ASSET_URL_TEXT_PATTERN,
    (_match, start: string) => `${start}${runtimePrefix}assets/`,
  );
}

export function prefixServerBuildAssets(build: ServerBuild, prefix: string) {
  const runtimePrefix = normalizePrefix(prefix);

  if (runtimePrefix === "/") {
    return build;
  }

  build.publicPath = runtimePrefix;

  const assets = build.assets;
  assets.url = prefixAssetUrl(assets.url, runtimePrefix);
  assets.entry.module = prefixAssetUrl(assets.entry.module, runtimePrefix);
  assets.entry.imports = assets.entry.imports.map((url) => prefixAssetUrl(url, runtimePrefix));

  for (const route of Object.values(assets.routes) as Array<{
    module: string;
    imports?: string[];
    css?: string[];
    clientActionModule?: string;
    clientLoaderModule?: string;
    clientMiddlewareModule?: string;
    hydrateFallbackModule?: string;
  }>) {
    route.module = prefixAssetUrl(route.module, runtimePrefix);
    route.imports = route.imports?.map((url) => prefixAssetUrl(url, runtimePrefix));
    route.css = route.css?.map((url) => prefixAssetUrl(url, runtimePrefix));
    route.clientActionModule = route.clientActionModule
      ? prefixAssetUrl(route.clientActionModule, runtimePrefix)
      : route.clientActionModule;
    route.clientLoaderModule = route.clientLoaderModule
      ? prefixAssetUrl(route.clientLoaderModule, runtimePrefix)
      : route.clientLoaderModule;
    route.clientMiddlewareModule = route.clientMiddlewareModule
      ? prefixAssetUrl(route.clientMiddlewareModule, runtimePrefix)
      : route.clientMiddlewareModule;
    route.hydrateFallbackModule = route.hydrateFallbackModule
      ? prefixAssetUrl(route.hydrateFallbackModule, runtimePrefix)
      : route.hydrateFallbackModule;
  }

  if (typeof assets.sri === "object" && assets.sri !== null) {
    assets.sri = Object.fromEntries(
      Object.entries(assets.sri).map(([url, integrity]) => [
        prefixAssetUrl(url, runtimePrefix),
        integrity,
      ]),
    );
  }

  if (assets.hmr) {
    assets.hmr.runtime = prefixAssetUrl(assets.hmr.runtime, runtimePrefix);
  }

  return build;
}
