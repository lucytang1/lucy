import type { PipelineContext } from "./types";
import { Image } from "react-native";

type AssetLike = string | number;

const resolveAssetUri = async (asset: AssetLike): Promise<string> => {
	// Normal web URL or file URL
	if (typeof asset === "string") return asset;

	// Prefer expo-asset on all platforms (works on web + native).
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { Asset } = require("expo-asset");
		const expoAsset = Asset.fromModule(asset);
		await expoAsset.downloadAsync();
		const uri = expoAsset.localUri ?? expoAsset.uri;
		if (uri) return uri;
	} catch {
		// ignore and fall back
	}

	// Fallback: RN core resolver (may not exist on web).
	const resolveFn = (Image as any)?.resolveAssetSource;
	if (typeof resolveFn === "function") {
		const resolved = resolveFn(asset);
		const uri = resolved?.uri;
		if (uri) return uri;
	}

	throw new Error(`Unable to resolve asset URI for module id: ${String(asset)}`);
};

const loadTexture = async (
	device: GPUDevice,
	url: AssetLike | null,
	flipY: boolean = true,
	premultiply: boolean = false
) => {
	if (url == null) {
		return device.createTexture({
			size: [1, 1, 1],
			format: "rgba8unorm",
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
		});
	}

	const uri = await resolveAssetUri(url);
	const response = await fetch(uri);
	const data = await response.blob();
	const source = await createImageBitmap(data, { premultiplyAlpha: premultiply ? "premultiply" : "none" });
	const size = [source.width, source.height, 1];

	const texture = device.createTexture({
		size,
		format: "rgba8unorm",
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
	});

	device.queue.copyExternalImageToTexture({ source, flipY }, { texture }, size);

	return texture;
};

const makeRenderTarget = (device: GPUDevice, size: any, format: any, mipLevelCount = 1) =>
	device.createTexture({
		size: [...size, 1],
		mipLevelCount,
		format,
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
	});

const makeComputeTarget = (device: GPUDevice, size: any, mipLevelCount = 1) =>
    device.createTexture({
        size: [...size, 1],
        mipLevelCount,
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING,
    });

const loadShader = async (device: GPUDevice, url: AssetLike) => {
	const uri = await resolveAssetUri(url);
	const response = await fetch(uri);
	const code = await response.text();
	return {
		code,
		module: device.createShaderModule({ code }),
	};
};

const makeUniformBuffer = (device: GPUDevice, uniforms: any, data: any | null = null) => {
	const buffer = device.createBuffer({
		size: uniforms.minSize,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		mappedAtCreation: data != null,
	});
	if (data != null) {
		uniforms.toBuffer(data, buffer.getMappedRange());
		buffer.unmap();
	}
	return buffer;
};

const make1DTexture = (device: GPUDevice, rgbas: any) => {
	const size = [rgbas.length];
	const texture = device.createTexture({
		size,
		format: "rgba8unorm",
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
	});
	const data = new Uint8ClampedArray(rgbas.map((color: any) => color.map((f: any) => f * 0xff)).flat());
	device.queue.writeTexture({ texture }, data, {}, size);
	return texture;
};

const makeBindGroup = (device: GPUDevice, pipeline: any, index: number, entries: any) => {
    return device.createBindGroup({
        layout: pipeline.getBindGroupLayout(index),
        entries: entries
        .map((resource: any) => (resource instanceof GPUBuffer ? { buffer: resource } : resource))
        .map((resource: any, binding: any) => ({
            binding,
            resource,
        })),
    });
}

const makePass = (name: any, loaded: any, build: any, run: any) => ({
	loaded: loaded ?? Promise.resolve(),
	build: build ?? ((size: any, inputs: any) => inputs),
	run: (encoder: GPUCommandEncoder, shouldRender: boolean) => {
		encoder.pushDebugGroup(`Pass "${name}"`);
		run?.(encoder, shouldRender);
		encoder.popDebugGroup();
	},
});



const makePipeline = async (context: PipelineContext, steps:any[]) => {
    steps = steps.filter((f) => f != null).map((f) => f(context));
    await Promise.all(steps.map((step) => step.loaded));
    return {
		steps,
		build: (canvasSize: Array<number>) => steps.reduce((outputs, step) => step.build(canvasSize, outputs), null),
		run: (encoder: GPUCommandEncoder, shouldRender: boolean) => steps.forEach((step) => step.run(encoder, shouldRender)),
	};
}

export {loadTexture, makeRenderTarget, makeComputeTarget, loadShader, makeUniformBuffer, make1DTexture, makeBindGroup, makePass, makePipeline};