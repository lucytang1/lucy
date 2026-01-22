// This worker serves static assets from the dist folder
// The assets binding handles serving files automatically
export default {
  async fetch(request, env) {
    // Static assets are served automatically via the assets binding
    // This fetch handler is for any custom logic (optional)
    return env.ASSETS.fetch(request);
  },
};
