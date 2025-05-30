import "react-native-get-random-values";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/types/navigation";
import React, { useEffect, useState, useRef } from "react";
import { DateTime } from 'luxon';
import { useAuth } from "@/hooks/useAuth"; // adjust path if needed
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  Dimensions,
  FlatList,
  PermissionsAndroid,
  SafeAreaView,
  Alert,
  Linking,
  KeyboardAvoidingView
} from "react-native";
import {
  useNavigation,
  NavigationProp,
  ParamListBase,
} from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";

import { Picker } from "@react-native-picker/picker";
// Import MapView components conditionally to prevent crashes
let MapView: any = null;
let Marker: any = null;
try {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (error) {
  console.error("Error importing react-native-maps:", error);
}
import ApiService, { getStoredToken } from "../../services/ApiService";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

// Add this at the top level to track errors
let hasMapCrashed = false;

// Add this at the top level near other constants
const GOOGLE_MAPS_API_KEY = "AIzaSyBcGudi_xmRLxHVNnCOffJjVXPaDgdIchI";

// Add these type definitions near the top of the file, after imports
interface Product {
  id?: number;
  name: string;
  quantity: string;
  price: string;
  notes: string;
  value?: number;
}

interface Client {
  id: number;
  name: string;
}

interface AdditionalFields {
  paymentMethod: string;
  violations: boolean;
  underCollection: string;
  installmentLimit: string;
  monthlyInstallment: string;
  cashDiscount: boolean;
  salesDiscount: boolean;
  returns?: string;
  returnsValue?: string;
  creditLimit?: string;
  available?: string;
  monthlyCash?: string;
  monthlyCredit?: string;
  salePermission?: string;
}

export default function AddScreen({ route, navigation }) {
  const [step, setStep] = useState(1);
  const [client, setClient] = useState<number | string>("");
  const [clients, setClients] = useState<Client[]>([]);
  const { userRole } = useAuth();
  const [region, setRegion] = useState("");


  const [product, setProduct] = useState<Product>({
    name: "",
    quantity: "",
    price: "",
    notes: "",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [additionalFields, setAdditionalFields] = useState<AdditionalFields>({
    paymentMethod: "",
    violations: false,
    underCollection: "",
    installmentLimit: "",
    monthlyInstallment: "",
    cashDiscount: false,
    salesDiscount: false,
  });
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 30.033333,
    longitude: 31.233334,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  //const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const mapViewRef = useRef(null);
  const regionChangeTimeoutRef = useRef(null);
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);
  // New state variables for manual location entry
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [isMapAvailable, setIsMapAvailable] = useState(!!MapView);

  useEffect(() => {
    navigation.setOptions({
      title: "نموذج طلب بضاعة",
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

    // Check if map is available at initialization
    try {
      if (!MapView) {
        console.log("MapView is not available, switching to manual entry");
        setIsMapAvailable(false);
        setUseManualLocation(true);
      } else {
        console.log("MapView is available");
        setIsMapAvailable(true);
      }
    } catch (error) {
      console.error("Error checking map availability:", error);
      setIsMapAvailable(false);
      setUseManualLocation(true);
    }

    fetchClients();
    fetchProducts();

    // Request location permission when component mounts
    requestLocationPermission();

    // Cleanup function
    return () => {
      if (regionChangeTimeoutRef.current) {
        clearTimeout(regionChangeTimeoutRef.current);
      }
    };
  }, [navigation]);

  const fetchClients = async () => {
    try {
      const token = await getStoredToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch("https://kirovest.org/api/clients", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();
      if (json.success && json.data.length > 0) {
        setClients(
          json.data.map((client) => ({
            id: client.id,
            name: client.name,
          }))
        );
      } else {
        throw new Error("No clients found");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "فشل في جلب العملاء",
      });
      console.error("Error fetching clients:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = await getStoredToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch("https://kirovest.org/api/services", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();
      if (json.success && json.data.length > 0) {
        setAllProducts(
          json.data.map((product) => ({
            id: product.id,
            name: product.title,
            price: product.price.amount, // Extracting price
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
    }
  };
  const handleNext = () => {
    if (step === 1 && (!client || !region)) {
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "يرجى ملء جميع الحقول الإلزامية",
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step > 1 ? step - 1 : 1);
  };

  const handleProductSelect = (productId: string) => {
    const selectedProduct = allProducts.find(
      (p) => p.id === parseInt(productId)
    );
    if (selectedProduct) {
      setProduct({
        ...product,
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price.toString(),
        quantity: "",
      });
    }
  };

  const handleQuantityChange = (text: string) => {
    const quantity = text.replace(/[^0-9]/g, "");
    setProduct({ ...product, quantity });
  };

  const handleAddProduct = () => {
    if (!product.name || !product.quantity || !product.price) {
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "يرجى ملء جميع الحقول المطلوبة للصنف",
      });
      return;
    }

    const value = parseFloat(product.quantity) * parseFloat(product.price);
    setProducts([...products, { ...product, value }]);
    setTotalValue((prev) => prev + value);

    setProduct({ name: "", quantity: "", price: "", notes: "" });
    Toast.show({
      type: "success",
      text1: "تم الإضافة",
      text2: "تم إضافة الصنف بنجاح",
    });
  };

  const handleDeleteProduct = (index: number) => {
    const updatedProducts = [...products];
    const removedProduct = updatedProducts.splice(index, 1)[0];
    setProducts(updatedProducts);
    setTotalValue((prev) => prev - (removedProduct.value || 0));

    Toast.show({
      type: "info",
      text1: "تم الحذف",
      text2: "تم حذف الصنف بنجاح",
    });
  };



  const handleSubmit = async () => {
    try {
      if (!client || !region || products.length === 0) {
        Toast.show({
          type: "error",
          text1: "خطأ",
          text2: "يرجى ملء جميع الحقول المطلوبة",
        });
        return;
      }

      const token = await getStoredToken();
      if (!token) throw new Error("User not authenticated");

      console.log("🔑 Using Token:", token); // Check if the token is correct

      console.log("products here : ", products);
      const requestData = {
        client_id: client,
        location: region,
        location_coordinates: selectedCoordinates
          ? {
            latitude: selectedCoordinates.latitude,
            longitude: selectedCoordinates.longitude,
          }
          : null,
          
       appointment: DateTime.utc().setZone("Africa/Cairo"),
        services: products.map((item) => {
          console.log('Screen','AddScreen');
          console.log('OrderPrice:', item.price); 
          console.log('quantity', item.quantity);
          console.log('total', item.value);
          return {
            service_id: item.id,
            price: item.price,
            quantity: parseInt(item.quantity),
            
          };
        }),
        grand_total: totalValue,
        payment_method:
          additionalFields.paymentMethod === "نقدي" ? "cash" : "deferred",
        refund: additionalFields.returns === "يوجد" ? "yes" : "no",
        refund_amount:
          additionalFields.returns === "يوجد"
            ? parseFloat(additionalFields.returnsValue || "0")
            : 0,
        sales_permit: additionalFields.salePermission === "يصرح" ? "yes" : "no",
      };

    
      console.log("💵 Grand Total:", requestData.grand_total);
      console.log("📤 Sending Request:", JSON.stringify(requestData));

      const response = await fetch("https://kirovest.org/api/orders/make", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const responseText = await response.text();
      console.log("🔄 Raw API Response:", responseText); // Log raw response to detect issues

      const json = JSON.parse(responseText);

      if (json.success) {
        Toast.show({
          type: "success",
          text1: "تم تقديم الطلب بنجاح",
          text2: `رقم الطلب: ${json.data.order_number}`,
        });

        setTimeout(() => {
          navigation.navigate(
            "OrderDetailsScreen" as never,
            {
              orderId: json.data.id,
            } as never
          );
        }, 2000);
      } else {
        let errorMessage = json.message || "حدث خطأ غير متوقع";
        if (json.data) {
          const errors = Object.values(json.data).flat().join("\n");
          errorMessage += `\n${errors}`;
        }

        Toast.show({
          type: "error",
          text1: "خطأ في البيانات",
          text2: errorMessage,
        });
      }
    } catch (error) {
      console.error("🚨 Error submitting order:", error);
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "حدث خطأ أثناء إرسال الطلب",
      });
    }
  };
  

  const PreviewRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | undefined;
  }) => (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}:</Text>
      <Text style={styles.previewValue}>{value || "---"}</Text>
    </View>
  );

  const OrderPreview = ({
    client,
    region,

    products,
    totalValue,
    additionalFields,
  }: {
    client: string | number;
    region: string;

    products: Product[];
    totalValue: number;
    additionalFields: AdditionalFields;
  }) => (
    <View style={styles.previewContainer}>
      <Text style={styles.previewTitle}>معاينة الطلبية</Text>

      <View style={styles.previewSection}>
        <Text style={styles.sectionHeader}>معلومات العميل</Text>
        <PreviewRow label="اسم العميل" value={client} />
        <PreviewRow label="المنطقة" value={region} />

      </View>

      <View style={styles.previewSection}>
        <Text style={styles.sectionHeader}>المنتجات</Text>
        {products.map((item, index) => (
          <View key={index} style={styles.previewItem}>
            <PreviewRow label="اسم المنتج" value={item.name} />
            <PreviewRow label="الكمية" value={item.quantity} />
            <PreviewRow label="السعر" value={`${item.price} جنيه`} />
            <PreviewRow
              label="القيمة"
              value={`${(item.value || 0).toFixed(2)} جنيه`}
            />
          </View>
        ))}
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.sectionHeader}>معلومات الدفع</Text>
        <PreviewRow
          label="طريقة الدفع"
          value={additionalFields.paymentMethod}
        />
        <PreviewRow
          label="الحد الائتماني"
          value={additionalFields.creditLimit}
        />
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>
          الإجمالي النهائي: {totalValue.toFixed(2)} جنيه
        </Text>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => {
          Toast.show({
            type: "success",
            text1: "تم التأكيد",
            text2: "تم تأكيد الطلبية بنجاح!",
          });
          setTimeout(() => navigation.navigate("Home" as never), 1500);
        }}
      >
        <Text style={styles.confirmButtonText}>تأكيد الطلبية</Text>
      </TouchableOpacity>
    </View>
  );

  const handleOpenMap = async () => {
    try {
      // Check if map is available first
      if (!isMapAvailable) {
        Toast.show({
          type: "info",
          text1: "الخريطة غير متوفرة",
          text2: "يرجى إدخال الموقع يدويًا",
        });
        setUseManualLocation(true);
        return;
      }

      // Check if location permission is granted
      if (!locationPermissionGranted) {
        const granted = await requestLocationPermission();
        if (!granted) {
          Toast.show({
            type: "error",
            text1: "خطأ",
            text2: "يرجى السماح بالوصول إلى الموقع لاستخدام الخريطة",
          });
          setUseManualLocation(true);
          return;
        }
      }

      // Log the current state before opening the map
      console.log("Opening map with region:", mapRegion);

      // Open the map
      try {
        setIsMapVisible(true);
      } catch (error) {
        console.error("Error opening map:", error);
        Toast.show({
          type: "error",
          text1: "خطأ",
          text2: "حدث خطأ أثناء فتح الخريطة",
        });
        setUseManualLocation(true);
      }
    } catch (error) {
      console.error("Error in handleOpenMap:", error);
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "حدث خطأ أثناء فتح الخريطة",
      });
      setUseManualLocation(true);
    }
  };

  const handleMapPress = async (event: any) => {
    try {
      const { coordinate } = event.nativeEvent;
      setSelectedLocation(coordinate);
      setSelectedCoordinates(coordinate);

      // Use reverse geocoding to get the address
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.results && data.results[0]) {
          setSelectedAddress(data.results[0].formatted_address);
          setRegion(data.results[0].formatted_address);
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        setRegion(
          `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(
            6
          )}`
        );
      }

      // Use a short timeout before closing the modal to prevent UI jank
      setTimeout(() => {
        try {
          setIsMapVisible(false);
        } catch (e) {
          console.error("Error closing map modal:", e);
        }
      }, 300);
    } catch (error) {
      console.error("Error handling map press:", error);
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "حدث خطأ أثناء تحديد الموقع",
      });

      // Close the map on error and encourage manual entry
      setIsMapVisible(false);
      setUseManualLocation(true);
    }
  };

  const renderRegionField = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>المنطقة</Text>
      {useManualLocation ? (
        // Manual location entry
        <View>
          <TextInput
            style={styles.input}
            value={region}
            onChangeText={handleManualRegionInput}
            placeholder="أدخل وصف المنطقة"
            placeholderTextColor="#aaa"
            multiline={true}
            numberOfLines={2}
          />
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.manualCoordinatesButton}
              onPress={handleManualCoordinatesInput}
            >
              <Text style={styles.manualCoordinatesButtonText}>
                إدخال الإحداثيات
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.switchToMapButton}
            onPress={() => {
              if (isMapAvailable) {
                setUseManualLocation(false);
              } else {
                Toast.show({
                  type: "info",
                  text1: "الخريطة غير متوفرة",
                  text2: "يرجى الاستمرار في إدخال الموقع يدويًا",
                });
              }
            }}
          >
            <Text style={styles.switchToMapButtonText}>
              {isMapAvailable ? "استخدام الخريطة" : "الخريطة غير متوفرة"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Map selection
        <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap}>
          <Text style={styles.mapButtonText}>
            {region || "اختر المنطقة على الخريطة"}
          </Text>
          <Icon name="map" size={20} color="#0066b3" />
        </TouchableOpacity>
      )}
    </View>
  );

  const handleRegionChange = (newRegion: any) => {
    // Debounce region changes to prevent excessive updates
    if (regionChangeTimeoutRef.current) {
      clearTimeout(regionChangeTimeoutRef.current);
    }

    regionChangeTimeoutRef.current = setTimeout(() => {
      setMapRegion(newRegion);
    }, 300) as any; // Cast to any to avoid TypeScript error
  };

  // Create a simplified map component with better error handling
  const SimpleMapComponent = () => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Add a timeout to detect if map doesn't load
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.log("Map loading timeout");
          setHasError(true);
          setIsLoading(false);
        }
      }, 5000); // 5 seconds timeout (reduced from 10)

      return () => {
        clearTimeout(timeoutId);
      };
    }, [isLoading]);

    // Check if MapView is available
    if (!MapView || !Marker) {
      return (
        <View style={[styles.map, styles.mapErrorContainer]}>
          <Text style={styles.mapErrorText}>خريطة غير متوفرة</Text>
          <Text style={styles.mapHelperText}>يرجى إدخال الموقع يدويًا</Text>
          <TouchableOpacity
            style={styles.mapErrorButton}
            onPress={() => {
              setIsMapVisible(false);
              setUseManualLocation(true);
            }}
          >
            <Text style={styles.mapErrorButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Handle rendering error state
    if (hasError) {
      return (
        <View style={[styles.map, styles.mapErrorContainer]}>
          <Text style={styles.mapErrorText}>خطأ في تحميل الخريطة</Text>
          <Text style={styles.mapHelperText}>
            يمكنك إدخال الموقع يدويًا بدلاً من ذلك
          </Text>
          <TouchableOpacity
            style={styles.mapErrorButton}
            onPress={() => {
              setIsMapVisible(false);
              setUseManualLocation(true);
            }}
          >
            <Text style={styles.mapErrorButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Wrap MapView in a try-catch block
    try {
      return (
        <View style={styles.map}>
          <MapView
            ref={mapViewRef}
            style={styles.map}
            initialRegion={mapRegion}
            onPress={(event) => {
              try {
                handleMapPress(event);
              } catch (e) {
                console.error("Error handling map press:", e);
                setHasError(true);
              }
            }}
            showsUserLocation={locationPermissionGranted}
            showsMyLocationButton={locationPermissionGranted}
            showsCompass={false}
            showsScale={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
            provider="google"
            loadingEnabled={true}
            loadingIndicatorColor="#0066b3"
            loadingBackgroundColor="#ffffff"
            onRegionChangeComplete={(newRegion) => {
              try {
                // Debounce region changes to prevent excessive updates
                if (regionChangeTimeoutRef.current) {
                  clearTimeout(regionChangeTimeoutRef.current);
                }

                regionChangeTimeoutRef.current = setTimeout(() => {
                  setMapRegion(newRegion);
                }, 300) as any;
              } catch (e) {
                console.error("Error handling region change:", e);
              }
            }}
            onMapReady={() => {
              console.log("Map ready");
              setIsLoading(false);
            }}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="الموقع المحدد"
                description={selectedAddress}
                pinColor="#0066b3"
                draggable={true}
                onDragEnd={(e) => {
                  try {
                    const newLocation = e.nativeEvent.coordinate;
                    setSelectedLocation(newLocation);
                    setSelectedCoordinates(newLocation);

                    // Update address for new location
                    getAddressFromCoordinates(newLocation);
                  } catch (error) {
                    console.error("Error during marker drag:", error);
                  }
                }}
              />
            )}
          </MapView>
        </View>
      );
    } catch (error) {
      console.error("Error rendering MapView:", error);
      setHasError(true);
      return (
        <View style={[styles.map, styles.mapErrorContainer]}>
          <Text style={styles.mapErrorText}>خطأ في تحميل الخريطة</Text>
          <TouchableOpacity
            style={styles.mapErrorButton}
            onPress={() => {
              setIsMapVisible(false);
              setUseManualLocation(true);
            }}
          >
            <Text style={styles.mapErrorButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Add this helper function for getting address from coordinates
  const getAddressFromCoordinates = async (coordinates: {
    latitude: number;
    longitude: number;
  }) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        setSelectedAddress(data.results[0].formatted_address);
        setRegion(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setRegion(
        `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(
          6
        )}`
      );
    }
  };

  // Update the renderMapModal function to use a safer approach
  const renderMapModal = () => {
    if (!isMapVisible) return null;

    return (
      <Modal
        visible={isMapVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          try {
            setIsMapVisible(false);
            setSearchQuery("");
          } catch (e) {
            console.error("Error closing map modal:", e);
          }
        }}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.mapContainer}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapTitle}>اختر الموقع</Text>
              <TouchableOpacity
                style={styles.closeMapButton}
                onPress={() => {
                  try {
                    setIsMapVisible(false);
                    setSearchQuery("");
                  } catch (e) {
                    console.error("Error closing map modal:", e);
                  }
                }}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <GooglePlacesAutocomplete
                placeholder="ابحث عن منطقة..."
                onPress={(data, details = null) => {
                  if (details) {
                    try {
                      const location = {
                        latitude: details.geometry.location.lat,
                        longitude: details.geometry.location.lng,
                      };

                      setSelectedLocation(location);
                      setSelectedCoordinates(location);
                      setSelectedAddress(data.description);
                      setRegion(data.description);
                      setSearchQuery(data.description);

                      // Close modal after a short delay
                      setTimeout(() => {
                        try {
                          setIsMapVisible(false);
                        } catch (e) {
                          console.error("Error closing map modal:", e);
                        }
                      }, 300);
                    } catch (error) {
                      console.error("Error selecting location:", error);
                      Toast.show({
                        type: "error",
                        text1: "خطأ",
                        text2: "حدث خطأ أثناء تحديد الموقع",
                      });

                      // Close on error
                      setIsMapVisible(false);
                      setUseManualLocation(true);
                    }
                  }
                }}
                query={{
                  key: GOOGLE_MAPS_API_KEY,
                  language: "ar",
                  components: "country:eg",
                  types: "address",
                }}
                fetchDetails={true}
                onFail={(error) => {
                  console.error("Places API Error:", error);
                  Toast.show({
                    type: "error",
                    text1: "خطأ",
                    text2: "فشل في البحث عن الموقع",
                  });
                }}
                onNotFound={() => {
                  Toast.show({
                    type: "info",
                    text1: "تنبيه",
                    text2: "لم يتم العثور على نتائج",
                  });
                }}
                textInputProps={{
                  style: styles.searchInput,
                  placeholderTextColor: "#666",
                  value: searchQuery,
                  onChangeText: (text) => setSearchQuery(text),
                  autoFocus: false,
                  blurOnSubmit: true,
                }}
                listViewDisplayed={true}
                keyboardShouldPersistTaps="handled"
                styles={{
                  container: styles.searchResultsContainer,
                  row: styles.searchResultRow,
                  description: styles.searchResultDescription,
                  listView: styles.searchListView,
                  separator: styles.searchSeparator,
                  powered: { display: "none" },
                  textInputContainer: styles.searchInputContainer,
                }}
                enablePoweredByContainer={false}
                minLength={2}
                debounce={500}
                nearbyPlacesAPI="GooglePlacesSearch"
              />
            </View>

            <SimpleMapComponent />

            <View style={styles.mapFooter}>
              <TouchableOpacity
                style={styles.confirmLocationButton}
                onPress={() => {
                  try {
                    setIsMapVisible(false);
                  } catch (e) {
                    console.error("Error closing map modal:", e);
                  }
                }}
              >
                <Icon name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.confirmLocationButtonText}>
                  تأكيد الموقع
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manualEntryButton}
                onPress={() => {
                  try {
                    setIsMapVisible(false);
                    setUseManualLocation(true);
                  } catch (e) {
                    console.error("Error switching to manual entry:", e);
                  }
                }}
              >
                <Icon name="create-outline" size={20} color="#fff" />
                <Text style={styles.manualEntryButtonText}>
                  إدخال العنوان يدويًا
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "السماح بالوصول إلى الموقع",
            message: "يحتاج التطبيق إلى الوصول إلى موقعك لإظهاره على الخريطة",
            buttonNeutral: "اسألني لاحقًا",
            buttonNegative: "إلغاء",
            buttonPositive: "موافق",
          }
        );

        const permissionGranted =
          granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log("Location permission granted:", permissionGranted);
        setLocationPermissionGranted(permissionGranted);
        return permissionGranted;
      } else if (Platform.OS === "ios") {
        // For iOS, you would typically use Geolocation.requestAuthorization()
        console.log("iOS location permission granted");
        setLocationPermissionGranted(true);
        return true;
      }


      // Default case for other platforms
      setLocationPermissionGranted(true);
      return true;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      setLocationPermissionGranted(false);
      return false;
    }
  };

  const handlePriceUpdate = (newPrice) => {
    console.log("السعر الجديد:", newPrice);
    setProduct((prev) => ({
      ...prev,
      price: newPrice.toString(),
    }));
  };
  // Handle region input manually
  const handleManualRegionInput = (text: string) => {
    setRegion(text);
    setUseManualLocation(true);
  };

  // Handle manual coordinates input
  const handleManualCoordinatesInput = () => {
    Alert.prompt(
      "إدخال الإحداثيات",
      "أدخل خط العرض وخط الطول مفصولين بفاصلة (مثال: 30.033333, 31.233334)",
      [
        {
          text: "إلغاء",
          style: "cancel",
        },
        {
          text: "تأكيد",
          onPress: (text?: string) => {
            if (text) {
              const [latStr, lngStr] = text.split(",");
              const lat = parseFloat(latStr.trim());
              const lng = parseFloat(lngStr.trim());

              if (!isNaN(lat) && !isNaN(lng)) {
                const coordinates = { latitude: lat, longitude: lng };
                setSelectedCoordinates(coordinates);
                setSelectedLocation(coordinates);
                getAddressFromCoordinates(coordinates);
              } else {
                Toast.show({
                  type: "error",
                  text1: "خطأ",
                  text2: "الإحداثيات غير صالحة. يرجى إدخال أرقام صحيحة.",
                });
              }
            }
          },
        },
      ],
      "plain-text"
    );
  };

  function handlePriceChange(text: string): void {
    product.price = text
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      removeClippedSubviews={Platform.OS === "android"}
    >
      {step === 1 && (
        <>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>اسم العميل</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={client}
                onValueChange={(itemValue) => setClient(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="اختر العميل" value="" />
                {clients.slice(0, 50).map((item) => (
                  <Picker.Item
                    key={item.id}
                    label={item.name}
                    value={item.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {renderRegionField()}

          <Text style={styles.DesignedbyText}>Designed by YWay.co.uk</Text>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.sectionTitle}>تفاصيل المنتجات</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>اختر المنتج</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={product.name}
                onValueChange={handleProductSelect}
                style={styles.picker}
              >
                <Picker.Item label="اختر منتج من القائمة" value="" />
                {allProducts.slice(0, 50).map((product) => (
                  <Picker.Item
                    key={product.id}
                    label={product.name}
                    value={product.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          //const navigation = useNavigation();

          return (
          <>
            {product.name && (
              <>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>سعر المنتج الاصلي  </Text>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={product.price}
                    editable={false}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>تعديل سعر المنتج في الطلبية  (اختياري) </Text>

                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"

                    onChangeText={handlePriceChange}
                    placeholder="ادخال السعر الجديد"
                    placeholderTextColor="#aaa"
                  />

                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>ادخال الكمية  (اجباري)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={product.quantity}
                    onChangeText={handleQuantityChange}
                    placeholder="ادخل الكمية"
                    placeholderTextColor="#aaa"
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>الملاحظات (اختياري)</Text>
                  <TextInput
                    style={styles.input}
                    value={product.notes}
                    onChangeText={(text) => setProduct({ ...product, notes: text })}
                    placeholder="ادخل الملاحظات"
                    placeholderTextColor="#aaa"
                  />
                </View>
              </>
            )}
          </>
          );



          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddProduct}
            disabled={!product.name || !product.quantity}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>إضافة صنف</Text>
          </TouchableOpacity>

          {products.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>الأصناف</Text>
              {products.slice(0, 20).map((item, index) => (
                <View key={index} style={styles.productRow}>
                  <Text style={styles.productText}>اسم الصنف: {item.name}</Text>
                  <Text style={styles.productText}>
                    الكمية: {item.quantity}
                  </Text>
                  <Text style={styles.productText}>
                    السعر: {item.price} جنيه
                  </Text>
                  <Text style={styles.productText}>
                    القيمة: {(item.value || 0).toFixed(2)} جنيه
                  </Text>
                  {item.notes && (
                    <Text style={styles.productText}>
                      الملاحظات: {item.notes}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteProduct(index)}
                  >
                    <Icon name="trash" size={20} color="#fff" />
                    <Text style={styles.deleteButtonText}>حذف</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {products.length > 20 && (
                <Text style={styles.moreProductsText}>
                  ... و {products.length - 20} عناصر أخرى
                </Text>
              )}
            </>
          )}

          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>
              إجمالي قيمة الطلبية: {totalValue.toFixed(2)} جنيه
            </Text>
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.sectionHeader}>معلومات السداد</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>طريقة السداد</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={additionalFields.paymentMethod}
                onValueChange={(value) =>
                  setAdditionalFields({
                    ...additionalFields,
                    paymentMethod: value,
                  })
                }
                style={styles.picker}
              >
                <Picker.Item label="نقدي" value="نقدي" />
                <Picker.Item label="آجل" value="آجل" />
              </Picker>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>المرتدات</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={additionalFields.returns}
                onValueChange={(value) => {
                  setAdditionalFields({
                    ...additionalFields,
                    returns: value,
                  });
                }}
                style={styles.picker}
              >
                <Picker.Item label="لا يوجد" value="لا يوجد" />
                <Picker.Item label="يوجد" value="يوجد" />
              </Picker>
            </View>
          </View>

          {additionalFields.returns === "يوجد" && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>القيمة</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={additionalFields.returnsValue}
                onChangeText={(text) =>
                  setAdditionalFields({
                    ...additionalFields,
                    returnsValue: text,
                  })
                }
                placeholder="ادخل القيمة"
                placeholderTextColor="#aaa"
              />
            </View>
          )}

          <Text style={styles.sectionHeader}>معلومات الائتمان والتحصيل</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>الحد الائتماني للعميل</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={additionalFields.creditLimit}
              onChangeText={(text) =>
                setAdditionalFields({
                  ...additionalFields,
                  creditLimit: text,
                })
              }
              placeholder="ادخل الحد الائتماني"
              placeholderTextColor="#aaa"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>تحت التحصيل</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={additionalFields.underCollection}
              onChangeText={(text) =>
                setAdditionalFields({
                  ...additionalFields,
                  underCollection: text,
                })
              }
              placeholder="ادخل القيمة تحت التحصيل"
              placeholderTextColor="#aaa"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>المتاح</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={additionalFields.available}
              onChangeText={(text) =>
                setAdditionalFields({
                  ...additionalFields,
                  available: text,
                })
              }
              placeholder="ادخل القيمة المتاحة"
              placeholderTextColor="#aaa"
            />
          </View>

          <Text style={styles.sectionHeader}>متوسط السداد الشهري</Text>

          <KeyboardAvoidingView>
            <ScrollView>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>نقدي</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={additionalFields.monthlyCash}
                  onChangeText={(text) =>
                    setAdditionalFields({
                      ...additionalFields,
                      monthlyCash: text,
                    })
                  }
                  placeholder="ادخل متوسط السداد نقدي"
                  placeholderTextColor="#aaa"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>آجل</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={additionalFields.monthlyCredit}
                  onChangeText={(text) =>
                    setAdditionalFields({
                      ...additionalFields,
                      monthlyCredit: text,
                    })
                  }
                  placeholder="ادخل متوسط السداد آجل"
                  placeholderTextColor="#aaa"
                />
              </View>

            </ScrollView>
          </KeyboardAvoidingView>

        </>


      )}

      {step === 4 && (
        <OrderPreview
          client={client}
          region={region}

          products={products}
          totalValue={totalValue}
          additionalFields={additionalFields}
        />
      )}

      {step < 4 && (
        <View style={styles.navigationButtons}>
          {step > 1 && (
            <TouchableOpacity style={styles.navButton} onPress={handleBack}>
              <Text style={styles.navButtonText}>السابق</Text>
            </TouchableOpacity>
          )}
          {step < 3 && (
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Text style={styles.navButtonText}>التالي</Text>
            </TouchableOpacity>
          )}
          {step === 3 && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Icon name="checkmark" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>إنشاء الطلبية</Text>
            </TouchableOpacity>
          )}

        </View>
      )}



      {isMapVisible && renderMapModal()}

      <Toast />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    padding: 20,
    direction: "rtl",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Tajawal-Medium",
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#333",
    textAlign: "right",
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 50,
    color: "#333",
  },

  sectionTitle: {
    fontSize: 20,
    fontFamily: "Tajawal-Bold",
    color: "#1a1a1a",
    marginVertical: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0066b3",
    paddingVertical: 14,
    borderRadius: 10,
    marginVertical: 20,
    elevation: 2,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Tajawal-Medium",
    marginLeft: 8,
  },
  productRow: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productText: {
    fontSize: 14,
    fontFamily: "Tajawal",
    color: "#444",
    marginBottom: 6,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc3545",
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Tajawal",
    marginLeft: 6,
  },
  totalContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
  },
  totalText: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#1a1a1a",
    textAlign: "center",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
    marginBottom: 120,
  },
  navButton: {

    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  navButtonText: {
    color: "#0066b3",
    fontSize: 16,
    fontFamily: "Tajawal-Medium",
    textAlign: "center",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#28a745",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 2,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Tajawal-Medium",
  },
  disabledInput: {
    backgroundColor: "#f8f9fa",
    color: "#666",
  },
  sectionHeader: {
    fontSize: 18,
    fontFamily: "Tajawal-Bold",
    color: "#1a1a1a",
    marginTop: 24,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  previewContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  previewTitle: {
    fontSize: 24,
    fontFamily: "Tajawal-Bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 30,
  },
  previewSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
  },
  previewItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: "Tajawal-Medium",
    color: "#666",
  },
  previewValue: {
    fontSize: 14,
    fontFamily: "Tajawal",
    color: "#333",
  },
  confirmButton: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
    elevation: 2,
    marginBottom: 120,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  mapButtonText: {
    fontSize: 16,
    fontFamily: "Tajawal",
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  mapContainer: {
    height: Dimensions.get("window").height * 0.8,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  mapTitle: {
    fontSize: 18,
    fontFamily: "Tajawal-Bold",
    color: "#333",
  },
  closeMapButton: {
    padding: 8,
  },
  searchContainer: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  searchResultsContainer: {
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
  },
  searchInputContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
  },
  searchInput: {
    height: 50,
    width: "100%",
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: "Tajawal",
    textAlign: "right",
    backgroundColor: "#fff",
  },
  searchListView: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchResultRow: {
    backgroundColor: "#fff",
    padding: 13,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  searchSeparator: {
    height: 1,
    backgroundColor: "#eee",
  },
  map: {
    flex: 1,
  },
  mapFooter: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 1,
    gap: 10,
  },
  confirmLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0066b3",
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmLocationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    marginLeft: 8,
  },
  moreProductsText: {
    textAlign: "center",
    color: "#666",
    fontFamily: "Tajawal",
    marginVertical: 10,
  },
  mapErrorContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  mapErrorText: {
    fontSize: 16,
    fontFamily: "Tajawal-Medium",
    color: "#dc3545",
    marginBottom: 16,
  },
  mapHelperText: {
    fontSize: 14,
    fontFamily: "Tajawal",
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  mapErrorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#0066b3",
    borderRadius: 8,
  },
  mapErrorButtonText: {
    color: "white",
    fontFamily: "Tajawal-Medium",
    fontSize: 14,
  },
  // New styles for manual location entry
  manualEntryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5c6bc0",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  manualEntryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Tajawal-Medium",
    marginLeft: 8,
  },
  switchToMapButton: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  switchToMapButtonText: {
    color: "#0066b3",
    fontSize: 14,
    fontFamily: "Tajawal-Medium",
  },
  manualCoordinatesButton: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#f0f4f7",
    borderRadius: 8,
  },
  manualCoordinatesButtonText: {
    color: "#0066b3",
    fontSize: 14,
    fontFamily: "Tajawal-Medium",
  },
  editableLook: {
    backgroundColor: '#e0f7fa',  // لون أزرق فاتح
    borderColor: '#00bcd4',      // سماوي غامق
    borderWidth: 1.5,
    borderRadius: 6,
    color: '#007c91',            // لون النص
    fontWeight: 'bold',
  },

  DesignedbyText: {
    position: "absolute",
    alignSelf: "center",
    bottom: 150,
    color: "#D3D3D3",
    fontFamily: "Tajawal"

  },

});
