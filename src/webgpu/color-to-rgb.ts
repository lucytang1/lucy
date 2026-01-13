export default ({ space, values } : {space: any, values: any}) => {
	if (space === "rgb") {
		return values;
	}
	const [hue, saturation, lightness] = values;
	const a = saturation * Math.min(lightness, 1 - lightness);
	const f = (n: number) => {
		const k = (n + hue * 12) % 12;
		return lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
	};
	return [f(0), f(8), f(4)];
};
