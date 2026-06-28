import { colors } from "@/theme/colors";
import { ActivityIndicator, Pressable, Text, type ColorValue } from "react-native";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary"
}: PrimaryButtonProps) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const backgroundColor: ColorValue = isPrimary
    ? colors.tint
    : isDanger
      ? "transparent"
      : colors.card;
  const color: ColorValue = isPrimary ? colors.tintText : isDanger ? colors.danger : colors.label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 56,
        borderRadius: 14,
        borderCurve: "continuous",
        borderWidth: isPrimary ? 0 : 1,
        borderColor: isDanger ? colors.danger : colors.separator,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 18,
        backgroundColor,
        opacity: disabled ? 0.45 : pressed ? 0.78 : 1
      })}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text
          style={{
            color,
            fontSize: 17,
            fontWeight: "700",
            textAlign: "center"
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
