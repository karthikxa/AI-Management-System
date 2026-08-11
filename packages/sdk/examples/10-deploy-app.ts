/**
 * 10 — Deploy a public OCI image as a serverless Zed App.
 *
 * Run:
 *   ZED_API_URL=https://api.zed.com/v1 ZED_API_KEY=zed_pat_... \
 *   ZED_PROJECT_ID=... bun run examples/10-deploy-app.ts
 *
 * As an npm consumer:
 *   import { createZed } from '@zed/sdk';
 */
import { createZed } from '../src/index';

async function main() {
  const backendUrl = process.env.ZED_API_URL ?? 'http://localhost:8008/v1';
  const apiKey = process.env.ZED_API_KEY;
  const projectId = process.env.ZED_PROJECT_ID;
  if (!apiKey || !projectId) {
    console.error('Set ZED_API_KEY and ZED_PROJECT_ID and re-run.');
    process.exit(1);
  }

  const zed = createZed({ backendUrl, getToken: async () => apiKey });
  const apps = zed.project(projectId).apps;
  const app = await apps.create({ slug: 'hello', name: 'Hello App' });
  const registered = await apps.artifacts.register({
    kind: 'oci_image',
    image: 'docker.io/hashicorp/http-echo:1.0',
  });
  const deployment = await apps.deployments.create(app.app_id, {
    artifact_id: registered.artifact.artifact_id,
    source: {
      kind: 'oci_image',
      image: 'docker.io/hashicorp/http-echo:1.0',
      command: ['http-echo', '-listen=:5678', '-text=Hello from Zed Apps'],
      port: 5678,
    },
  });

  console.log(`${deployment.status}: ${app.url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
