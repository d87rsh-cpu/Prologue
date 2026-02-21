import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PenSquare, Info, Paperclip, Send, MessageCircle } from 'lucide-react';
import { ROLES } from '../data/roles';
import { BOT_PERSONAS } from '../data/botPersonas';

const ACTIVE_PROJECT_KEY = 'prologue_active_project';

function getActiveProject() {
  try {
    const raw = localStorage.getItem(ACTIVE_PROJECT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const MANAGER = {
  id: 'arjun',
  name: 'Arjun Nair',
  role: 'Manager',
  department: 'Project Management',
  isManager: true,
  isGossip: false,
  currentWork: 'Reviewing sprint deliverables and task assignments',
  responseStyle: 'Formal',
  color: '#0F3460',
};

function buildTeamContacts() {
  const project = getActiveProject();
  const roleIds = project?.teamRolesNeeded ?? ['frontend_dev', 'backend_dev'];
  return roleIds.slice(0, 4).map((roleId) => {
    const role = ROLES.find((r) => r.id === roleId);
    const persona = BOT_PERSONAS.find((p) => p.roleId === roleId);
    return {
      id: roleId,
      name: persona?.name ?? role?.title ?? roleId,
      role: role?.title ?? roleId,
      department: 'Engineering',
      isManager: false,
      isGossip: false,
      currentWork: 'Working on assigned tasks',
      responseStyle: 'Friendly',
      color: role?.color ?? '#0F3460',
    };
  });
}

const GOSSIP_BUDDY = {
  id: 'gossip_buddy',
  name: 'Gossip Buddy',
  role: 'Confidential Support',
  department: '—',
  isManager: false,
  isGossip: true,
  currentWork: 'Here to listen',
  responseStyle: 'Friendly',
  color: '#00B4D8',
};

const MOCK_MESSAGES = {
  arjun: [
    { id: 1, from: 'arjun', text: 'Hi, please share an update on the login module by EOD.', time: '10:30 AM' },
    { id: 2, from: 'me', text: 'Sure, I\'ll have the wireframes and API spec ready by 5 PM.', time: '10:32 AM' },
    { id: 3, from: 'arjun', text: 'Good progress on the REST structure. Ensure we follow the standards doc.', time: '11:15 AM' },
    { id: 4, from: 'me', text: 'Understood. I\'ve aligned the endpoints with the standards.', time: '11:20 AM' },
  ],
  gossip_buddy: [
    { id: 1, from: 'gossip_buddy', text: 'Hey! This is your safe space. How are you feeling about the project?', time: '9:00 AM' },
    { id: 2, from: 'me', text: 'A bit overwhelmed with the deadlines, but managing.', time: '9:05 AM' },
    { id: 3, from: 'gossip_buddy', text: 'That\'s totally valid. Remember to take short breaks. You\'ve got this. 🤫', time: '9:06 AM' },
  ],
  default: [
    { id: 1, from: 'contact', text: 'Hey! Did you get a chance to look at the PR?', time: '2:00 PM' },
    { id: 2, from: 'me', text: 'Yes, left a few comments. The approach looks good.', time: '2:05 PM' },
    { id: 3, from: 'contact', text: 'Thanks! I\'ll address those and push an update.', time: '2:10 PM' },
  ],
};

export default function MessagingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const contactParam = searchParams.get('contact');
  const [selectedId, setSelectedId] = useState(contactParam || null);
  const [contextOpen, setContextOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');

  const teamContacts = buildTeamContacts();
  const allContacts = [MANAGER, ...teamContacts, GOSSIP_BUDDY];

  useEffect(() => {
    if (contactParam && !selectedId) {
      const match = allContacts.find((c) => decodeURIComponent(contactParam) === c.name || c.id === contactParam);
      if (match) setSelectedId(match.id);
    }
  }, [contactParam]);

  const selected = allContacts.find((c) => c.id === selectedId) ?? (contactParam ? allContacts.find((c) => c.name === decodeURIComponent(contactParam)) : null) ?? null;

  const messages = selected
    ? (selected.isManager ? MOCK_MESSAGES.arjun : selected.isGossip ? MOCK_MESSAGES.gossip_buddy : MOCK_MESSAGES.default)
    : [];

  const selectContact = (contact) => {
    setSelectedId(contact.id);
    setSearchParams({ contact: contact.name });
  };

  const isGossip = selected?.isGossip ?? false;

  return (
    <div className="flex overflow-hidden bg-primary" style={{ height: 'calc(100vh - 3.5rem)' }}>
      {/* Column 1 — Contacts */}
      <aside className="w-[220px] shrink-0 border-r border-border bg-secondary flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text-primary">Team Messages</h2>
          <button type="button" className="p-1.5 rounded-lg text-text-secondary hover:bg-card-bg hover:text-text-primary">
            <PenSquare className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="py-2">
            <p className="px-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Manager</p>
            <button
              type="button"
              onClick={() => selectContact(MANAGER)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                selectedId === MANAGER.id ? 'bg-accent/20 border-l-2 border-accent' : 'hover:bg-card-bg'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: MANAGER.color }}>
                  AN
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary truncate">{MANAGER.name}</p>
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">Manager</span>
              </div>
            </button>
          </div>
          <div className="py-2">
            <p className="px-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Team</p>
            {teamContacts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectContact(c)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  selectedId === c.id ? 'bg-accent/20 border-l-2 border-accent' : 'hover:bg-card-bg'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: c.color }}>
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary truncate">{c.name}</p>
                  <p className="text-xs text-text-secondary truncate">{c.role}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="py-2">
            <button
              type="button"
              onClick={() => selectContact(GOSSIP_BUDDY)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors rounded-lg mx-2 ${
                selectedId === GOSSIP_BUDDY.id ? 'bg-success/10 border border-success/30' : 'hover:bg-card-bg border border-transparent'
              }`}
            >
              <span className="relative shrink-0 flex items-center justify-center">
                <span className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-success" />
                </span>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              </span>
              <span className="font-medium text-text-primary truncate" style={{ fontFamily: 'var(--font-sans)' }}>
                Gossip Buddy 🤫
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Column 2 — Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-primary">
        {selected ? (
          <>
            <div
              className={`shrink-0 flex items-center justify-between px-4 py-3 border-b border-border ${
                isGossip ? 'bg-card-bg/80' : 'bg-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0" style={{ backgroundColor: selected.color }}>
                  {selected.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {isGossip ? 'Gossip Buddy 😉' : selected.name}
                  </h3>
                  <p className="text-xs text-text-secondary">{selected.role}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
              </div>
              <button
                type="button"
                onClick={() => setContextOpen((o) => !o)}
                className="p-2 rounded-lg text-text-secondary hover:bg-card-bg hover:text-text-primary"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
            {isGossip && (
              <div className="shrink-0 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-sm">
                🔒 This is your safe space. Your conversations here are private and confidential.
              </div>
            )}
            <div
              className={`flex-1 overflow-auto p-4 space-y-3 ${
                isGossip ? 'bg-gradient-to-b from-card-bg/50 to-primary' : ''
              }`}
            >
              {messages.map((msg) => {
                const isMe = msg.from === 'me';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isMe ? 'bg-highlight text-white' : 'bg-card-bg border border-border text-text-primary'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <p className={`text-xs text-text-secondary mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="shrink-0 p-4 border-t border-border bg-secondary">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a professional message..."
                  className="flex-1 bg-card-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button type="button" className="p-2.5 rounded-lg text-text-secondary hover:bg-card-bg hover:text-text-primary">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button type="button" className="p-2.5 rounded-lg bg-highlight text-white hover:opacity-90">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <p>Select a contact to start messaging</p>
          </div>
        )}
      </div>

      {/* Column 3 — Context */}
      {contextOpen && (
        <aside className="w-[240px] shrink-0 border-l border-border bg-secondary flex flex-col p-4">
          {selected ? (
            <>
              <div className="text-center mb-4">
                <div
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-medium text-white mb-2"
                  style={{ backgroundColor: selected.color }}
                >
                  {selected.name.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="font-semibold text-text-primary">{selected.name}</h3>
                <p className="text-sm text-text-secondary">{selected.role}</p>
                <p className="text-xs text-text-secondary">{selected.department}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Project Context</h4>
                  <p className="text-sm text-text-primary">{selected.currentWork}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Response Style</h4>
                  <span className="inline-block px-2 py-1 rounded bg-card-bg border border-border text-sm text-text-primary">
                    {selected.responseStyle}
                  </span>
                </div>
                {selected.isManager && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-200">
                    💡 Tip: Keep messages professional and project-focused. The manager responds best to clear, concise updates.
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-text-secondary">Select a contact to view details</p>
          )}
        </aside>
      )}
    </div>
  );
}
