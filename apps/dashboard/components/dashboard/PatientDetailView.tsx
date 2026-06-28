import { Archive, Save } from "lucide-react";

import { conditionLabels, type PatientDetail, urgencyLabels } from "@/types/patient";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PatientDetailView({
  addNoteAction,
  archivePatientAction,
  patient,
}: {
  addNoteAction: (formData: FormData) => Promise<void>;
  archivePatientAction: (formData: FormData) => Promise<void>;
  patient: PatientDetail;
}) {
  const primaryDetection = patient.detections[0];

  return (
    <section className="detail-grid">
      <div className="panel">
        <div
          aria-label="Clinical image preview"
          className={`clinical-preview detail-image ${patient.urgencyLevel}`}
          role="img"
        />
      </div>
      <div className="detail-summary">
        <section className="panel">
          <div className="actions-row">
            <span className={`badge ${patient.urgencyLevel}`}>{urgencyLabels[patient.urgencyLevel]}</span>
            {primaryDetection ? <span className="badge">{conditionLabels[primaryDetection.label]}</span> : null}
            <span className="badge">{patient.status}</span>
          </div>
          <h2>AI summary</h2>
          <p>{patient.summary}</p>
        </section>
        <section className="panel">
          <h2>Patient data</h2>
          <div className="data-grid">
            <div className="data-item">
              <span>Phone</span>
              <strong>{patient.phoneNumber}</strong>
            </div>
            <div className="data-item">
              <span>Queue</span>
              <strong>{patient.queuePosition ? `#${patient.queuePosition}` : "Not active"}</strong>
            </div>
            <div className="data-item">
              <span>Checked in</span>
              <strong>{formatDateTime(patient.createdAt)}</strong>
            </div>
            <div className="data-item">
              <span>Confidence</span>
              <strong>{primaryDetection ? `${(primaryDetection.confidence * 100).toFixed(1)}%` : "Pending"}</strong>
            </div>
          </div>
          {patient.additionalNotes ? (
            <div className="data-item">
              <span>Additional notes</span>
              <p>{patient.additionalNotes}</p>
            </div>
          ) : null}
        </section>
        <section className="panel">
          <h2>Notes</h2>
          <form action={addNoteAction} className="auth-form">
            <input name="patientId" type="hidden" value={patient.id} />
            <label className="field">
              <span>New note</span>
              <textarea maxLength={10_485_760} name="note" />
            </label>
            <button className="button" type="submit">
              <Save aria-hidden="true" size={16} />
              Save note
            </button>
          </form>
          <div className="note-list">
            {patient.notes.length > 0 ? (
              patient.notes.map((note) => (
                <article className="note-item" key={note.id}>
                  <strong>{note.author}</strong>
                  <p>{note.body}</p>
                </article>
              ))
            ) : (
              <div className="empty-state">No notes yet.</div>
            )}
          </div>
        </section>
        <section className="panel">
          <form action={archivePatientAction}>
            <input name="patientId" type="hidden" value={patient.id} />
            <button className="button danger" type="submit">
              <Archive aria-hidden="true" size={16} />
              Archive case
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
