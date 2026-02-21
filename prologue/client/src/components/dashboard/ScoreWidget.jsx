import Card from '../ui/Card';

export default function ScoreWidget({ label, value, max = 100 }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <Card className="p-4">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-2xl font-semibold text-success mt-1">{value}{max ? ` / ${max}` : ''}</p>
      {max > 0 && (
        <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-success rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      )}
    </Card>
  );
}
