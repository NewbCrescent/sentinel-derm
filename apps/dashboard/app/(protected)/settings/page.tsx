import { SettingsPanel } from "@/components/dashboard/SettingsPanel";
import { getArchivedCount, getOpenQueueCount } from "@/lib/patients";
import { getSupabaseConfig } from "@/lib/supabase-server";

export default function SettingsPage() {
  return (
    <>
      <section className="page-header">
        <div className="page-title">
          <p className="eyebrow">Settings</p>
          <h1>Account and app status</h1>
          <p>Configuration and session status for the dermatologist web app.</p>
        </div>
      </section>
      <SettingsPanel
        archivedCount={getArchivedCount()}
        hasSupabaseConfig={Boolean(getSupabaseConfig())}
        openQueueCount={getOpenQueueCount()}
      />
    </>
  );
}
