import { View, Text } from "react-native";

export default function BulletBlocks({points}: {points: string[]}) {

    return(
        <View className='px-8 my-4'>
            {points.map((point, index) => (
                <BulletPoint key={index} point={point} />
            ))}
        </View>
    )
}

function BulletPoint({point}: {point: string}) {
    return(
        <View className='flex-row items-start'>
            <View className='w-3 h-0.5 bg-mc mr-2 mt-2'></View>
            <Text className='font-neo text-white text-sm tracking-tighter flex-1'>{point}</Text>
        </View>
    )
}