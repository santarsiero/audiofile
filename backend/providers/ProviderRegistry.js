import { APPLE_MUSIC } from './providerTypes.js';
import { ProviderError } from './contracts/ProviderError.js';

export class ProviderRegistry {
  constructor(providerMap) {
    this._providers = providerMap ?? new Map();
    this._defaultsRegistered = false;
  }

  async _ensureDefaultsRegistered() {
    if (this._defaultsRegistered) return;

    if (!this._providers.has(APPLE_MUSIC)) {
      const { AppleMusicProvider } = await import('./apple/AppleMusicProvider.js');
      this._providers.set(APPLE_MUSIC, new AppleMusicProvider());
    }

    this._defaultsRegistered = true;
  }

  register(providerType, providerInstance) {
    this._providers.set(providerType, providerInstance);
  }

  async get(providerType) {
    await this._ensureDefaultsRegistered();
    return this._providers.get(providerType);
  }

  async has(providerType) {
    await this._ensureDefaultsRegistered();
    return this._providers.has(providerType);
  }

  async listProviderTypes() {
    await this._ensureDefaultsRegistered();
    return Array.from(this._providers.keys());
  }
}

export const providerRegistry = new ProviderRegistry();

export async function resolveProvider(providerType) {
  const provider = await providerRegistry.get(providerType);
  if (!provider) {
    throw new ProviderError({
      providerType,
      stage: 'resolve',
      reason: `Provider not registered: ${providerType}`,
      raw: { providerType },
    });
  }
  return provider;
}
