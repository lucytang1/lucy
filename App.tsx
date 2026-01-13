import "./global.css"
import {useFonts} from "expo-font";
import BlogScreen from "./src/screens/blog";
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
    <BlogScreen />
  );
}