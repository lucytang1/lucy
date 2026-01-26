import { useRef, useEffect, useCallback, useState } from 'react';
import {View, Text, LayoutChangeEvent, ScrollView, Pressable, Linking} from 'react-native';
import {Canvas, CanvasRef} from 'react-native-wgpu';
import { useRouter } from 'expo-router';
import  makeConfig  from '../webgpu/config';
import { main, MatrixController } from '../webgpu';
import Github from '../../assets/logos/github-white.svg';

export default function BlogScreen() {
    const router = useRouter();
    const canvasRef = useRef<CanvasRef>(null);
    const controllerRef = useRef<MatrixController | null>(null);
    const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const onlayout = useCallback((e: LayoutChangeEvent) => {
        const {width, height} = e.nativeEvent.layout;
        setViewSize({ width, height });
    }, []);
    
    // Initialize once when canvas and initial size are ready
    useEffect(() => {
        if (isInitialized || !viewSize.width || !viewSize.height) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        let cancelled = false;
        setError(null);

        (async () => {
            try {
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
    }, [viewSize.width, viewSize.height, isInitialized]);

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
            <Canvas ref={canvasRef} className='flex-1 absolute inset-0 z-0 bg-vb'/>
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