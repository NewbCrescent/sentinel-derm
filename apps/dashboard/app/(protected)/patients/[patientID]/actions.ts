"use server";

import { redirect } from "next/navigation";

import { patientExists } from "@/lib/patients";

function getPatientId(formData: FormData): string | null {
  const patientId = formData.get("patientId");

  if (typeof patientId !== "string" || !patientId.trim()) {
    return null;
  }

  return patientId.trim();
}

export async function archivePatientAction(formData: FormData) {
  const patientId = getPatientId(formData);

  if (!patientId || !(await patientExists(patientId))) {
    redirect("/patients?error=not-found");
  }

  redirect(`/patients/${patientId}?message=archive-placeholder`);
}

export async function addNoteAction(formData: FormData) {
  const patientId = getPatientId(formData);
  const note = formData.get("note");

  if (!patientId || !(await patientExists(patientId))) {
    redirect("/patients?error=not-found");
  }

  if (typeof note !== "string" || !note.trim()) {
    redirect(`/patients/${patientId}?error=empty-note`);
  }

  const noteBytes = new TextEncoder().encode(note).byteLength;

  if (noteBytes > 10_485_760) {
    redirect(`/patients/${patientId}?error=note-too-large`);
  }

  redirect(`/patients/${patientId}?message=note-placeholder`);
}
