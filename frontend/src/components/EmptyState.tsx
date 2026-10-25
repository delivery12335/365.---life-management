import { Plus, type LucideIcon } from 'lucide-react';
export function EmptyState({
  title,
  description,
  action,
  onAction,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action: string;
  onAction: () => void;
  icon: LucideIcon;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon size={25} />
      </span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      <button className="button secondary" onClick={onAction}>
        <Plus size={16} />
        {action}
      </button>
    </div>
  );
}
