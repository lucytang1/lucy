import { forwardRef, useState, useEffect } from 'react';
import { View } from 'react-native';
import type { CanvasRef } from 'react-native-wgpu';

type WebGPUCanvasProps = {
  className?: string;
};

export const WebGPUCanvas = forwardRef<CanvasRef, WebGPUCanvasProps>(
  ({ className }, ref) => {
    const [Canvas, setCanvas] = useState<any>(null);

    useEffect(() => {
      // Only import on client-side where window is defined
      if (typeof window !== 'undefined') {
        import('react-native-wgpu').then((mod) => {
          setCanvas(() => mod.Canvas);
        });
      }
    }, []);

    if (!Canvas) {
      // Placeholder while loading or during SSR
      return <View className={className} />;
    }

    return <Canvas ref={ref} className={className} />;
  }
);
