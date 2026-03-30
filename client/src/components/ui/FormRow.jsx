export default function FormRow({ children, className = '' }) {
  return <div className={`panel-form ${className}`.trim()}>{children}</div>;
}
