import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ActivityIndicator, View } from "react-native";

// The Inner Layout strictly guards routing changes
function RootLayoutNav() {
  const { token, role, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for initial check

    const inAuthGroup = segments[0] === "(auth)";

    // Authentication Router Logic Engine
    if (!token && !inAuthGroup) {
      // 1. Kick unauthenticated users back to login
      router.replace("/(auth)/login");
    } else if (token) {
      // 2. Safely route authenticated users based on role exactly
      if (role === "USER" && segments[0] !== "(user)") {
        router.replace("/(user)/home");
      } else if (role === "ADMIN" && segments[0] !== "(admin)") {
        router.replace("/(admin)");
      } else if (role === "PARKING_LOT" && segments[0] !== "(parkinglot)") {
        router.replace("/(parkinglot)");
      }
    }
  }, [token, role, isLoading, segments, router]);

  // Loading Screen Maximalist App Feel
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FDFDFD",
        }}
      >
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // <Slot/> dynamically injects our screens
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
