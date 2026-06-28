import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { conditionLabels, type PatientListResult, urgencyLabels } from "@/types/patient";

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PatientList({ result }: { result: PatientListResult }) {
  if (result.patients.length === 0) {
    return <div className="empty-state">No patients match the current filters.</div>;
  }

  const nextHref = result.nextCursor
    ? `/patients?${new URLSearchParams({
        status: result.params.status,
        condition: result.params.condition.join(","),
        sort: result.params.sort,
        order: result.params.order,
        cursor: result.nextCursor,
        limit: String(result.params.limit),
      }).toString()}`
    : null;

  return (
    <div className="patient-list">
      {result.patients.map((patient) => {
        const primaryDetection = patient.detections[0];

        return (
          <article className="patient-card" key={patient.id}>
            <div
              aria-label="Clinical image preview"
              className={`clinical-preview ${patient.urgencyLevel}`}
              role="img"
            />
            <div>
              <h2>{patient.name}</h2>
              <div className="patient-meta">
                <span className={`badge ${patient.urgencyLevel}`}>{urgencyLabels[patient.urgencyLevel]}</span>
                {primaryDetection ? (
                  <span className="badge">{conditionLabels[primaryDetection.label]}</span>
                ) : null}
                <span>Checked in {formatTime(patient.createdAt)}</span>
              </div>
            </div>
            <Link className="button secondary" href={`/patients/${patient.id}`}>
              Open
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </article>
        );
      })}
      {nextHref ? (
        <Link className="button secondary" href={nextHref}>
          Next page
        </Link>
      ) : null}
    </div>
  );
}
