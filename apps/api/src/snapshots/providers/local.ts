/**
 * Local snapshot adapter — no-op stubs so ensureSandboxImage() doesn't throw.
 */

export const localProvider = {
  id: 'local',

  async buildSnapshot(_input, _tap) {
    return undefined;
  },

  async getSnapshotState(_snapshotName) {
    return 'active';
  },

  async deleteSnapshot(_snapshotName) {
    // no-op
  },

  async listSnapshots() {
    return [];
  },

  isConfigured() {
    return true;
  },
};
