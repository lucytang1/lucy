import "../../global.css"
import { Slot } from "expo-router";

export default function RootLayout() {
  // NOTE: keep this layout free of static native-only imports
  // (e.g. posthog-react-native, AsyncStorage). If you re-enable PostHog,
  // dynamically import it inside a `useEffect` guarded by
  // `typeof window !== 'undefined'` so Node static rendering
  // (`expo export --platform web`) doesn't hit `window is not defined`.
  return (
    <Slot />
  );
}