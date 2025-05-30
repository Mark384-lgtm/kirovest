import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import ApiService, { getStoredToken } from "../../services/ApiService";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [user, setUser] = useState({ name: "", image: null });
  const [loading, setLoading] = useState(true);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getStoredToken();
        if (!token) {
          console.log("No token found, redirecting to login");
          router.replace("/login");
          return;
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.replace("/login");
        return;
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await ApiService.getInstance().getUserData();
        console.log(
          "Fetched user data in HomeScreen:",
          JSON.stringify(data, null, 2)
        );

        // Check if we have valid user data
        if (data.data) {
          const userData = data.data;
          console.log("User data fields:", {
            name: userData.name,
            email: userData.email,
            type: userData.type,
            user_image: userData.user_image,
          });

          // Handle different user data structures
          const userName = userData.name || "مستخدم";
          const userImage = userData.user_image?.url || null;

          setUser({
            name: userName,
            image: userImage,
          });
        } else {
          console.log("No user data found");
          router.replace("/login");
        }
      } catch (err) {
        console.error("Error fetching user data in HomeScreen:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    const fetchPendingOrdersCount = async () => {
      try {
        const token = await getStoredToken();
        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await fetch(
          "https://kirovest.org/api/orders?status=pending",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (data.success) {
          setPendingOrdersCount(data.data.length);
        }
      } catch (error) {
        console.error("Error fetching pending orders count:", error);
        router.replace("/login");
      }
    };

    fetchUserData();
    fetchPendingOrdersCount();
    navigation.setOptions({
      title: "الرئيسية",
      headerTitleAlign: "center",
      headerStyle: {
        backgroundColor: "#f0f4f7",
        writingDirection: "rtl",
      },
      headerTitleStyle: {
        fontFamily: "Tajawal",
        fontSize: 20,
        writingDirection: "rtl",
      },
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Header Section (Without Gradient) */}
      <View style={styles.header}>
        {loading ? (
          <ActivityIndicator size="large" color="#0066b3" />
        ) : (
          <View style={styles.userInfo}>
            <Image
              source={
                user.image
                  ? { uri: user.image }
                  : require("../../assets/images/default-avatar.png") // Placeholder image
              }
              style={styles.userImage}
            />
            <View style={styles.userDetails}>
              <Text style={styles.welcomeText}>مرحباً,</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Main Menu */}
      <View style={styles.gridContainer}>
        {/* Orders Button */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('OrdersScreen')}
        >
          <View style={styles.iconContainer}>
            <Icon name="cart-outline" size={50} color="#0066b3" />
            {pendingOrdersCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingOrdersCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuText}>الطلبيات</Text>
        </TouchableOpacity>

        {/* Clients Button */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("ClientsScreen")}
        >
          <View style={styles.iconContainer}>
            <Icon name="people-outline" size={50} color="#0066b3" />
          </View>
          <Text style={styles.menuText}>العملاء</Text>
        </TouchableOpacity>

        {/* Routes Button */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("RoutesScreen")}
        >
          <View style={styles.iconContainer}>
            <Icon name="map-outline" size={50} color="#0066b3" />
          </View>
          <Text style={styles.menuText}>خطوط السير</Text>
        </TouchableOpacity>

        {/* Products Button */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("ProductsScreen")}
        >
          <View style={styles.iconContainer}>
            <Icon name="pricetags-outline" size={50} color="#0066b3" />
          </View>
          <Text style={styles.menuText}>المنتجات</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.DesignedbyText}> Designed by YWay.co.uk</Text>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  header: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 20,
  },

  userInfo: {
    flexDirection: "row", // Ensures image is on the right, text on the left
    alignItems: "center",
    justifyContent: "flex-start", // Align content to the right side
    width: "90%",
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2, // Light shadow for a modern look
    paddingHorizontal: 5,
    direction: "rtl",
    gap: 10,
  },

  userImage: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#e0e0e0",
    borderWidth: 2,
    borderColor: "#0066b3", // Adds a modern touch
    marginRight: 15, // Creates spacing between text and image
  },

  userDetails: {
    flex: 1, // Allows text to take the remaining space
    alignItems: "flex-start", // Align text to the right for RTL
    justifyContent: "center",
  },

  welcomeText: {
    fontSize: 16,
    fontFamily: "Tajawal",
    color: "#666",
  },

  userName: {
    fontSize: 20,
    fontFamily: "Tajawal",
    fontWeight: "bold",
    color: "#333",
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 20,
  },
  menuItem: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: 25,
    borderRadius: 20,
    width: 130,
    height: 130,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    backgroundColor: "#e3efff",
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    position: "relative",
  },
  menuText: {
    fontSize: 18,
    fontFamily: "Tajawal",
    color: "#333",
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Tajawal",
    fontWeight: "bold",
  },
  DesignedbyText: {
    position: "absolute",
    alignSelf: "center",
    bottom: 150,
    color: "#D3D3D3",
    fontFamily: "Tajawal"

  }
});
