import React, { createContext, useContext, useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  SafeAreaView,
} from "react-native";
import { Slot } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  credit_balance: number;
  role: string;
  rfid_card?: {
    card_key: string;
    is_active: boolean;
  } | null;
  card_request?: {
    id: number;
    status: string;
    province: string;
    district: string;
    city: string;
    street_name: string;
  } | null;
}

interface UserProfileContextProps {
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextProps | undefined>(
  undefined,
);

export const useUserProfile = () => {
  const ctx = useContext(UserProfileContext);
  if (!ctx)
    throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
};

export default function UserLayout() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl =
    Platform.OS === "android"
      ? "http://10.0.2.2:8000"
      : "http://127.0.0.1:8000";

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch user profile", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <UserProfileContext.Provider
      value={{ profile, refreshProfile: fetchProfile }}
    >
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.content}>
          <Slot />
        </View>
        <Footer />
      </SafeAreaView>
    </UserProfileContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
});
