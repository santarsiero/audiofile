export class ProviderError extends Error {
  constructor({ providerType, stage, reason, raw }) {
    super(reason);
    this.name = 'ProviderError';
    this.providerType = providerType;
    this.stage = stage;
    this.reason = reason;
    this.raw = raw;
  }

  toJSON() {
    return {
      name: this.name,
      providerType: this.providerType,
      stage: this.stage,
      reason: this.reason,
      raw: this.raw,
    };
  }
}
