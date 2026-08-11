import { describe, test, expect } from 'bun:test';
import * as db from './index';

describe('package index re-exports', () => {
  test('exposes the createDb client factory', () => {
    expect(typeof db.createDb).toBe('function');
  });

  test('exposes the zed schema namespace object', () => {
    expect(db.schema).toBeDefined();
    expect(db.schema.zedSchema).toBeDefined();
  });

  test('re-exports the core zed tables', () => {
    const expected = [
      'accounts',
      'accountMembers',
      'projects',
      'projectMembers',
      'sandboxes',
      'zedApiKeys',
    ] as const;
    for (const name of expected) {
      expect(db[name]).toBeDefined();
    }
  });

  test('re-exports the zed enums', () => {
    const expected = [
      'sandboxStatusEnum',
      'projectStatusEnum',
      'apiKeyTypeEnum',
      'accountRoleEnum',
      'projectRoleEnum',
    ] as const;
    for (const name of expected) {
      expect(db[name]).toBeDefined();
    }
  });

  test('re-exports the public tables', () => {
    expect(db.apiKeys).toBeDefined();
  });

  test('namespaced schema and named table refer to the same object', () => {
    expect(db.accounts).toBe(db.schema.accounts);
  });

  test('does not collide the public apiKeys with the zed zedApiKeys', () => {
    expect(db.apiKeys).not.toBe(db.zedApiKeys);
  });

  test('does not export the retired hosted-deployment schema surface', () => {
    const retiredExports = [
      ['deployments'],
      ['deployment', 'Status', 'Enum'],
      ['deployment', 'Source', 'Enum'],
      ['deployments', 'Relations'],
      ['New', 'Deployment'],
      ['Deployment', 'Select'],
    ].map((parts) => parts.join(''));

    for (const name of retiredExports) {
      expect(name in db).toBe(false);
    }
  });
});
