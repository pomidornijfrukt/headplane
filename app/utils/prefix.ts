import type { ServerBuild } from "react-router";

type RuntimePrefixGlobal = { __PREFIX__?: string };

const ASSET_URL_PREFIX = "/assets/";
const ASSET_URL_TEXT_PATTERN = /(^|["'`(])(?:\.\/)?\/?assets\//g;

type BuildRouteAssets = {
  module: string;
  imports?: string[];
  css?: string[];
  clientActionModule?: string;
  clientLoaderModule?: string;
  clientMiddlewareModule?: string;
  hydrateFallbackModule?: string;
};

type BuildSriMap = NonNullable<ServerBuild["assets"]["sri"]>;

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

function prefixOptionalUrlList(urls: string[] | undefined, prefix: string) {
  return urls?.map((url) => prefixAssetUrl(url, prefix));
}

function prefixOptionalUrl(url: string | undefined, prefix: string) {
  return url ? prefixAssetUrl(url, prefix) : url;
}

function prefixRouteAssets(route: BuildRouteAssets, prefix: string) {
  route.module = prefixAssetUrl(route.module, prefix);
  route.imports = prefixOptionalUrlList(route.imports, prefix);
  route.css = prefixOptionalUrlList(route.css, prefix);
  route.clientActionModule = prefixOptionalUrl(route.clientActionModule, prefix);
  route.clientLoaderModule = prefixOptionalUrl(route.clientLoaderModule, prefix);
  route.clientMiddlewareModule = prefixOptionalUrl(route.clientMiddlewareModule, prefix);
  route.hydrateFallbackModule = prefixOptionalUrl(route.hydrateFallbackModule, prefix);
}

function prefixSriMap(sri: BuildSriMap, prefix: string) {
  const rewritten: BuildSriMap = {};

  // SRI map uses asset URLs as keys.
  for (const [url, integrity] of Object.entries(sri)) {
    rewritten[prefixAssetUrl(url, prefix)] = integrity;
  }

  return rewritten;
}

export function setRuntimePrefix(prefix: string) {
  const runtime = globalThis as RuntimePrefixGlobal;
  runtime.__PREFIX__ = prefix;
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

  for (const route of Object.values(assets.routes) as BuildRouteAssets[]) {
    prefixRouteAssets(route, runtimePrefix);
  }

  if (typeof assets.sri === "object" && assets.sri !== null) {
    assets.sri = prefixSriMap(assets.sri, runtimePrefix);
  }

  if (assets.hmr) {
    assets.hmr.runtime = prefixAssetUrl(assets.hmr.runtime, runtimePrefix);
  }

  return build;
}
