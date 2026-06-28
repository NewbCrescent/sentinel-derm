import { PatientFilters } from "@/components/dashboard/PatientFilters";
import { PatientList } from "@/components/dashboard/PatientList";
import { StatusMessage } from "@/components/dashboard/StatusMessage";
import { getArchivedCount, getMostUrgentLevel, getOpenQueueCount, listPatients, parsePatientListParams } from "@/lib/patients";
import { urgencyLabels } from "@/types/patient";

type PatientsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const resolvedSearchParams = await searchParams;
  const parsedParams = parsePatientListParams(resolvedSearchParams);

  if (parsedParams.error || !parsedParams.data) {
    return (
      <>
        <section className="page-header">
          <div className="page-title">
            <p className="eyebrow">Patients</p>
            <h1>Review queue</h1>
          </div>
        </section>
        <StatusMessage tone="error">Invalid queue filter.</StatusMessage>
      </>
    );
  }

  const patientResult = await listPatients(parsedParams.data);

  return (
    <>
      <section className="page-header">
        <div className="page-title">
          <p className="eyebrow">Patients</p>
          <h1>Review queue</h1>
          <p>Recent check-ins are prioritized for dermatologist review.</p>
        </div>
      </section>
      <section className="metrics" aria-label="Queue metrics">
        <div className="metric">
          <span>Open</span>
          <strong>{getOpenQueueCount()}</strong>
        </div>
        <div className="metric">
          <span>Top priority</span>
          <strong>{urgencyLabels[getMostUrgentLevel()]}</strong>
        </div>
        <div className="metric">
          <span>Archived</span>
          <strong>{getArchivedCount()}</strong>
        </div>
      </section>
      <section className="panel">
        <PatientFilters params={parsedParams.data} />
        {patientResult.error || !patientResult.data ? (
          <StatusMessage tone="error">{patientResult.error ?? "Unable to load patients."}</StatusMessage>
        ) : (
          <PatientList result={patientResult.data} />
        )}
      </section>
    </>
  );
}
