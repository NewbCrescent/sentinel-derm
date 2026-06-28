import { Color } from "expo-router";
import { Platform } from "react-native";

export const colors = {
  background: Platform.select({
    ios: Color.ios.systemBackground,
    android: Color.android.dynamic.surface,
    default: "#f8fafc"
  })!,
  groupedBackground: Platform.select({
    ios: Color.ios.systemGroupedBackground,
    android: Color.android.dynamic.surfaceContainerLowest,
    default: "#eef2f7"
  })!,
  card: Platform.select({
    ios: Color.ios.secondarySystemGroupedBackground,
    android: Color.android.dynamic.surfaceContainer,
    default: "#ffffff"
  })!,
  label: Platform.select({
    ios: Color.ios.label,
    android: Color.android.dynamic.onSurface,
    default: "#111827"
  })!,
  secondaryLabel: Platform.select({
    ios: Color.ios.secondaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: "#4b5563"
  })!,
  tertiaryLabel: Platform.select({
    ios: Color.ios.tertiaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: "#6b7280"
  })!,
  separator: Platform.select({
    ios: Color.ios.separator,
    android: Color.android.dynamic.outlineVariant,
    default: "#d1d5db"
  })!,
  tint: Platform.select({
    ios: Color.ios.systemTeal,
    android: Color.android.dynamic.primary,
    default: "#0f766e"
  })!,
  tintText: Platform.select({
    ios: Color.ios.white,
    android: Color.android.dynamic.onPrimary,
    default: "#ffffff"
  })!,
  danger: Platform.select({
    ios: Color.ios.systemRed,
    android: Color.android.material.error,
    default: "#b91c1c"
  })!
};
