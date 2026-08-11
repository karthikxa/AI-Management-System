# @zed/executor-sdk

Deprecated. Use `@zed/sdk`.

```ts
import { createZed } from '@zed/sdk';

const zed = createZed({
  backendUrl: 'https://api.zed.com/v1',
  getToken: async () => process.env.ZED_TOKEN ?? null,
});

const connectors = zed.project(projectId).connectors;
await connectors.call('gmail.send_email', { to, subject, body });
```

Version `0.12.5` is the final compatibility release. Existing
`ExecutorClient` code continues to work while it migrates to `@zed/sdk`.
