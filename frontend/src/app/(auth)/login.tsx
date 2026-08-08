import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

const COUNTRY_CODES = [
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
];

export default function AuthPortal() {
  const { signIn } = useAuth();

  // UI States
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(COUNTRY_CODES[0]);
  const [confirmPassword, setConfirmPassword] = useState("");

  const baseUrl =
    Platform.OS === "android"
      ? "http://10.0.2.2:8000"
      : "http://127.0.0.1:8000";

  // Toggle Animation Style
  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    left: withSpring(isLogin ? "1.5%" : "50.5%", {
      damping: 20,
      stiffness: 100,
    }),
  }));

  const triggerAlert = (title: string, message: string) => {
    Platform.OS === "web"
      ? alert(`${title}: ${message}`)
      : Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (!email || !password)
      return triggerAlert("Error", "Please fill in all fields.");

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Unable to read server response.");
      }

      if (!response.ok) throw new Error(data.detail || "Login failed");

      await signIn(data.access_token, data.role);
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        triggerAlert(
          "Network Error",
          "Unable to reach the server. Ensure backend is running.",
        );
      } else {
        triggerAlert("Login Failed", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return triggerAlert("Error", "Please fill in all fields.");
    }
    if (password !== confirmPassword) {
      return triggerAlert("Error", "Passwords do not match.");
    }
    if (password.length < 8) {
      return triggerAlert("Error", "Password must be at least 8 characters.");
    }

    setLoading(true);
    try {
      // Data correctly formatted to map directly to the Pydantic Schema
      const formattedPhone = `${country.code}${phone.trim().replace(/^0+/, "")}`;

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: formattedPhone,
          password: password,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Unable to read server response.");
      }

      if (!response.ok) throw new Error(data.detail || "Registration failed");

      triggerAlert("Success", "Account created successfully! Please log in.");
      setIsLogin(true); // Automatically slide back to login view
      setPassword(""); // Clear passwords for security
      setConfirmPassword("");
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        triggerAlert(
          "Network Error",
          "Unable to reach the server. Ensure backend is running.",
        );
      } else {
        triggerAlert("Registration Failed", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isLogin ? "Welcome Back." : "Create Account."}
            </Text>
            <Text style={styles.subText}>
              {isLogin
                ? "Sign in to access your dashboard."
                : "Join us to get your RFID card."}
            </Text>
          </View>

          {/* Animated Toggle Switch */}
          <View style={styles.toggleContainer}>
            <Animated.View
              style={[styles.toggleIndicator, animatedIndicatorStyle]}
            />
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setIsLogin(true)}
            >
              <Text
                style={[styles.toggleText, isLogin && styles.toggleTextActive]}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setIsLogin(false)}
            >
              <Text
                style={[styles.toggleText, !isLogin && styles.toggleTextActive]}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* LOGIN FORM */}
          {isLogin ? (
            <Animated.View
              entering={FadeIn.duration(400)}
              exiting={FadeOut.duration(200)}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.btnText}>
                  {loading ? "Authenticating..." : "Sign In"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            /* REGISTER FORM */
            <Animated.View
              entering={FadeIn.duration(400)}
              exiting={FadeOut.duration(200)}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.countrySelector}
                    onPress={() => setShowCountryPicker(!showCountryPicker)}
                  >
                    <Text style={styles.flagText}>{country.flag}</Text>
                    <Text style={styles.countryCodeText}>{country.code}</Text>
                    <Ionicons name="chevron-down" size={16} color="#6B7280" />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="9800000000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                {showCountryPicker && (
                  <View style={styles.inlinePicker}>
                    {COUNTRY_CODES.map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        style={styles.pickerItem}
                        onPress={() => {
                          setCountry(c);
                          setShowCountryPicker(false);
                        }}
                      >
                        <Text style={styles.pickerItemText}>
                          {c.flag} {c.name} ({c.code})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Repeat password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.btnText}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    height: 48,
    marginBottom: 32,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleIndicator: {
    position: "absolute",
    width: "48%",
    height: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#111827",
  },
  inputGroup: {
    marginBottom: 20,
    zIndex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: "#FFFFFF",
    color: "#111827",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    height: 52,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111827",
    height: "100%",
  },
  eyeIcon: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
  },
  phoneRow: {
    flexDirection: "row",
    gap: 12,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    height: 52,
    gap: 6,
  },
  flagText: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  inlinePicker: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  pickerItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerItemText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  primaryBtn: {
    height: 54,
    backgroundColor: "#111827",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
