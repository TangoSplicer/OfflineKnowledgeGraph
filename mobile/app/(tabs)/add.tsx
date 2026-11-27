import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

/**
 * Fallback for the persistent "+" tab action. The tab bar's custom button
 * opens capture directly, so this screen is only reached by a deep link —
 * in which case it redirects to capture as well.
 */
export default function AddTabRedirect() {
  useEffect(() => {
    router.replace("/capture");
  }, []);
  return <View />;
}
