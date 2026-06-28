type StatusMessageProps = {
  children: React.ReactNode;
  tone: "error" | "success";
};

export function StatusMessage({ children, tone }: StatusMessageProps) {
  return <div className={`status-message${tone === "error" ? " error" : ""}`}>{children}</div>;
}
