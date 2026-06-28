import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import "react-native-gesture-handler";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal"
        }}
      >
        <Stack.Screen name="index" options={{ title: "Check In" }} />
        <Stack.Screen name="capture" options={{ title: "Photo" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
