import { useRef, useEffect, useCallback, useState } from 'react';
import {View, Text, LayoutChangeEvent, ScrollView, Pressable, Linking} from 'react-native';
import { useRouter } from 'expo-router';
import type { CanvasRef } from 'react-native-wgpu';
import type { MatrixController } from '../webgpu';
import Github from '../../assets/logos/github-white.svg';

export default function BlogScreen() {
    const router = useRouter();
    const canvasRef = useRef<CanvasRef>(null);
    const controllerRef = useRef<MatrixController | null>(null);
    const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Loaded only on the client — keeps Node SSR (`expo export`) from
    // evaluating `react-native-wgpu` (its web polyfill touches `window`
    // at import time) and the WebGPU pipeline (touches `navigator.gpu`).
    const [CanvasComponent, setCanvasComponent] = useState<any>(null);

    // Warm up GPU + start downloading WebGPU chunks ASAP (in parallel with
    // first paint/layout). On localhost every fetch is ~instant so the old
    // sequential chain (layout -> import wgpu -> import webgpu -> fetch
    // shaders/textures -> compile pipelines) was invisible; on Cloudflare
    // each step costs real network roundtrips, which delayed first frame.
    // The actual WGSL/PNG bytes are additionally <link rel="preload">ed in
    // the HTML shell, so by the time main() runs fetch() hits warm cache.
    const webgpuModulesRef = useRef<Promise<any> | null>(null);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            // Kick off GPU adapter request early; result is intentionally
            // ignored — main() requests its own adapter. This just warms the
            // browser's GPU process / permission path in the background.
            (navigator as any)?.gpu?.requestAdapter?.()?.then?.(() => {}).catch?.(() => {});
        } catch {}
        if (!webgpuModulesRef.current) {
            webgpuModulesRef.current = Promise.all([
                import('../webgpu'),
                import('../webgpu/config'),
            ]);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        if (typeof window === 'undefined') return;
        import('react-native-wgpu').then((mod) => {
            if (mounted) setCanvasComponent(() => mod.Canvas);
        });
        return () => {
            mounted = false;
        };
    }, []);
    
    const onlayout = useCallback((e: LayoutChangeEvent) => {
        const {width, height} = e.nativeEvent.layout;
        setViewSize({ width, height });
    }, []);
    
    // Initialize once when canvas and initial size are ready
    // NOTE: WebGPU modules are dynamically imported so they never run
    // during server-side static rendering (Node has no `window`/`navigator`).
    useEffect(() => {
        if (isInitialized || !viewSize.width || !viewSize.height) return;
        if (!CanvasComponent) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        let cancelled = false;
        setError(null);

        (async () => {
            try {
                // Reuse the warmed-up module promises when available so we
                // don't pay for a second round of chunk downloads.
                const [{ main }, { default: makeConfig }] = await (
                    webgpuModulesRef.current ?? Promise.all([
                        import('../webgpu'),
                        import('../webgpu/config'),
                    ])
                );
                const config = makeConfig();
                const controller = await main({canvas, config, clientwidth: viewSize.width, clientheight: viewSize.height});
                if (cancelled) {
                    controller.stop();
                    return;
                }
                controllerRef.current = controller;
                setIsInitialized(true);
            } catch (e: any) {
                if (cancelled) return;
                const message = e?.message ? String(e.message) : String(e);
                setError(message);
                console.error("Matrix init failed:", e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [viewSize.width, viewSize.height, isInitialized, CanvasComponent]);

    // Handle resize without restarting animation
    useEffect(() => {
        if (!isInitialized || !viewSize.width || !viewSize.height) return;
        controllerRef.current?.resize(viewSize.width, viewSize.height);
    }, [viewSize.width, viewSize.height, isInitialized]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            controllerRef.current?.stop();
        };
    }, []);
    return (
        <View className='flex-1 bg-vb' onLayout={onlayout}>
            {CanvasComponent ? (
                <CanvasComponent ref={canvasRef} className='flex-1 absolute inset-0 z-0 bg-vb' />
            ) : (
                <View className='flex-1 absolute inset-0 z-0 bg-vb' collapsable={false} />
            )}
            <View className="absolute inset-0 z-10" collapsable={false}>
                <View className="flex-1 w-2/3 self-center bg-black">
                    <View className='items-end py-2 px-12'>
                        <Pressable onPress={() => Linking.openURL('https://github.com/lucytang1')}>
                            <Github width={34} height={34} />
                        </Pressable>
                    </View>
                    <ScrollView className='flex-1'>
                        <Text className='font-matrix text-mc text-md px-12'>2026</Text>
                        <Pressable className='px-12 mb-8' onPress={() => router.push('/ota')}>
                            {({hovered}) => {
                                return(
                                    <>
                                        <View className='flex-row mt-4 justify-between'>
                                            <Text className={`font-neo text-md tracking-tighter ${hovered ?  'text-mc' : 'text-white'}`}>App Release Architecture</Text>
                                            <Text className={`font-neo text-md tracking-tighter ${hovered ? 'text-mc' : 'text-white'}`}>January 20</Text>
                                        </View>
                                        <Text className='font-neo text-gray-400 text-md tracking-tighter'>Release and OTA strategy for Expo applications</Text>
                                    </>
                                )
                            }}
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </View>
    )
}