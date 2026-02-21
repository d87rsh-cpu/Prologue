export default function ChatWindow() {
  return (
    <div className="flex flex-col h-full border border-border rounded-lg bg-card-bg">
      <div className="p-3 border-b border-border">
        <p className="font-medium text-text-primary">Chat</p>
      </div>
      <div className="flex-1 p-4 overflow-auto text-text-secondary text-sm">
        No messages yet.
      </div>
    </div>
  );
}
