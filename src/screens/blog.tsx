import { useRef, useEffect, useCallback, useState } from 'react';
import {View, Text, LayoutChangeEvent} from 'react-native';
import {Canvas, CanvasRef} from 'react-native-wgpu';
import  makeConfig  from '../webgpu/config';
import { main } from '../webgpu';

export default function BlogScreen() {
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
            <Canvas ref={canvasRef} className='flex-1'/>
            {!!error && (
                <View className="absolute inset-0 items-center justify-center p-4">
                    <Text className="text-white" style={{ backgroundColor: "rgba(0,0,0,0.7)", padding: 12 }}>
                        {error}
                    </Text>
                </View>
            )}
        </View>
    )
}