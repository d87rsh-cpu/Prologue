import Card from '../ui/Card';

export default function CalendarWidget({ title = 'Calendar' }) {
  return (
    <Card className="p-4">
      <h3 className="font-medium text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary mt-2">No upcoming events</p>
    </Card>
  );
}
