interface BillingRotationConfig {
  ZED_BILLING_INTERNAL_ENABLED: boolean;
  ZED_WORKERS_ENABLED: boolean;
}

export function billingRotationIntervalsEnabled(config: BillingRotationConfig): boolean {
  return config.ZED_BILLING_INTERNAL_ENABLED && config.ZED_WORKERS_ENABLED;
}
