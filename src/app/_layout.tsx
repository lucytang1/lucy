import "../../global.css"
import { Slot } from "expo-router";
import { Text, View } from "react-native";
import { PostHogProvider } from 'posthog-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function RootLayout() {
  return (
    // <PostHogProvider apiKey="phc_hPhzKttZrCe9Mv8wYiXdCYq7nQsl6LypkOK2853BnnK" options={{
    //   host: 'https://prp.lucytang.dev',
    //   customStorage: AsyncStorage
    // }}>
    // {/* </PostHogProvider> */}
    <Slot />
  );
}