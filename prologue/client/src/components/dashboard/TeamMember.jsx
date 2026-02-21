import Avatar from '../ui/Avatar';

export default function TeamMember({ name, role }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-card-bg">
      <Avatar name={name} size="md" />
      <div>
        <p className="font-medium text-text-primary">{name}</p>
        <p className="text-sm text-text-secondary">{role}</p>
      </div>
    </div>
  );
}
