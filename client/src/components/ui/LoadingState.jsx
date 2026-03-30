export default function LoadingState({ label, className = '', compact = false }) {
  return (
    <div className={`loading-state ${compact ? 'loading-state-compact' : ''} ${className}`.trim()}>
      <span className="loading-spinner" aria-hidden="true" />
      {label ? <span className="loading-label">{label}</span> : null}
    </div>
  );
}
