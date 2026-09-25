import { ScrollViewStyleReset } from "expo-router/html";

// Custom HTML shell for web static export (`expo export --platform web`).
// This is baked into dist/index.html / dist/ota.html at build time, so
// everything here applies before ANY network-dependent CSS/JS loads.
//
// Why: on Cloudflare the 1.3MB JS bundle + fonts + WGSL shaders each need
// real network roundtrips (locally they're ~instant), so the browser painted
// a default white viewport until the Matrix canvas + CSS arrived.
// The inline <style> below paints the page background instantly at HTML
// parse time, and the <link rel="preload"> tags let the browser download
// fonts in parallel with the JS bundle instead of after the CSS.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        {/* Critical paint: dark background with zero network dependency.
            Must come before any external stylesheet. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html,body,#root{background-color:#0D0208!important;min-height:100%;margin:0}`,
          }}
        />
        {/* Start downloading display fonts with the HTML, not after CSS/JS.
            These are stable public/ URLs (copied to dist/fonts/). */}
        <link
          rel="preload"
          href="/fonts/matrix-code.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/neo-pc.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
