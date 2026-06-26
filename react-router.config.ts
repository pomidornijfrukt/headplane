import type { Config } from "@react-router/dev/config";

export default {
  basename: "/",
  ssr: true,
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
