import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useUserProfile } from "../app/(user)/_layout";

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useUserProfile();

  const hasCard = !!profile?.rfid_card;

  const NavItem = ({ name, iconName, path, hasBadge = false }: any) => {
    const isActive = pathname === path;
    const color = isActive ? "#111827" : "#9CA3AF";

    return (
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push(path)}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={isActive ? iconName : `${iconName}-outline`}
            size={24}
            color={color}
          />
          {hasBadge && <View style={styles.badge} />}
        </View>
        <Text style={[styles.navText, { color }]}>{name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.footerContainer}>
      <NavItem name="Home" iconName="home" path="/(user)/home" />
      <NavItem
        name="Card"
        iconName="card"
        path="/(user)/request"
        hasBadge={!hasCard}
      />
      <NavItem name="Settings" iconName="settings" path="/(user)/settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: Platform.OS === "ios" ? 24 : 16,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#EF4444",
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
