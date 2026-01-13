// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");
 
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow bundling WGSL shader sources via `require(".../*.wgsl")`.
// We'll resolve these to a URI at runtime and `fetch()` them as text.
config.resolver.assetExts = Array.from(new Set([...(config.resolver.assetExts ?? []), "wgsl"]));
 
module.exports = withNativewind(config);