import { createRouter } from 'zephyrflow-router';

// Retries are currently unconfigured. We need the correct option names for
// bounded retries with exponential backoff.
export const router = createRouter({
  routes: [{ path: '/reports/:id', handler: 'reports.show' }],
});
