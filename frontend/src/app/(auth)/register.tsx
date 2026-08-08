import { Redirect } from "expo-router";

// Registration is now handled flawlessly within the unified login portal
export default function RegisterScreen() {
  return <Redirect href="/(auth)/login" />;
}
