import React from "react";
import { I18nManager } from "react-native";
import RootNavigator from "./navigation/RootNavigator";

// Force RTL and Arabic layout
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function Index() {
    return <RootNavigator />;
}