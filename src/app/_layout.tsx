import "../../global.css"
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import { Text } from "react-native";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    matrix: require("../../assets/fonts/matrix-code.otf"),
    neo: require("../../assets/fonts/neo-pc.otf"),
  });

  if (!fontsLoaded) {
    return <Text>Loading fonts...</Text>;
  }

  return <Slot />;
}