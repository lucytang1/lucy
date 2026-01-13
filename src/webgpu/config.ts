const hsl = (...values: any) => ({ space: "hsl", values });


const defaults = {
	font: "matrixcode",
	effect: "palette", // The name of the effect to apply at the end of the process— mainly handles coloration
	baseTexture: null, // The name of the texture to apply to the base layer of the glyphs
	glintTexture: null, // The name of the texture to apply to the glint layer of the glyphs
	useCamera: false,
	backgroundColor: hsl(0, 0, 0), // The color "behind" the glyphs
	isolateCursor: true, // Whether the "cursor"— the brightest glyph at the bottom of a raindrop— has its own color
	cursorColor: hsl(0.242, 1, 0.73), // The color of the cursor
	cursorIntensity: 2, // The intensity of the cursor
	isolateGlint: false, // Whether the "glint"— highlights on certain symbols in the font— should appear
	glintColor: hsl(0, 0, 1), // The color of the glint
	glintIntensity: 1, // The intensity of the glint
	volumetric: false, // A mode where the raindrops appear in perspective
	animationSpeed: 1, // The global rate that all animations progress
	fps: 60, // The target frame rate (frames per second) of the effect
	forwardSpeed: 0.25, // The speed volumetric rain approaches the eye
	bloomStrength: 0.7, // The intensity of the bloom
	bloomSize: 0.4, // The amount the bloom calculation is scaled
	highPassThreshold: 0.1, // The minimum brightness that is still blurred
	cycleSpeed: 0.03, // The speed glyphs change
	cycleFrameSkip: 1, // The global minimum number of frames between glyphs cycling
	baseBrightness: -0.5, // The brightness of the glyphs, before any effects are applied
	baseContrast: 1.1, // The contrast of the glyphs, before any effects are applied
	glintBrightness: -1.5, // The brightness of the glints, before any effects are applied
	glintContrast: 2.5, // The contrast of the glints, before any effects are applied
	brightnessOverride: 0.0, // A global override to the brightness of displayed glyphs. Only used if it is > 0.
	brightnessThreshold: 0, // The minimum brightness for a glyph to still be considered visible
	brightnessDecay: 1.0, // The rate at which glyphs light up and dim
	ditherMagnitude: 0.05, // The magnitude of the random per-pixel dimming
	fallSpeed: 0.3, // The speed the raindrops progress downwards
	glyphEdgeCrop: 0.0, // The border around a glyph in a font texture that should be cropped out
	glyphHeightToWidth: 1, // The aspect ratio of glyphs
	glyphVerticalSpacing: 1, // The ratio of the vertical distance between glyphs to their height
	glyphFlip: false, // Whether to horizontally reflect the glyphs
	glyphRotation: 0, // An angle to rotate the glyphs. Currently limited to 90° increments
	hasThunder: false, // An effect that adds dramatic lightning flashes
	isPolar: false, // Whether the glyphs arc across the screen or sit in a standard grid
	rippleTypeName: null, // The variety of the ripple effect
	rippleThickness: 0.2, // The thickness of the ripple effect
	rippleScale: 30, // The size of the ripple effect
	rippleSpeed: 0.2, // The rate at which the ripple effect progresses
	numColumns: 80, // The maximum dimension of the glyph grid
	density: 1, // In volumetric mode, the number of actual columns compared to the grid
	palette: [
		// The color palette that glyph brightness is color mapped to
		{ color: hsl(0.3, 0.9, 0.0), at: 0.0 },
		{ color: hsl(0.3, 0.9, 0.2), at: 0.2 },
		{ color: hsl(0.3, 0.9, 0.7), at: 0.7 },
		{ color: hsl(0.3, 0.9, 0.8), at: 0.8 },
	],
	raindropLength: 0.75, // Adjusts the frequency of raindrops (and their length) in a column
	slant: 0, // The angle at which rain falls; the orientation of the glyph grid
	resolution: 0.75, // An overall scale multiplier
	useHalfFloat: false,
	renderer: "regl", // The preferred web graphics API
	suppressWarnings: false, // Whether to show warnings to visitors on load
	isometric: false,
	useHoloplay: false,
	loops: false,
	skipIntro: true,
	testFix: null,
};

export default () => {
    const config = {
        ...defaults,
        // Use a bundled asset module so this works on native (Expo) and web.
        // `loadTexture` resolves this to a URI (and downloads it on native if needed).
        glyphMSDFURL: require("../../public/assets/matrixcode_msdf.png"),
        glintMSDFURL: null,
        baseTextureURL: null,
        glintTextureURL: null,
        // Font texture metadata for the matrixcode MSDF atlas
        glyphSequenceLength: 57, // number of glyphs encoded in the atlas
        glyphTextureGridSize: [8, 8], // grid dimensions of the atlas texture
        cursorBrightness: 1.0,
    }
    return config;
}