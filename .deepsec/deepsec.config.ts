import { defineConfig, type DeepsecPlugin } from "deepsec/config";
import { zedHonoEntrypoint } from "./matchers/zed-hono-entrypoint.js";
import { zedTerraformIacSurface } from "./matchers/zed-terraform-iac-surface.js";

const zedPlugin: DeepsecPlugin = {
  name: "zed-security-surfaces",
  matchers: [zedHonoEntrypoint, zedTerraformIacSurface],
};

export default defineConfig({
  projects: [
    { id: "suna", root: ".." },
    // <deepsec:projects-insert-above>
  ],
  plugins: [zedPlugin],
});
