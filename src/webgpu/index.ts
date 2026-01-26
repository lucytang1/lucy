import { PixelRatio } from "react-native";
import {makePipeline, makeUniformBuffer} from "./utils";
import type { PipelineContext } from "./types";
import type { CanvasRef } from "react-native-wgpu";
import { structs } from "./lib/gpu-buffer";

import rainpass from "./rainpass";
import bloompass from "./bloompass";
import palletepass from "./palletepass";
import endpass from "./endpass";

export type MatrixController = {
    resize: (width: number, height: number) => void;
    stop: () => void;
};

export async function main({canvas, config, clientwidth, clientheight} : {canvas: CanvasRef, config: any, clientwidth: number, clientheight: number}): Promise<MatrixController> {
    // Mutable size that can be updated without restarting
    let currentWidth = clientwidth;
    let currentHeight = clientheight;
    const canvasFormat = await navigator.gpu.getPreferredCanvasFormat();
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No adapter found");
    }
    const device = await adapter.requestDevice();
    const canvasContext = canvas.getContext('webgpu');
    if (!canvasContext) {
        throw new Error("No canvas context found");
    }

    canvasContext.configure({
        device,
        format: canvasFormat,
        alphaMode: "opaque",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
    });

    const timeUniforms = structs.from(`struct Time { seconds : f32, frames : i32, };`).Time;
	const timeBuffer = makeUniformBuffer(device, timeUniforms);

    const context: PipelineContext = {
        config,
        adapter,
        device,
        canvasFormat,
        timeBuffer,
        canvasContext,
    }
    
    const pipeline = await makePipeline(context, [rainpass, bloompass, palletepass, endpass]);
    const targetFrameTimeMilliseconds = 1000 / config.fps;
    let frames = 0;
    let start = NaN;
	let last = NaN;
	let outputs;
	let rafId: number | null = null;
	let stopped = false;
	let lastCanvasSize: [number, number] | null = null;

    const renderLoop = (now: any) => {
		if (stopped) return;
        if (isNaN(start)) start = now;
        if (isNaN(last)) last = now;

        const shouldRender= config.fps >= 60 || now - last >= targetFrameTimeMilliseconds;
        if (shouldRender) {
			while (now - targetFrameTimeMilliseconds > last) {
				last += targetFrameTimeMilliseconds;
			}
		}

        const devicePixelRatio = PixelRatio.get() || 1;
		const canvasWidth = Math.ceil(currentWidth * devicePixelRatio * config.resolution);
		const canvasHeight = Math.ceil(currentHeight * devicePixelRatio * config.resolution);
		const canvasSize: [number, number] = [canvasWidth, canvasHeight];

		// On native surfaces, explicitly configure the swapchain size; otherwise it can remain 0x0.
		if (!lastCanvasSize || canvasSize[0] !== lastCanvasSize[0] || canvasSize[1] !== lastCanvasSize[1]) {
			(canvasContext as any).configure({
				device,
				format: canvasFormat,
				alphaMode: "opaque",
				usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
				size: canvasSize,
			} as any);
			outputs = pipeline.build(canvasSize);
			lastCanvasSize = canvasSize;
		}

		device.queue.writeBuffer(timeBuffer, 0, timeUniforms.toBuffer({ seconds: (now - start) / 1000, frames }));
        frames++;



        const encoder = device.createCommandEncoder();
        pipeline.run(encoder, shouldRender);

        device.queue.submit([encoder.finish()]);

        rafId = requestAnimationFrame(renderLoop);
    }
    rafId = requestAnimationFrame(renderLoop);

	return {
		resize: (width: number, height: number) => {
			currentWidth = width;
			currentHeight = height;
		},
		stop: () => {
			stopped = true;
			if (rafId != null) cancelAnimationFrame(rafId);
		}
	};
}