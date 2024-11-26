import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/orf.ts"],
  outDir: "./lib",
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  minify: true,
});
