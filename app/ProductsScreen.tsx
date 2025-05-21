import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import * as Linking from "expo-linking";
import ApiService, { getStoredToken } from "../services/ApiService";
import Toast from "react-native-toast-message";

// Helper function to remove HTML tags from content
const stripHtmlTags = (html: string | null | undefined) => {
  if (!html) return ""; // Return an empty string if input is null or undefined
  return html.replace(/<[^>]*>/g, "").trim();
};


export default function ProductsScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<
    { id: number; name: string; description: string; price: string; image?: string }[]
  >([]);

  useEffect(() => {
    navigation.setOptions({
      title: "المنتجات",
      headerTitleAlign: "right",
      headerStyle: {
        backgroundColor: "#0066b3",
        writingDirection: "rtl",
      },
      headerTitleStyle: {
        fontFamily: "Tajawal",
        fontSize: 20,
        color: "#fff",
        writingDirection: "rtl",
      },
      headerTintColor: "#fff",
    });

    fetchProducts();
  }, [navigation]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch("https://kirovest.com/api/services", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();
      if (json.success && json.data.length > 0) {
        setProducts(
          json.data.map((item) => ({
            id: item.id,
            name: item.title,
            description: stripHtmlTags(item.content),
            price: `${item.price.amount} جنيه`,
            image: item.image,
          }))
        );
      } else {
        throw new Error("No products found");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "فشل في جلب المنتجات",
      });
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0066b3" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#aaa" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث عن منتج..."
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Render Product List */}
          <View style={styles.productsGrid}>
            {products.filter((product) => product.name.includes(searchQuery)).length > 0 ? (
              products
                .filter((product) => product.name.includes(searchQuery))
                .map((item) => (
                  <View key={item.id} style={styles.productCard}>
                    <View style={styles.productInfo}>
                      {/* Product Name */}
                      <Text style={styles.productName}>{item.name}</Text>

                      {/* Product Description */}
                      <Text style={styles.productDescription}>{item.description}</Text>

                      {/* Product Price */}
                      <Text style={styles.productPrice}>{item.price}</Text>

                      {/* Show Image if exists */}
                      {item.image && (
                        <TouchableOpacity onPress={() => Linking.openURL(item.image)} style={styles.imageButton}>
                          <Icon name="image-outline" size={24} color="#fff" />
                          <Text style={styles.imageText}>عرض الصورة</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>لا يوجد منتجات</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Tajawal",
    fontSize: 16,
    textAlign: "right",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%", // Two-column grid
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  productInfo: {
    alignItems: "center",
  },
  productName: {
    fontSize: 16,
    fontFamily: "Tajawal",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 13,
    fontFamily: "Tajawal",
    color: "#666",
    textAlign: "center",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: "Tajawal",
    color: "#0066b3",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 10,
  },
  imageButton: {
    backgroundColor: "#0288D1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 6,
    width: "100%",
  },
  imageText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 5,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Tajawal",
    color: "#666",
  },
});
