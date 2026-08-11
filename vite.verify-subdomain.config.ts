// One-shot verifier config — inherits from vite.config.ts and opens the
// preview server's Host header check so curl / chromium can hit
// `minicamp.innoseed.club:8765` against 127.0.0.1.
//
// NOT for production. Production is served by Vercel, which is the right
// layer to enforce Host policies.
//
// Usage: pnpm exec vite preview --config vite.verify-subdomain.config.ts --port 8765
import config from './vite.config';

export default {
  ...config,
  preview: {
    ...(config.preview ?? {}),
    host: '127.0.0.1',
    port: 8765,
    // Vite 5+ rejects requests whose Host header doesn't match the bound
    // address. We're testing the in-app hostname detection, so we need
    // `minicamp.innoseed.club` to be accepted.
    //
    // `true` is the Vite-doc way to disable the check entirely for a
    // local verifier; we're not exposing this to anything but our test
    // browser, so an over-broad allow is fine.
    allowedHosts: true,
  },
};