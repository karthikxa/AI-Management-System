import { describe, expect, test } from 'bun:test';
import { billingRotationIntervalsEnabled } from './rotation-schedule';

describe('billingRotationIntervalsEnabled', () => {
  test('starts rotations only on a billing-enabled worker deployment', () => {
    expect(
      billingRotationIntervalsEnabled({
        ZED_BILLING_INTERNAL_ENABLED: true,
        ZED_WORKERS_ENABLED: true,
      }),
    ).toBe(true);
    expect(
      billingRotationIntervalsEnabled({
        ZED_BILLING_INTERNAL_ENABLED: true,
        ZED_WORKERS_ENABLED: false,
      }),
    ).toBe(false);
    expect(
      billingRotationIntervalsEnabled({
        ZED_BILLING_INTERNAL_ENABLED: false,
        ZED_WORKERS_ENABLED: true,
      }),
    ).toBe(false);
  });
});
