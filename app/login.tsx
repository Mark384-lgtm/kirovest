import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useSegments } from "expo-router";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import ApiService from "../services/ApiService";
import Icon from "react-native-vector-icons/Ionicons";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const { login, isLoggedIn, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      router.replace("/");
    }
  }, [isLoggedIn, isLoading]);

  const handleLogin = async () => {
    // Validation for email/username and password
    if (!emailOrUsername) {
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "يرجى إدخال البريد الإلكتروني أو اسم المستخدم",
      });
      return;
    }
    if (!password) {
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "يرجى إدخال كلمة المرور",
      });
      return;
    }

    setLoading(true);
    try {
      const apiService = ApiService.getInstance();
      const response = await apiService.login(emailOrUsername, password);

      console.log("Login response:", response); // Add logging

      if (response.success && response.data) {
        const { token, role_name } = response.data;

        if (!token || !role_name) {
          throw new Error("Invalid response data: missing token or role");
        }

        // Update auth context with both token and role
        await login(role_name, token);

        Toast.show({
          type: "success",
          text1: "تم تسجيل الدخول بنجاح",
          text2: "مرحباً بك!",
        });
        router.replace("/"); // Navigate to Home
      } else {
        Toast.show({
          type: "error",
          text1: "خطأ",
          text2: response.message || "فشل تسجيل الدخول",
        });
      }
    } catch (error) {
      console.error("Login error:", error); // Add error logging
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066b3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
            
              style={[styles.input, styles.inputWithIconUser]}
              placeholder="البريد الإلكتروني أو اسم المستخدم"
              placeholderTextColor="#666"
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              autoCapitalize="none"
              autoCorrect={false}
              
            />
            <Icon
              name="person"
              size={24}
              color="#666"
              style={styles.inputIcon}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.inputWithIconPass]}
              placeholder="كلمة المرور"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Icon
              name="lock-closed"
              size={24}
              color="#666"
              style={styles.inputIcon}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    position: "relative",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    fontFamily: "Tajawal",
    textAlign: "right",
  },
  inputWithIconUser: {
    paddingRight: 50,
  },
  inputWithIconPass: {
    paddingRight: 50,
    paddingLeft:50,
  },
  inputIcon: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  eyeIcon: {
    position: "absolute",
    left: 15,
    top: 15,
  },
  loginButton: {
    backgroundColor: "#0066b3",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Tajawal",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
