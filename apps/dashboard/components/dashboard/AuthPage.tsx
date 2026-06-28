type AuthPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  children: React.ReactNode;
};

export function AuthPage({ eyebrow, title, summary, children }: AuthPageProps) {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Sentinel Derm">
        <div className="auth-visual-panel">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{summary}</p>
        </div>
      </section>
      <section className="auth-card">{children}</section>
    </main>
  );
}
