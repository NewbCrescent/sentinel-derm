import { PrimaryButton } from "@/components/kiosk/PrimaryButton";
import { KioskShell } from "@/components/kiosk/KioskShell";
import { resetPatientSession, savePatientDraft, startPatientCheckIn } from "@/lib/patient-session";
import { colors } from "@/theme/colors";
import {
  type PatientDraft,
  type PatientSession,
  type ReasonForVisit,
  reasonForVisitOptions
} from "@/types/patient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type Step = "welcome" | "intro" | "identity" | "reason";

const emptyDraft: PatientDraft = {
  name: "",
  phoneNumber: "",
  reasonForVisit: "acne",
  additionalNotes: null
};

function normalizeDraft(draft: PatientDraft): PatientDraft {
  const notes = draft.additionalNotes?.trim();

  return {
    name: draft.name.trim(),
    phoneNumber: draft.phoneNumber.trim(),
    reasonForVisit: draft.reasonForVisit,
    additionalNotes: notes ? notes : null
  };
}

function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10;
}

export function CheckInWizard() {
  const [step, setStep] = useState<Step>("welcome");
  const [session, setSession] = useState<PatientSession | null>(null);
  const [draft, setDraft] = useState<PatientDraft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const normalizedDraft = useMemo(() => normalizeDraft(draft), [draft]);
  const identityIsValid =
    normalizedDraft.name.length >= 2 && isValidPhoneNumber(normalizedDraft.phoneNumber);

  async function handleStart() {
    setError(null);
    setIsBusy(true);

    const result = await startPatientCheckIn();

    setIsBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSession(result.data);
    setStep("intro");
  }

  async function handleCancel() {
    setIsBusy(true);
    await resetPatientSession();
    setSession(null);
    setDraft(emptyDraft);
    setStep("welcome");
    setError(null);
    setIsBusy(false);
  }

  async function handleSubmit() {
    if (!session) {
      setError("Start a new check-in first.");
      setStep("welcome");
      return;
    }

    setError(null);
    setIsBusy(true);

    const result = await savePatientDraft(session.patientId, normalizedDraft);

    setIsBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.replace({ pathname: "/capture", params: { patientId: session.patientId } });
  }

  if (step === "welcome") {
    return (
      <KioskShell
        title="Sentinel Derm"
        subtitle="Start a quick dermatology check-in. A clinician will review your information."
      >
        {error ? <ErrorMessage message={error} /> : null}
        <PrimaryButton label="Check in" onPress={handleStart} loading={isBusy} />
      </KioskShell>
    );
  }

  if (step === "intro") {
    return (
      <KioskShell
        title="Let us check you in"
        subtitle="We will ask for your name, phone number, visit reason, and one photo."
      >
        {error ? <ErrorMessage message={error} /> : null}
        <PrimaryButton label="Continue" onPress={() => setStep("identity")} />
        <PrimaryButton label="Cancel check-in" onPress={handleCancel} variant="secondary" />
      </KioskShell>
    );
  }

  if (step === "identity") {
    return (
      <KioskShell title="Your information" subtitle="Enter the name the clinic should call.">
        <TextField
          label="Name"
          value={draft.name}
          onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
          autoCapitalize="words"
          textContentType="name"
        />
        <TextField
          label="Phone number"
          value={draft.phoneNumber}
          onChangeText={(phoneNumber) => setDraft((current) => ({ ...current, phoneNumber }))}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
        />
        {error ? <ErrorMessage message={error} /> : null}
        <PrimaryButton
          label="Continue"
          onPress={() => setStep("reason")}
          disabled={!identityIsValid}
        />
        <PrimaryButton label="Cancel check-in" onPress={handleCancel} variant="secondary" />
      </KioskShell>
    );
  }

  return (
    <KioskShell
      title="Reason for visit"
      subtitle="Choose the closest match. The clinician will review the photo and details."
    >
      <ReasonOptions
        value={draft.reasonForVisit}
        onChange={(reasonForVisit) => setDraft((current) => ({ ...current, reasonForVisit }))}
      />
      <TextField
        label="Anything else you would like to add?"
        value={draft.additionalNotes ?? ""}
        onChangeText={(additionalNotes) => setDraft((current) => ({ ...current, additionalNotes }))}
        multiline
        numberOfLines={4}
      />
      {error ? <ErrorMessage message={error} /> : null}
      <PrimaryButton label="Continue to photo" onPress={handleSubmit} loading={isBusy} />
      <PrimaryButton label="Back" onPress={() => setStep("identity")} variant="secondary" />
    </KioskShell>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "phone-pad";
  textContentType?: "name" | "telephoneNumber";
  multiline?: boolean;
  numberOfLines?: number;
};

function TextField({
  label,
  value,
  onChangeText,
  autoCapitalize,
  keyboardType = "default",
  textContentType,
  multiline = false,
  numberOfLines
}: TextFieldProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: colors.label, fontSize: 16, fontWeight: "700" }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        textContentType={textContentType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={{
          minHeight: multiline ? 112 : 54,
          borderWidth: 1,
          borderColor: colors.separator,
          borderRadius: 12,
          borderCurve: "continuous",
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: colors.label,
          backgroundColor: colors.background,
          fontSize: 17,
          textAlignVertical: multiline ? "top" : "center"
        }}
      />
    </View>
  );
}

type ReasonOptionsProps = {
  value: ReasonForVisit;
  onChange: (value: ReasonForVisit) => void;
};

function ReasonOptions({ value, onChange }: ReasonOptionsProps) {
  return (
    <View style={{ gap: 10 }}>
      {reasonForVisitOptions.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              minHeight: 50,
              borderRadius: 12,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: selected ? colors.tint : colors.separator,
              backgroundColor: selected ? colors.groupedBackground : colors.background,
              justifyContent: "center",
              paddingHorizontal: 14,
              opacity: pressed ? 0.74 : 1
            })}
          >
            <Text
              selectable
              style={{
                color: selected ? colors.label : colors.secondaryLabel,
                fontSize: 16,
                fontWeight: selected ? "700" : "500"
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <Text selectable style={{ color: colors.danger, fontSize: 15, lineHeight: 21 }}>
      {message}
    </Text>
  );
}
