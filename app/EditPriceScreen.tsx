import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";

export default function EditPriceScreen({ route }) {
  const { product, onSave } = route.params;
  const [price, setPrice] = useState(product.price.replace(" جنيه", ""));
  const navigation = useNavigation();

  const handleSave = () => {
    const newPrice = price.trim();

    if (!newPrice) {
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "من فضلك أدخل السعر",
      });
      return;
    }

    const numericPrice = parseFloat(newPrice);

    if (isNaN(numericPrice) || numericPrice <= 0) {
      Toast.show({
        type: "error",
        text1: "سعر غير صالح",
        text2: "من فضلك أدخل قيمة رقمية صحيحة أكبر من صفر",
      });
      return;
    }

    // Call the onSave callback and pass the numeric price
    onSave(numericPrice);

    // Go back to the previous screen
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>تعديل السعر</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        placeholder="أدخل السعر الجديد"
      />
      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>حفظ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#0066b3",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
