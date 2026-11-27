import { router, Tabs } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= 860;
  const bottomPadding = isWideWeb ? 24 : Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
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
        tabBarLabelStyle: { fontSize: 13, fontWeight: "800" },
        tabBarStyle: {
          paddingTop: isWideWeb ? 24 : 8,
          paddingBottom: bottomPadding,
          height: isWideWeb ? undefined : tabBarHeight,
          width: isWideWeb ? 220 : undefined,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          borderRightColor: colors.border,
          borderRightWidth: isWideWeb ? 0.5 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarAccessibilityLabel: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarAccessibilityLabel: "Explore your graph",
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="circle.hexagongrid.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarAccessibilityLabel: "Add a new concept",
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="plus" color={color} />,
          // A persistent add action in the tab bar: it never opens a tab
          // screen, it opens capture directly. (tabs)/add.tsx exists only as
          // a fallback that redirects to capture if this route is ever
          // reached by a deep link.
          tabBarButton: (props: any) => (
            <Pressable
              {...props}
              accessibilityRole="button"
              accessibilityLabel="Add a new concept"
              onPress={() => router.push("/capture")}
              style={[props.style, styles.addTab]}
            >
              <View style={styles.addTabCircle}>
                <Text style={styles.addTabPlus}>＋</Text>
              </View>
              <Text style={styles.addTabLabel}>Add</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarAccessibilityLabel: "Library",
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="books.vertical.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addTab: { alignItems: "center", justifyContent: "center", paddingTop: 4 },
  addTabCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#7C6CFF", alignItems: "center", justifyContent: "center" },
  addTabPlus: { color: "#FFFFFF", fontSize: 26, lineHeight: 28, fontWeight: "900", marginTop: -2 },
  addTabLabel: { color: "#7E8AA5", fontSize: 13, fontWeight: "800", marginTop: 2 },
});
