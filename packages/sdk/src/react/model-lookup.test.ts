import { expect, test } from 'bun:test';

import { createModelLookup } from './model-lookup';

test('indexes model metadata once by provider and model id', () => {
  const first = {
    providerID: 'zed',
    providerName: 'Zed',
    modelID: 'glm-5.2',
    modelName: 'GLM 5.2',
  };
  const second = {
    providerID: 'zed',
    providerName: 'Zed',
    modelID: 'codex/gpt-5.6-sol',
    modelName: 'GPT-5.6 Sol',
  };
  const lookup = createModelLookup([first, second]);

  expect(lookup.get('zed:glm-5.2')).toBe(first);
  expect(lookup.get('zed:codex/gpt-5.6-sol')).toBe(second);
  expect(lookup.get('zed:missing')).toBeUndefined();
});
