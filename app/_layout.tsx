import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "../hooks/useAuth";

function RootLayoutNav() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isLoggedIn && !inAuthGroup) {
      // Redirect to the sign-in page.
     router.replace("/login");
    } else if (isLoggedIn && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace("/");
    }
  }, [isLoggedIn, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0066b3" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Tajawal: require("../assets/fonts/Tajawal-Regular.ttf"),
  });

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  console.log("Fonts Loaded:", fontsLoaded);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading ...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
      <Toast />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f0f4f7",
  },
});
