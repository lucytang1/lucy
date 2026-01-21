import { useRef, useEffect, useCallback, useState } from 'react';
import {View, Text, LayoutChangeEvent, ScrollView, Pressable, Linking} from 'react-native';
import {Canvas, CanvasRef} from 'react-native-wgpu';
import { useRouter } from 'expo-router';
import  makeConfig  from '../webgpu/config';
import { main } from '../webgpu';
import Github from '../../assets/logos/github-white.svg';

export default function BlogScreen() {
    const router = useRouter();
    const canvasRef = useRef<CanvasRef>(null);
    const [viewSize, setViewSize] = useState({ width: 0, height: 0 })
    const [error, setError] = useState<string | null>(null);
    const onlayout =  useCallback((e: LayoutChangeEvent) => {
        const {width, height} = e.nativeEvent.layout;
        setViewSize({ width, height });
    }, []);
    
    useEffect(() => {
        if (!viewSize.width || !viewSize.height) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        let cleanup: undefined | (() => void);
        let cancelled = false;
        setError(null);

        (async () => {
            try {
                const config = makeConfig();
                cleanup = await main({canvas, config, clientwidth: viewSize.width, clientheight: viewSize.height});
            } catch (e: any) {
                if (cancelled) return;
                const message = e?.message ? String(e.message) : String(e);
                setError(message);
                // eslint-disable-next-line no-console
                console.error("Matrix init failed:", e);
            }
        })();

        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, [viewSize.width, viewSize.height])
    return (
        <View className='flex-1' onLayout={onlayout}>
            <Canvas ref={canvasRef} className='flex-1 absolute inset-0 z-0'/>
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