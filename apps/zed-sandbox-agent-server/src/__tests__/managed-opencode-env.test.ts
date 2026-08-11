import { describe, expect, test } from 'bun:test'

import { applyManagedOpencodeEnv } from '../managed-opencode-env'

describe('managed OpenCode environment', () => {
  test('disables passive continuation over a conflicting project value', () => {
    const env = applyManagedOpencodeEnv({
      USER_SETTING: 'kept',
      ZED_CONTINUATION_DISABLED: 'false',
    })

    expect(env.USER_SETTING).toBe('kept')
    expect(env.ZED_CONTINUATION_DISABLED).toBe('1')
  })
})
