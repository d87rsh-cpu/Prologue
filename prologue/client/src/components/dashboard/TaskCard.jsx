import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function TaskCard({ title, status, description }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-text-primary">{title}</h3>
        <Badge variant={status === 'done' ? 'success' : 'primary'}>{status}</Badge>
      </div>
      {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
    </Card>
  );
}
