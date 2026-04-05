import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';

import App from './App';

// ── Expo Go OAuth bounce-back (web only) ──────────────────────────────────────
// When Supabase redirects back to the site URL after Google sign-in from Expo Go,
// the URL contains ?nativeRedirect=exp://... and #access_token=... in the hash.
// This runs immediately (before React renders) and bounces the browser to the
// exp:// URL so openAuthSessionAsync can intercept it and complete the flow.
if (typeof window !== 'undefined' && window.location != null) {
  const hash = window.location.hash;
  const search = window.location.search;
  if (hash.includes('access_token') || hash.includes('refresh_token')) {
    const params = new URLSearchParams(search);
    const nativeRedirect = params.get('nativeRedirect');
    if (nativeRedirect) {
      window.location.replace(nativeRedirect + hash);
    }
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
