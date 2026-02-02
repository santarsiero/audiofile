export class ProviderInterface {
  async search(query, options) {
    throw new Error('ProviderInterface.search not implemented');
  }

  async import(trackId, options) {
    throw new Error('ProviderInterface.import not implemented');
  }

  getProviderType() {
    throw new Error('ProviderInterface.getProviderType not implemented');
  }
}
