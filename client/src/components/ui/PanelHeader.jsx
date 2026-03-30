export default function PanelHeader({ title, icon, meta, actions, className = '' }) {
  return (
    <div className={`panel-toolbar ${className}`.trim()}>
      <h2 className="section-title" style={{ marginBottom: 0 }}>
        {icon}
        {title}
      </h2>
      <div className="action-row">
        {meta ? <span className="muted-copy">{meta}</span> : null}
        {actions}
      </div>
    </div>
  );
}
