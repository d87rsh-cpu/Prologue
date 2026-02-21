export default function ContactList() {
  return (
    <div className="border border-border rounded-lg bg-card-bg overflow-hidden">
      <div className="p-3 border-b border-border">
        <p className="font-medium text-text-primary">Contacts</p>
      </div>
      <ul className="divide-y divide-border">
        <li className="p-3 text-sm text-text-secondary">No contacts</li>
      </ul>
    </div>
  );
}
