export interface PipelineContext {
    config: any;
    adapter: GPUAdapter;
    device: GPUDevice;
    canvasFormat: GPUTextureFormat;
    timeBuffer: GPUBuffer;
    canvasContext: GPUCanvasContext;

}