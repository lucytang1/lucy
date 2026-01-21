const path = require("path");
const svgTransformer = require("react-native-svg-transformer/expo");

// Prefer Expo upstream transformer when available
const upstreamTransformer = (() => {
  try {
    return require("@expo/metro-config/babel-transformer");
  } catch (e1) {
    try {
      return require("@react-native/metro-babel-transformer");
    } catch (e2) {
      return require("metro-react-native-babel-transformer");
    }
  }
})();

function isExt(filename, ext) {
  return path.extname(filename).toLowerCase() === ext;
}

module.exports.transform = function (props) {
  const { filename, src } = props;

  if (isExt(filename, ".md")) {
    const code = `module.exports = ${JSON.stringify(src)};`;
    return upstreamTransformer.transform({
      ...props,
      src: code,
    });
  }

  if (isExt(filename, ".svg")) {
    return svgTransformer.transform(props);
  }

  return upstreamTransformer.transform(props);
};
