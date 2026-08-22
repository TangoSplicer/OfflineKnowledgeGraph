import { Tabs } from "expo-router";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= 860;
  const bottomPadding = isWideWeb ? 24 : Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#9D92FF",
        tabBarInactiveTintColor: "#7E8AA5",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarPosition: isWideWeb ? "left" : "bottom",
        tabBarLabelPosition: isWideWeb ? "beside-icon" : "below-icon",
        tabBarItemStyle: isWideWeb
          ? {
              borderRadius: 14,
              marginHorizontal: 12,
              marginVertical: 4,
              minHeight: 52,
            }
          : undefined,
        tabBarLabelStyle: isWideWeb
          ? { fontSize: 13, fontWeight: "800", marginLeft: 8 }
          : undefined,
        tabBarStyle: {
          paddingTop: isWideWeb ? 24 : 8,
          paddingBottom: bottomPadding,
          height: isWideWeb ? undefined : tabBarHeight,
          width: isWideWeb ? 220 : undefined,
          backgroundColor: "#10182A",
          borderTopColor: "#26314B",
          borderTopWidth: 0.5,
          borderRightColor: "#26314B",
          borderRightWidth: isWideWeb ? 0.5 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="circle.hexagongrid.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="books.vertical.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
