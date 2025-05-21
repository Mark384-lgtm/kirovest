import { Link, Stack } from "expo-router";
import { StyleSheet, View, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: "عذرًا!" }} />
            <ThemedView style={styles.container}>
                {/* Image/Icon */}
                <Image
                    source={require("../assets/images/not-found.png")} // Replace with your own not-found image
                    style={styles.image}
                />

                {/* Title */}
                <ThemedText type="title" style={styles.title}>
                    الصفحة غير موجودة
                </ThemedText>

                {/* Subtitle */}
                <ThemedText type="body" style={styles.subtitle}>
                    يبدو أنك وصلت إلى صفحة غير موجودة. يرجى العودة إلى الصفحة الرئيسية.
                </ThemedText>

                {/* Button to go back */}
                <Link href="/" style={styles.button}>
                    <ThemedText type="buttonText">العودة إلى الصفحة الرئيسية</ThemedText>
                </Link>
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#f9fafb", // Light background
        fontFamily: "Tajawal",
    },
    image: {
        width: 150,
        height: 150,
        marginBottom: 20,
        resizeMode: "contain",
    },
    title: {
        fontSize: 22,
        color: "#333",
        textAlign: "center",
        marginBottom: 10,
        fontFamily: "Tajawal",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 22,
        fontFamily: "Tajawal",
    },
    button: {
        backgroundColor: "#0066b3",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Tajawal",
    },
    buttonText: {
        fontSize: 16,
        color: "#fefefe",
        fontFamily: "Tajawal",
    },
});
