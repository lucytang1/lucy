// This worker serves static assets from the dist folder.
// The assets binding handles serving files automatically.
const IMMUTABLE_PREFIXES = ["/_expo/static/", "/assets/", "/fonts/", "/shaders/"];

export default {
  async fetch(request, env) {
    // Static assets are served automatically via the assets binding.
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    // Belt-and-suspenders alongside dist/_headers: hashed bundles, the glyph
    // atlas, WGSL shaders and fonts never change without their URL changing,
    // so they are safe to cache immutably at the edge and in the browser.
    // HTML and everything else passes through untouched (must revalidate so
    // deploys take effect immediately).
    if (
      response &&
      response.ok &&
      IMMUTABLE_PREFIXES.some((p) => url.pathname.startsWith(p))
    ) {
      const headers = new Headers(response.headers);
      if (!headers.has("Cache-Control")) {
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};
