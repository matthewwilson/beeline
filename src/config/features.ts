// Consent for BeeLine's proposed client-side display use was confirmed by the project owner.
// Retain an emergency off switch without requiring every local build to provide an environment file.
export const HABITAT_NETWORKS_ENABLED = import.meta.env.VITE_HABITAT_NETWORKS_ENABLED !== 'false'
