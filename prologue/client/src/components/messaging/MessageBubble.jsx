export default function MessageBubble({ text, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isOwn ? 'bg-accent text-text-primary' : 'bg-card-bg border border-border text-text-primary'
        }`}
      >
        {text}
      </div>
    </div>
  );
}
