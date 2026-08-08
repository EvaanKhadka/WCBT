import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { jwtDecode } from "jwt-decode";

interface AuthState {
  token: string | null;
  role: "USER" | "ADMIN" | "PARKING_LOT" | null;
  isLoading: boolean;
}

interface AuthContextProps extends AuthState {
  signIn: (token: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Web polyfill: Uses sessionStorage so data strictly clears on app/tab close
const setStorageItemAsync = async (key: string, value: string) => {
  if (Platform.OS === "web") {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.error("Session storage error", e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getStorageItemAsync = async (key: string) => {
  if (Platform.OS === "web") {
    return sessionStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

const removeStorageItemAsync = async (key: string) => {
  if (Platform.OS === "web") {
    sessionStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    role: null,
    isLoading: true,
  });

  useEffect(() => {
    // Check for tokens and validate their lifecycle on App Start
    const bootstrapAsync = async () => {
      try {
        const token = await getStorageItemAsync("userToken");
        const role = (await getStorageItemAsync(
          "userRole",
        )) as AuthState["role"];

        if (token && role) {
          // Verify token expiration
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp && decodedToken.exp < currentTime) {
            // Token expired - wipe and force re-login
            await removeStorageItemAsync("userToken");
            await removeStorageItemAsync("userRole");
            setAuthState({ token: null, role: null, isLoading: false });
          } else {
            // Token valid
            setAuthState({ token, role, isLoading: false });
          }
        } else {
          setAuthState({ token: null, role: null, isLoading: false });
        }
      } catch (e) {
        // Fallback catch (eg: invalid JWT payload) wipes state securely
        await removeStorageItemAsync("userToken");
        await removeStorageItemAsync("userRole");
        setAuthState({ token: null, role: null, isLoading: false });
      }
    };
    bootstrapAsync();
  }, []);

  const signIn = async (token: string, role: string) => {
    await setStorageItemAsync("userToken", token);
    await setStorageItemAsync("userRole", role);
    setAuthState({ token, role: role as AuthState["role"], isLoading: false });
  };

  const signOut = async () => {
    await removeStorageItemAsync("userToken");
    await removeStorageItemAsync("userRole");
    setAuthState({ token: null, role: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
