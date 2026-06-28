import Link from "next/link";
import { notFound } from "next/navigation";

import { archivePatientAction, addNoteAction } from "@/app/(protected)/patients/[patientID]/actions";
import { PatientDetailView } from "@/components/dashboard/PatientDetailView";
import { StatusMessage } from "@/components/dashboard/StatusMessage";
import { getPatientDetail } from "@/lib/patients";

type PatientDetailPageProps = {
  params: Promise<{ patientID: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PatientDetailPage({ params, searchParams }: PatientDetailPageProps) {
  const { patientID } = await params;
  const resolvedSearchParams = await searchParams;
  const message = getSearchValue(resolvedSearchParams.message);
  const error = getSearchValue(resolvedSearchParams.error);
  const patientResult = await getPatientDetail(patientID);

  if (patientResult.error || !patientResult.data) {
    notFound();
  }

  return (
    <>
      <section className="page-header">
        <div className="page-title">
          <p className="eyebrow">Patient detail</p>
          <h1>{patientResult.data.name}</h1>
          <p>{patientResult.data.reasonForVisit}</p>
        </div>
        <Link className="button secondary" href="/patients">
          Back to patients
        </Link>
      </section>
      {message === "archive-placeholder" ? (
        <StatusMessage tone="success">Archive action is wired for placeholder mode.</StatusMessage>
      ) : null}
      {message === "note-placeholder" ? (
        <StatusMessage tone="success">Note action is wired for placeholder mode.</StatusMessage>
      ) : null}
      {error === "empty-note" ? <StatusMessage tone="error">Enter a note before saving.</StatusMessage> : null}
      {error === "note-too-large" ? <StatusMessage tone="error">Note exceeds the 10 MB limit.</StatusMessage> : null}
      <PatientDetailView
        addNoteAction={addNoteAction}
        archivePatientAction={archivePatientAction}
        patient={patientResult.data}
      />
    </>
  );
}
