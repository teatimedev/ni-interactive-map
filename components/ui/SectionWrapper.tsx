interface SectionWrapperProps {
  title: string;
  source?: string;
  children: React.ReactNode;
}

export default function SectionWrapper({ title, source, children }: SectionWrapperProps) {
  return (
    <div className="stat-section">
      <h3>{title}</h3>
      {children}
      {source && (
        <div className="section-source">{source}</div>
      )}
    </div>
  );
}
