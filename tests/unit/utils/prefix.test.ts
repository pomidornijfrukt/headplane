import type { ServerBuild } from "react-router";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  getRuntimePrefix,
  prefixServerBuildAssets,
  rewriteRuntimeAssetUrls,
  setRuntimePrefix,
} from "~/utils/prefix";

function makeBuild() {
  return {
    assets: {
      entry: {
        module: "/assets/entry.client.js",
        imports: ["/assets/react-dom.js", "assets/relative.js", "./assets/dot-relative.js"],
      },
      routes: {
        root: {
          id: "root",
          parentId: undefined,
          path: "",
          index: false,
          caseSensitive: false,
          hasAction: false,
          hasLoader: false,
          hasClientAction: false,
          hasClientLoader: false,
          hasClientMiddleware: false,
          hasDefaultExport: true,
          hasErrorBoundary: true,
          module: "/assets/root.js",
          imports: ["/assets/shared.js", "assets/shared-relative.js", "./assets/shared-dot.js"],
          css: ["/assets/root.css"],
        },
      },
      url: "/assets/manifest.js",
      version: "1",
      sri: {
        "/assets/entry.client.js": "sha384-abc",
      },
    },
    basename: "/admin/",
    publicPath: "/",
  } as unknown as ServerBuild;
}

afterEach(() => {
  delete (globalThis as { __PREFIX__?: string }).__PREFIX__;
  vi.unstubAllGlobals();
});

describe("getRuntimePrefix", () => {
  test("reads prefix from document when present", () => {
    vi.stubGlobal("document", {
      documentElement: {
        dataset: {
          headplanePrefix: "/admin/random-path",
        },
      },
    });

    expect(getRuntimePrefix()).toBe("/admin/random-path");
  });

  test("falls back to global prefix on server", () => {
    setRuntimePrefix("/admin/random-path");

    expect(getRuntimePrefix()).toBe("/admin/random-path");
  });

  test("falls back to default prefix when none set", () => {
    expect(getRuntimePrefix()).toBe("/admin");
  });
});

describe("prefixServerBuildAssets", () => {
  test("prefixes manifest urls for runtime prefix", () => {
    const build = makeBuild();

    prefixServerBuildAssets(build, "/admin/random-path");

    const rootRoute = build.assets.routes.root as {
      module: string;
      imports?: string[];
      css?: string[];
    };

    expect(build.publicPath).toBe("/admin/random-path/");
    expect(build.assets.url).toBe("/admin/random-path/assets/manifest.js");
    expect(build.assets.entry.module).toBe("/admin/random-path/assets/entry.client.js");
    expect(build.assets.entry.imports).toEqual([
      "/admin/random-path/assets/react-dom.js",
      "/admin/random-path/assets/relative.js",
      "/admin/random-path/assets/dot-relative.js",
    ]);
    expect(rootRoute.module).toBe("/admin/random-path/assets/root.js");
    expect(rootRoute.imports).toEqual([
      "/admin/random-path/assets/shared.js",
      "/admin/random-path/assets/shared-relative.js",
      "/admin/random-path/assets/shared-dot.js",
    ]);
    expect(rootRoute.css).toEqual(["/admin/random-path/assets/root.css"]);
    expect(build.assets.sri).toEqual({
      "/admin/random-path/assets/entry.client.js": "sha384-abc",
    });
  });
});

describe("rewriteRuntimeAssetUrls", () => {
  test("rewrites asset urls in text assets", () => {
    const rewritten = rewriteRuntimeAssetUrls(
      '@font-face{src:url(/assets/inter.woff2)}import("assets/root.js");import("./assets/dot-root.js");',
      "/admin/random-path",
    );

    expect(rewritten).toBe(
      '@font-face{src:url(/admin/random-path/assets/inter.woff2)}import("/admin/random-path/assets/root.js");import("/admin/random-path/assets/dot-root.js");',
    );
  });

  test("keeps already prefixed asset urls intact", () => {
    const rewritten = rewriteRuntimeAssetUrls(
      'import("/admin/random-path/assets/root.js");url(/admin/random-path/assets/inter.woff2);',
      "/admin/random-path",
    );

    expect(rewritten).toBe(
      'import("/admin/random-path/assets/root.js");url(/admin/random-path/assets/inter.woff2);',
    );
  });
});
