import { PrimaryButton } from "@/components/kiosk/PrimaryButton";
import { KioskShell } from "@/components/kiosk/KioskShell";
import {
  requestImageProcessing,
  resetPatientSession,
  uploadPatientSelfie
} from "@/lib/patient-session";
import { colors } from "@/theme/colors";
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from "expo-camera";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Text, View } from "react-native";

type CaptureStep = "guidance" | "camera" | "review" | "done";

export function CaptureFlow() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [step, setStep] = useState<CaptureStep>("guidance");
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function openCamera() {
    setError(null);

    if (!permission?.granted) {
      const nextPermission = await requestPermission();

      if (!nextPermission.granted) {
        setError("Camera access is needed to submit a photo for review.");
        return;
      }
    }

    setStep("camera");
  }

  async function takePhoto() {
    setError(null);
    setIsBusy(true);

    const nextPhoto = await cameraRef.current?.takePictureAsync({
      quality: 0.82,
      imageType: "jpg",
      skipProcessing: false
    });

    setIsBusy(false);

    if (!nextPhoto) {
      setError("Could not capture the photo. Please try again.");
      return;
    }

    setPhoto(nextPhoto);
    setStep("review");
  }

  async function submitPhoto() {
    if (!patientId || !photo) {
      setError("This check-in is missing photo details. Please start again.");
      return;
    }

    setError(null);
    setIsBusy(true);

    const uploadResult = await uploadPatientSelfie(patientId, photo.uri);

    if (uploadResult.error || !uploadResult.data) {
      setError(uploadResult.error ?? "Could not upload the photo.");
      setIsBusy(false);
      return;
    }

    const processingResult = await requestImageProcessing(patientId, uploadResult.data.imageUrl);

    if (processingResult.error) {
      setError(processingResult.error);
      setIsBusy(false);
      return;
    }

    await resetPatientSession();
    setIsBusy(false);
    setStep("done");
  }

  async function resetKiosk() {
    await resetPatientSession();
    router.replace("/");
  }

  if (!patientId) {
    return (
      <KioskShell title="Start a new check-in" subtitle="This screen needs an active patient session.">
        <PrimaryButton label="Return to start" onPress={resetKiosk} />
      </KioskShell>
    );
  }

  if (step === "done") {
    return (
      <KioskShell
        title="You are checked in"
        subtitle="Take a seat and wait for your name to be called out."
      >
        <Text
          selectable
          style={{
            color: colors.secondaryLabel,
            fontSize: 17,
            lineHeight: 25,
            textAlign: "center"
          }}
        >
          Your photo and visit details were sent for clinician review.
        </Text>
        <PrimaryButton label="Reset kiosk" onPress={resetKiosk} />
      </KioskShell>
    );
  }

  if (step === "camera") {
    return (
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <CameraView ref={cameraRef} facing="front" style={{ flex: 1 }} />
        <View
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: 36,
            gap: 12
          }}
        >
          {error ? <ErrorMessage message={error} inverted /> : null}
          <PrimaryButton label="Take photo" onPress={takePhoto} loading={isBusy} />
          <PrimaryButton label="Back" onPress={() => setStep("guidance")} variant="secondary" />
        </View>
      </View>
    );
  }

  if (step === "review" && photo) {
    return (
      <KioskShell title="Review photo" subtitle="Retake it if your face is blurry or not centered.">
        <Image
          source={{ uri: photo.uri }}
          contentFit="cover"
          style={{
            width: "100%",
            aspectRatio: 3 / 4,
            borderRadius: 16,
            backgroundColor: colors.groupedBackground
          }}
        />
        {error ? <ErrorMessage message={error} /> : null}
        <PrimaryButton label="Submit photo" onPress={submitPhoto} loading={isBusy} />
        <PrimaryButton label="Retake photo" onPress={() => setStep("camera")} variant="secondary" />
      </KioskShell>
    );
  }

  return (
    <KioskShell
      title="Photo guidance"
      subtitle="Your photo helps the clinician review your check-in."
    >
      <GuidanceItem text="Hold the kiosk at eye level and face the camera." />
      <GuidanceItem text="Use bright, even lighting when possible." />
      <GuidanceItem text="Remove hats, masks, or anything blocking your face." />
      {error ? <ErrorMessage message={error} /> : null}
      <PrimaryButton label="Open camera" onPress={openCamera} />
      <PrimaryButton label="Cancel check-in" onPress={resetKiosk} variant="secondary" />
    </KioskShell>
  );
}

function GuidanceItem({ text }: { text: string }) {
  return (
    <View
      style={{
        borderRadius: 12,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.separator,
        padding: 14,
        backgroundColor: colors.background
      }}
    >
      <Text selectable style={{ color: colors.label, fontSize: 16, lineHeight: 23 }}>
        {text}
      </Text>
    </View>
  );
}

function ErrorMessage({ message, inverted = false }: { message: string; inverted?: boolean }) {
  return (
    <Text
      selectable
      style={{
        color: inverted ? "#ffffff" : colors.danger,
        fontSize: 15,
        lineHeight: 21,
        textAlign: inverted ? "center" : "left"
      }}
    >
      {message}
    </Text>
  );
}
