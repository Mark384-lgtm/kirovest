import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ROLE_KEY, TOKEN_KEY, getStoredToken } from "../services/ApiService";

type AuthContextType = {
  isLoggedIn: boolean;
  userRole: string | null;
  login: (role: string, token: string) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Starting auth initialization...");

        // Get stored role first
        const storedRole = await AsyncStorage.getItem(ROLE_KEY);
        console.log("Stored role:", storedRole ? "exists" : "null");

        // Then get stored token
        const storedToken = await getStoredToken();
        console.log("Stored token:", storedToken ? "exists" : "null");

        if (storedRole && storedToken) {
          console.log("Both role and token exist, setting logged in state");
          setUserRole(storedRole);
          setIsLoggedIn(true);
        } else {
          console.log("Missing role or token, clearing auth data");
          await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
          setUserRole(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error checking stored auth data:", error);
        // Clear auth data on error
        try {
          await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
        } catch (clearError) {
          console.error("Error clearing auth data:", clearError);
        }
        setUserRole(null);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (role: string, token: string) => {
    try {
      console.log("Login attempt with:", { role, hasToken: !!token });

      if (!role || !token) {
        throw new Error("Invalid role or token provided");
      }

      // Store both values atomically
      await AsyncStorage.multiSet([
        [TOKEN_KEY, token],
        [ROLE_KEY, role],
      ]);

      console.log("Successfully stored auth data");
      setIsLoggedIn(true);
      setUserRole(role);
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
      console.log("Successfully cleared auth data");
      setIsLoggedIn(false);
      setUserRole(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, userRole, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
