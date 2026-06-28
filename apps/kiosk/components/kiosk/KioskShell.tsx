import { colors } from "@/theme/colors";
import type { ReactNode } from "react";
import { ScrollView, Text, View, useColorScheme } from "react-native";

type KioskShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function KioskShell({ title, subtitle, children, footer }: KioskShellProps) {
  useColorScheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.groupedBackground }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
        gap: 24
      }}
    >
      <View style={{ gap: 12 }}>
        <Text
          selectable
          style={{
            color: colors.label,
            fontSize: 34,
            fontWeight: "800",
            lineHeight: 40,
            textAlign: "center"
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            selectable
            style={{
              color: colors.secondaryLabel,
              fontSize: 18,
              lineHeight: 26,
              textAlign: "center"
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          alignSelf: "center",
          width: "100%",
          maxWidth: 620,
          backgroundColor: colors.card,
          borderRadius: 18,
          borderCurve: "continuous",
          padding: 22,
          gap: 18,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)"
        }}
      >
        {children}
      </View>

      {footer ? (
        <View style={{ alignSelf: "center", width: "100%", maxWidth: 620 }}>{footer}</View>
      ) : null}
    </ScrollView>
  );
}
