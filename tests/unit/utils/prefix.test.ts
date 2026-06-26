import type { ServerBuild } from "react-router";
import { describe, expect, test } from "vitest";

import { prefixServerBuildAssets, rewriteRuntimeAssetUrls } from "~/utils/prefix";

function makeBuild() {
  return {
    assets: {
      entry: {
        module: "/assets/entry.client.js",
        imports: ["/assets/react-dom.js"],
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
          imports: ["/assets/shared.js"],
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

describe("prefixServerBuildAssets", () => {
  test("prefixes manifest urls for runtime prefix", () => {
    const build = makeBuild();

    prefixServerBuildAssets(build, "/admin/667");

    const rootRoute = build.assets.routes.root as {
      module: string;
      imports?: string[];
      css?: string[];
    };

    expect(build.publicPath).toBe("/admin/667/");
    expect(build.assets.url).toBe("/admin/667/assets/manifest.js");
    expect(build.assets.entry.module).toBe("/admin/667/assets/entry.client.js");
    expect(build.assets.entry.imports).toEqual(["/admin/667/assets/react-dom.js"]);
    expect(rootRoute.module).toBe("/admin/667/assets/root.js");
    expect(rootRoute.imports).toEqual(["/admin/667/assets/shared.js"]);
    expect(rootRoute.css).toEqual(["/admin/667/assets/root.css"]);
    expect(build.assets.sri).toEqual({
      "/admin/667/assets/entry.client.js": "sha384-abc",
    });
  });
});

describe("rewriteRuntimeAssetUrls", () => {
  test("rewrites asset urls in text assets", () => {
    const rewritten = rewriteRuntimeAssetUrls(
      '@font-face{src:url(/assets/inter.woff2)}import("/assets/root.js");',
      "/admin/667",
    );

    expect(rewritten).toBe(
      '@font-face{src:url(/admin/667/assets/inter.woff2)}import("/admin/667/assets/root.js");',
    );
  });
});
