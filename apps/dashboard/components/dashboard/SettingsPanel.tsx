import { CheckCircle2, CircleAlert } from "lucide-react";

export function SettingsPanel({
  archivedCount,
  hasSupabaseConfig,
  openQueueCount,
}: {
  archivedCount: number;
  hasSupabaseConfig: boolean;
  openQueueCount: number;
}) {
  return (
    <section className="detail-grid">
      <div className="panel">
        <h2>Supabase</h2>
        <p className="patient-meta">
          {hasSupabaseConfig ? (
            <>
              <CheckCircle2 aria-hidden="true" size={16} />
              Publishable-key configuration detected.
            </>
          ) : (
            <>
              <CircleAlert aria-hidden="true" size={16} />
              Supabase environment variables are missing.
            </>
          )}
        </p>
      </div>
      <div className="panel">
        <h2>Placeholder mode</h2>
        <div className="data-grid">
          <div className="data-item">
            <span>Open patients</span>
            <strong>{openQueueCount}</strong>
          </div>
          <div className="data-item">
            <span>Archived patients</span>
            <strong>{archivedCount}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
