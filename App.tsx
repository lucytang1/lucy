import "./global.css"
import {useFonts} from "expo-font";
import { Text, View } from "react-native";
 
export default function App() {
  const [fontsLoaded] = useFonts({
    matrix: require("./assets/fonts/matrix-code.otf"),
    neoneon: require("./assets/fonts/neo-pc.otf"),
  })
  if (!fontsLoaded) {
    return <Text>Loading fonts...</Text>
  }
  return (
    <View className="flex-1 items-center justify-center bg-vb">
      <Text className="text-xl  text-ig font-neo">
        Knock knock Neo.
      </Text>
    </View>
  );
}