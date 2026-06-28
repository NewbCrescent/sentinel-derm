import { getImageFunctionName, getSupabaseClient } from "@/lib/supabase";
import type {
  AsyncResult,
  ImageProcessingResult,
  PatientDraft,
  PatientSession
} from "@/types/patient";

const selfiesBucket = "selfies";

function ok<T>(data: T): AsyncResult<T> {
  return { data, error: null };
}

function fail<T>(error: string): AsyncResult<T> {
  return { data: null, error };
}

function unavailable<T>(): AsyncResult<T> {
  return fail(
    "Kiosk configuration is missing. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
  );
}

function messageFromError(error: { message?: string } | null, fallback: string): string {
  return error?.message ?? fallback;
}

export async function startPatientCheckIn(): Promise<AsyncResult<PatientSession>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return unavailable();
  }

  const authResult = await supabase.auth.signInAnonymously();
  const ownerId = authResult.data.user?.id;

  if (authResult.error || !ownerId) {
    return fail(messageFromError(authResult.error, "Could not start check-in."));
  }

  const patientResult = await supabase
    .from("patients")
    .insert({ patient_owner_id: ownerId })
    .select("id")
    .single();

  const patientId = patientResult.data?.id;

  if (patientResult.error || typeof patientId !== "string") {
    await supabase.auth.signOut();
    return fail(messageFromError(patientResult.error, "Could not create the check-in."));
  }

  return ok({ patientId, ownerId });
}

export async function savePatientDraft(
  patientId: string,
  draft: PatientDraft
): Promise<AsyncResult<PatientDraft>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return unavailable();
  }

  const result = await supabase
    .from("patients")
    .update({
      name: draft.name,
      phone_number: draft.phoneNumber,
      reason_for_visit: draft.reasonForVisit,
      additional_notes: draft.additionalNotes
    })
    .eq("id", patientId)
    .select("name, phone_number, reason_for_visit, additional_notes")
    .single();

  if (result.error) {
    return fail(messageFromError(result.error, "Could not save check-in details."));
  }

  return ok(draft);
}

export async function uploadPatientSelfie(
  patientId: string,
  localUri: string
): Promise<AsyncResult<{ imageUrl: string; storagePath: string }>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return unavailable();
  }

  const sessionResult = await supabase.auth.getSession();
  const ownerId = sessionResult.data.session?.user.id;

  if (sessionResult.error || !ownerId) {
    return fail(messageFromError(sessionResult.error, "Check-in session expired."));
  }

  const imageResponse = await fetch(localUri);
  const imageBlob = await imageResponse.blob();
  const storagePath = `${ownerId}/${patientId}/selfie-${Date.now()}.jpg`;

  const uploadResult = await supabase.storage
    .from(selfiesBucket)
    .upload(storagePath, imageBlob, {
      contentType: "image/jpeg",
      upsert: false
    });

  if (uploadResult.error) {
    return fail(messageFromError(uploadResult.error, "Could not upload the photo."));
  }

  const { data } = supabase.storage.from(selfiesBucket).getPublicUrl(storagePath);

  return ok({ imageUrl: data.publicUrl, storagePath });
}

export async function requestImageProcessing(
  patientId: string,
  imageUrl: string
): Promise<AsyncResult<ImageProcessingResult>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return unavailable();
  }

  const result = await supabase.functions.invoke<ImageProcessingResult>(
    getImageFunctionName(),
    {
      body: { patientId, imageUrl }
    }
  );

  if (result.error) {
    return fail(messageFromError(result.error, "Could not process the photo."));
  }

  return ok(result.data ?? {});
}

export async function resetPatientSession(): Promise<AsyncResult<null>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return ok(null);
  }

  const result = await supabase.auth.signOut();

  if (result.error) {
    return fail(messageFromError(result.error, "Could not reset the kiosk session."));
  }

  return ok(null);
}
