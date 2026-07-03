import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { api, getToken, login, logout } from "./api.js";

const AuthContext = createContext(null);
const SETTINGS = ["greyhawk", "dragonlance"];

function useAuth() {
  return useContext(AuthContext);
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayDate(value) {
  if (!value) return "Not scheduled";
  return value;
}

function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const value = useMemo(
    () => ({
      authed: Boolean(token),
      refresh: () => setTokenState(getToken()),
      signOut: async () => {
        await logout();
        setTokenState(null);
      },
    }),
    [token],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function Protected({ children }) {
  const auth = useAuth();
  return auth.authed ? children : <Navigate to="/login" replace />;
}

function Shell() {
  const auth = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await auth.signOut();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/campaigns">
          <span className="brand-mark">DRG</span>
          <span>
            <strong>DM Portal</strong>
            <small>Campaign Command</small>
          </span>
        </Link>
        <nav>
          <NavLink to="/campaigns">Command Center</NavLink>
          <a href="/campaigns#active-campaigns">Campaigns</a>
          <NavLink to="/characters">Characters</NavLink>
          <NavLink to="/players">Players</NavLink>
          <NavLink to="/sessions">Sessions</NavLink>
          <NavLink to="/archive">Archive</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="sidebar-footer">
          <button className="ghost-button" onClick={signOut}>Sign Out</button>
          <small>DM Account</small>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(password);
      auth.refresh();
      navigate("/campaigns");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-panel" onSubmit={submit}>
        <p className="eyebrow">Drago Russo Games</p>
        <h1>DM Portal</h1>
        <label>
          Admin Password
          <input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button disabled={busy}>{busy ? "Opening..." : "Enter Portal"}</button>
      </form>
    </div>
  );
}

function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    setError("");
    try {
      setData(await loader());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, deps);

  return { data, error, loading, reload };
}

function PageState({ loading, error }) {
  if (loading) return <p className="muted">Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  return null;
}

function CampaignsPage() {
  const { data, error, loading, reload } = useLoad(() => api("/1e/campaigns?include_archived=true"));
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    setting: "greyhawk",
    schedule: "",
    next_session_date: "",
    session_number: 1,
    current_campaign_day: 1,
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const campaigns = data || [];
  const activeCampaigns = campaigns.filter((campaign) => campaign.status !== "archived");
  const archivedCampaigns = campaigns.filter((campaign) => campaign.status === "archived");

  async function createCampaign(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api("/1e/campaigns", { method: "POST", body: JSON.stringify(form) });
      setForm({
        name: "",
        setting: "greyhawk",
        schedule: "",
        next_session_date: "",
        session_number: 1,
        current_campaign_day: 1,
        description: "",
      });
      setCreateOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="command-center">
      <div className="command-hero">
        <div>
          <p className="eyebrow">Command Center</p>
          <h1>Welcome, DM.</h1>
          <h2>Your adventure begins here.</h2>
          <p className="lede">Manage your campaigns, players, and sessions from your command center.</p>
        </div>
        <div className="summary-strip hero-stats">
          <Stat label="Active Campaigns" value={activeCampaigns.length} />
          <Stat label="Archived" value={archivedCampaigns.length} />
          <Stat label="Characters" value={campaigns.reduce((total, campaign) => total + Number(campaign.character_count || 0), 0)} />
        </div>
      </div>

      <PageState loading={loading} error={error} />

      <div className="action-grid">
        <ActionCard tone="red" icon="S" title="Create Campaign" copy="Start a new campaign and build your world." action="Create New" onClick={() => setCreateOpen(true)} />
        <ActionCard tone="green" icon="P" title="Manage Players" copy="Invite players and manage your roster." action="View Players" to="/players" />
        <ActionCard tone="violet" icon="B" title="Sessions" copy="Plan sessions and track your adventures." action="View Sessions" to="/sessions" />
        <ActionCard tone="blue" icon="C" title="Characters" copy="Create and manage campaign characters." action="View Characters" to="/characters" />
      </div>

      <div className="command-grid" id="active-campaigns">
        <ActiveCampaignPanel campaign={activeCampaigns[0]} onCreate={() => setCreateOpen(true)} />
        <div className="stacked-panels">
          <UpcomingSessionsPanel />
          <RecentActivityPanel />
        </div>
        <div className="stacked-panels">
          <QuickActionsPanel onCreate={() => setCreateOpen(true)} />
          <DicePanel />
        </div>
      </div>

      {activeCampaigns.length > 1 ? (
        <>
          <h2 className="section-title" id="active-campaigns">Active Campaigns</h2>
          <CampaignCardGrid campaigns={activeCampaigns.slice(1)} />
        </>
      ) : null}

      {createOpen ? (
        <Modal title="Create Campaign" onClose={() => setCreateOpen(false)}>
          <form className="form-grid dashboard-create modal-form" onSubmit={createCampaign}>
            <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label>Setting
              <select value={form.setting} onChange={(event) => setForm({ ...form, setting: event.target.value })}>
                {SETTINGS.map((setting) => <option key={setting} value={setting}>{titleCase(setting)}</option>)}
              </select>
            </label>
            <label>Schedule<input placeholder="Weekly Sundays, 7 PM" value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} /></label>
            <label>Next Session<input type="date" value={form.next_session_date} onChange={(event) => setForm({ ...form, next_session_date: event.target.value })} /></label>
            <label>Session #<input type="number" min="1" value={form.session_number} onChange={(event) => setForm({ ...form, session_number: event.target.value })} /></label>
            <label>Campaign Day<input type="number" min="1" value={form.current_campaign_day} onChange={(event) => setForm({ ...form, current_campaign_day: event.target.value })} /></label>
            <label className="wide">Notes<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <div className="form-actions wide">
              <button disabled={saving}>{saving ? "Creating..." : "Create Campaign"}</button>
              <button type="button" className="ghost-button" onClick={() => setCreateOpen(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

function ActionCard({ tone, icon, title, copy, action, to, onClick }) {
  const content = (
    <>
      <div className="action-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <span className="action-button">{action}</span>
    </>
  );
  if (to) return <Link className={`action-card ${tone}`} to={to}>{content}</Link>;
  return <button className={`action-card ${tone}`} onClick={onClick}>{content}</button>;
}

function ActiveCampaignPanel({ campaign, onCreate }) {
  if (!campaign) {
    return (
      <section className="command-panel active-campaign">
        <p className="eyebrow">Active Campaign</p>
        <h2>No campaign yet</h2>
        <p className="muted">Create your first campaign to begin building the roster.</p>
        <button onClick={onCreate}>Create Campaign</button>
      </section>
    );
  }
  return (
    <section className="command-panel active-campaign">
      <p className="eyebrow">Active Campaign</p>
      <div className="campaign-focus">
        <div className="campaign-seal">{String(campaign.setting || "G").slice(0, 1).toUpperCase()}</div>
        <div>
          <h2>{campaign.name}</h2>
          <p>{titleCase(campaign.setting)} | Session #{campaign.session_number || 1} | {campaign.schedule || "Schedule TBD"}</p>
          <p>Campaign Day: {campaign.current_campaign_day || 1}</p>
        </div>
      </div>
      <div className="progress-line"><span style={{ width: `${Math.min(100, Number(campaign.character_count || 0) * 10)}%` }} /></div>
      <div className="session-box">
        <div><strong>Next Session</strong><span>{displayDate(campaign.next_session_date)}</span></div>
        <Link className="table-link" to={`/campaigns/${campaign.id}`}>Schedule</Link>
      </div>
      <Link className="wide-command" to={`/campaigns/${campaign.id}`}>View Campaign</Link>
    </section>
  );
}

function UpcomingSessionsPanel() {
  return (
    <section className="command-panel centered-panel">
      <p className="eyebrow">Upcoming Sessions</p>
      <div className="panel-emblem">CAL</div>
      <h2>No sessions scheduled</h2>
      <p>Schedule your next session to begin the adventure.</p>
      <Link className="wide-command" to="/sessions">Schedule Session</Link>
    </section>
  );
}

function RecentActivityPanel() {
  return (
    <section className="command-panel activity-panel">
      <p className="eyebrow">Recent Activity</p>
      <div className="empty-row"><span>LOG</span><div><strong>No recent activity</strong><p>Your recent actions will appear here.</p></div></div>
    </section>
  );
}

function QuickActionsPanel({ onCreate }) {
  return (
    <section className="command-panel">
      <p className="eyebrow">Quick Actions</p>
      <div className="quick-list">
        <button onClick={onCreate}>Create New Campaign<span>&gt;</span></button>
        <Link to="/players">Invite Player<span>&gt;</span></Link>
        <Link to="/sessions">Schedule Session<span>&gt;</span></Link>
        <Link to="/characters">Create Character<span>&gt;</span></Link>
        <Link to="/archive">View Archive<span>&gt;</span></Link>
      </div>
    </section>
  );
}

function DicePanel() {
  const [roll, setRoll] = useState(null);
  return (
    <section className="command-panel dice-panel">
      <p className="eyebrow">Dice Roll</p>
      <div className="dice-row"><div className="die-face">{roll || "20"}</div><div><strong>Roll a D20</strong><p>{roll ? `Result: ${roll}` : "Click the die to roll"}</p></div></div>
      <button onClick={() => setRoll(Math.floor(Math.random() * 20) + 1)}>Roll D20</button>
    </section>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="ghost-button" onClick={onClose}>Close</button>
        </header>
        {children}
      </section>
    </div>
  );
}

function CampaignCardGrid({ campaigns }) {
  return (
    <div className="card-grid">
      {campaigns.map((campaign) => (
        <Link className={`campaign-card ${campaign.status === "archived" ? "is-archived" : ""}`} key={campaign.id} to={`/campaigns/${campaign.id}`}>
          <div className="card-topline">
            <span className={`status-pill ${campaign.status}`}>{campaign.status}</span>
            <span>{titleCase(campaign.setting || "greyhawk")}</span>
          </div>
          <h2>{campaign.name}</h2>
          <p>{campaign.description || "No campaign notes yet."}</p>
          <dl className="campaign-facts">
            <div><dt>Schedule</dt><dd>{campaign.schedule || "Unscheduled"}</dd></div>
            <div><dt>Next</dt><dd>{displayDate(campaign.next_session_date)}</dd></div>
            <div><dt>Session</dt><dd>#{campaign.session_number || 1}</dd></div>
            <div><dt>Day</dt><dd>{campaign.current_campaign_day || 1}</dd></div>
            <div><dt>Players</dt><dd>{campaign.player_count || 0}</dd></div>
            <div><dt>Characters</dt><dd>{campaign.character_count || 0}</dd></div>
          </dl>
        </Link>
      ))}
    </div>
  );
}

function CampaignTabs({ id }) {
  return (
    <nav className="tabs">
      <NavLink end to={`/campaigns/${id}`}>Overview</NavLink>
      <NavLink to={`/campaigns/${id}/players`}>Players</NavLink>
      <NavLink to={`/campaigns/${id}/characters`}>Characters</NavLink>
      <NavLink to={`/campaigns/${id}/notes`}>Notes</NavLink>
    </nav>
  );
}

function CampaignPage() {
  const { id } = useParams();
  const { data: campaign, error, loading, reload } = useLoad(() => api(`/1e/campaigns/${id}`), [id]);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await api(`/1e/campaigns/${id}`, {
        method: "PUT",
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function archiveCampaign() {
    setArchiving(true);
    try {
      await api(`/1e/campaigns/${id}`, { method: "DELETE" });
      await reload();
    } finally {
      setArchiving(false);
    }
  }

  if (loading || error || !campaign) return <PageState loading={loading} error={error} />;
  return (
    <section>
      <CampaignHeader campaign={campaign} id={id} eyebrow="Campaign Workspace" />
      <div className="stats-row">
        <Stat label="Players" value={campaign.player_count || campaign.players?.length || 0} />
        <Stat label="Characters" value={campaign.character_count || campaign.characters?.length || 0} />
        <Stat label="Active PCs" value={campaign.active_characters?.length || 0} />
        <Stat label="Next Session" value={displayDate(campaign.next_session_date)} />
      </div>
      <form className="panel form-grid" onSubmit={save}>
        <label>Name<input name="name" defaultValue={campaign.name} required /></label>
        <label>Setting
          <select name="setting" defaultValue={campaign.setting || "greyhawk"}>
            {SETTINGS.map((setting) => <option key={setting} value={setting}>{titleCase(setting)}</option>)}
          </select>
        </label>
        <label>Schedule<input name="schedule" defaultValue={campaign.schedule || ""} placeholder="Weekly Sundays, 7 PM" /></label>
        <label>Next Session<input name="next_session_date" type="date" defaultValue={campaign.next_session_date || ""} /></label>
        <label>Session #<input name="session_number" type="number" min="1" defaultValue={campaign.session_number || 1} /></label>
        <label>Campaign Day<input name="current_campaign_day" type="number" min="1" defaultValue={campaign.current_campaign_day || 1} /></label>
        <label>Default Location<input name="default_location" defaultValue={campaign.default_location || "Town"} /></label>
        <label>Status
          <select name="status" defaultValue={campaign.status}>
            <option>active</option>
            <option>paused</option>
            <option>archived</option>
          </select>
        </label>
        <label className="wide">Overview Notes<textarea name="description" defaultValue={campaign.description || ""} /></label>
        <div className="form-actions wide">
          <button disabled={saving}>{saving ? "Saving..." : "Save Campaign"}</button>
          <button className="danger-button" type="button" disabled={archiving || campaign.status === "archived"} onClick={archiveCampaign}>
            {campaign.status === "archived" ? "Archived" : archiving ? "Archiving..." : "Archive Campaign"}
          </button>
        </div>
      </form>
    </section>
  );
}

function CampaignPlayersPage() {
  const { id } = useParams();
  const { data: campaign, error, loading, reload } = useLoad(() => api(`/1e/campaigns/${id}`), [id]);
  const { data: players, reload: reloadPlayers } = useLoad(() => api("/1e/players"), []);
  const [createForm, setCreateForm] = useState({ display_name: "", email: "", discord_user_id: "", role: "player", status: "active" });
  const [assignForm, setAssignForm] = useState({ user_id: "", role: "player" });

  async function createPlayer(event) {
    event.preventDefault();
    await api("/1e/players", { method: "POST", body: JSON.stringify(createForm) });
    setCreateForm({ display_name: "", email: "", discord_user_id: "", role: "player", status: "active" });
    await reloadPlayers();
  }

  async function updatePlayer(player, patch) {
    await api(`/1e/players/${player.id}`, { method: "PUT", body: JSON.stringify({ ...player, ...patch }) });
    await reloadPlayers();
    await reload();
  }

  async function assignPlayer(event) {
    event.preventDefault();
    if (!assignForm.user_id) return;
    await api(`/1e/campaigns/${id}/players`, {
      method: "POST",
      body: JSON.stringify({ user_id: Number(assignForm.user_id), role: assignForm.role }),
    });
    setAssignForm({ user_id: "", role: "player" });
    await reload();
  }

  async function removePlayer(userId) {
    await api(`/1e/campaigns/${id}/players/${userId}`, { method: "DELETE" });
    await reload();
  }

  if (loading || error || !campaign) return <PageState loading={loading} error={error} />;
  const members = campaign.players || [];
  const memberIds = new Set(members.map((entry) => entry.user_id));
  const availablePlayers = (players || []).filter((player) => !memberIds.has(player.id));

  return (
    <section>
      <CampaignHeader campaign={campaign} id={id} eyebrow="Campaign Players" />

      <div className="two-column">
        <form className="panel form-grid single-column" onSubmit={createPlayer}>
          <h2 className="panel-title wide">Create Player</h2>
          <label>Display Name<input value={createForm.display_name} onChange={(event) => setCreateForm({ ...createForm, display_name: event.target.value })} required /></label>
          <label>Email<input type="email" value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} /></label>
          <label>Discord User ID<input value={createForm.discord_user_id} onChange={(event) => setCreateForm({ ...createForm, discord_user_id: event.target.value })} /></label>
          <label>Role<select value={createForm.role} onChange={(event) => setCreateForm({ ...createForm, role: event.target.value })}><option>player</option><option>dm</option><option>admin</option></select></label>
          <button>Create Player</button>
        </form>

        <form className="panel form-grid single-column" onSubmit={assignPlayer}>
          <h2 className="panel-title wide">Assign Existing Player</h2>
          <label>Player
            <select value={assignForm.user_id} onChange={(event) => setAssignForm({ ...assignForm, user_id: event.target.value })}>
              <option value="">Choose a player...</option>
              {availablePlayers.map((player) => <option key={player.id} value={player.id}>{player.display_name || player.player_name}</option>)}
            </select>
          </label>
          <label>Campaign Role
            <select value={assignForm.role} onChange={(event) => setAssignForm({ ...assignForm, role: event.target.value })}>
              <option>player</option>
              <option>dm</option>
              <option>observer</option>
            </select>
          </label>
          <button>Assign Player</button>
        </form>
      </div>

      <h2 className="section-title">Campaign Members</h2>
      <DataTable
        columns={["Name", "Email", "Status", "Campaign Role", "Global Role", "Actions"]}
        rows={members.map((entry) => {
          const player = entry.player || {};
          return [
            player.display_name || player.player_name || `Player ${entry.user_id}`,
            player.email || "-",
            <button className={`status-toggle ${player.status || "active"}`} onClick={() => updatePlayer(player, { status: player.status === "inactive" ? "active" : "inactive" })}>{player.status || "active"}</button>,
            entry.role,
            player.role || "player",
            <button className="table-button" onClick={() => removePlayer(entry.user_id)}>Unassign</button>,
          ];
        })}
      />

      <h2 className="section-title">All Players</h2>
      <DataTable
        columns={["Name", "Email", "Discord", "Role", "Status"]}
        rows={(players || []).map((player) => [
          <InlineText value={player.display_name || player.player_name} onSave={(value) => updatePlayer(player, { display_name: value, player_name: value })} />,
          <InlineText value={player.email || ""} placeholder="No email" onSave={(value) => updatePlayer(player, { email: value })} />,
          player.discord_user_id || "-",
          <InlineSelect value={player.role || "player"} options={["player", "dm", "admin"]} onSave={(value) => updatePlayer(player, { role: value })} />,
          <button className={`status-toggle ${player.status || "active"}`} onClick={() => updatePlayer(player, { status: player.status === "inactive" ? "active" : "inactive" })}>{player.status || "active"}</button>,
        ])}
      />
    </section>
  );
}

function CampaignCharactersPage() {
  const { id } = useParams();
  const { data: campaign, error, loading, reload } = useLoad(() => api(`/1e/campaigns/${id}`), [id]);
  const { data: allCharacters } = useLoad(() => api("/1e/characters?include_archived=true"), []);
  const [characterId, setCharacterId] = useState("");

  async function assign(event) {
    event.preventDefault();
    if (!characterId) return;
    await api(`/1e/campaigns/${id}/characters/${characterId}`, { method: "POST" });
    setCharacterId("");
    await reload();
  }

  async function remove(characterIdToRemove) {
    await api(`/1e/campaigns/${id}/characters/${characterIdToRemove}`, { method: "DELETE" });
    await reload();
  }

  if (loading || error || !campaign) return <PageState loading={loading} error={error} />;
  const assignedIds = new Set((campaign.characters || []).map((character) => character.id));
  const available = (allCharacters || []).filter((character) => !assignedIds.has(character.id));

  return (
    <section>
      <CampaignHeader campaign={campaign} id={id} eyebrow="Campaign Characters" />
      <form className="panel form-grid compact" onSubmit={assign}>
        <label className="wide">Assign Existing Character
          <select value={characterId} onChange={(event) => setCharacterId(event.target.value)}>
            <option value="">Choose a character...</option>
            {available.map((character) => <option key={character.id} value={character.id}>{character.name} ({character.race} {character.class_name})</option>)}
          </select>
        </label>
        <button>Assign</button>
      </form>
      <DataTable
        columns={["Name", "Owner", "Race", "Class", "Level", "Status", "Location", "Actions"]}
        rows={(campaign.characters || []).map((character) => [
          character.name,
          character.player?.display_name || character.player?.player_name || "-",
          character.race,
          character.class_name,
          character.level,
          `${character.status} / ${character.life_status}`,
          character.current_location,
          <div className="row-actions">
            <a className="table-link" href={`/1e/characters/${character.id}/`}>View</a>
            <a className="table-link" href={`/1e/characters/${character.id}/edit/`}>Edit</a>
            <button className="table-button" onClick={() => remove(character.id)}>Unassign</button>
          </div>,
        ])}
      />
    </section>
  );
}

function CampaignNotesPage() {
  const { id } = useParams();
  const { data: campaign, error, loading } = useLoad(() => api(`/1e/campaigns/${id}`), [id]);
  if (loading || error || !campaign) return <PageState loading={loading} error={error} />;
  return (
    <section>
      <CampaignHeader campaign={campaign} id={id} eyebrow="Campaign Notes" />
      <div className="panel notes-placeholder">
        <p className="eyebrow">Placeholder</p>
        <h2>Notes are coming next.</h2>
        <p>Use the campaign overview notes for now. Session logs, secrets, factions, and treasure records will get dedicated tools later.</p>
      </div>
    </section>
  );
}

function PlayersPage() {
  const { data: players, error, loading, reload } = useLoad(() => api("/1e/players"), []);

  async function toggle(player) {
    await api(`/1e/players/${player.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...player, status: player.status === "inactive" ? "active" : "inactive" }),
    });
    await reload();
  }

  return (
    <section>
      <PlainHeader eyebrow="Roster" title="Players" copy="Manage the people behind the characters." />
      <PageState loading={loading} error={error} />
      <DataTable
        columns={["Name", "Email", "Discord", "Role", "Status"]}
        rows={(players || []).map((player) => [
          player.display_name || player.player_name,
          player.email || "-",
          player.discord_user_id || "-",
          player.role || "player",
          <button className={`status-toggle ${player.status || "active"}`} onClick={() => toggle(player)}>{player.status || "active"}</button>,
        ])}
      />
    </section>
  );
}

function CharactersPage() {
  const { data: characters, error, loading } = useLoad(() => api("/1e/characters?include_archived=true"), []);
  return (
    <section>
      <PlainHeader eyebrow="Vault" title="Characters" copy="Review campaign characters and jump into the existing character tools." />
      <PageState loading={loading} error={error} />
      <DataTable
        columns={["Name", "Owner", "Race", "Class", "Level", "Status", "Actions"]}
        rows={(characters || []).map((character) => [
          character.name,
          character.player?.display_name || character.player?.player_name || "-",
          character.race,
          character.class_name,
          character.level,
          `${character.status} / ${character.life_status}`,
          <div className="row-actions">
            <a className="table-link" href={`/1e/characters/${character.id}/`}>View</a>
            <a className="table-link" href={`/1e/characters/${character.id}/edit/`}>Edit</a>
          </div>,
        ])}
      />
    </section>
  );
}

function PlaceholderPage({ eyebrow, title, copy }) {
  return (
    <section>
      <PlainHeader eyebrow={eyebrow} title={title} copy={copy} />
      <div className="command-panel notes-placeholder">
        <p className="eyebrow">Placeholder</p>
        <h2>{title} tools are coming next.</h2>
        <p>{copy}</p>
      </div>
    </section>
  );
}

function ArchivePage() {
  const { data: campaigns, error, loading } = useLoad(() => api("/1e/campaigns?include_archived=true"), []);
  const archived = (campaigns || []).filter((campaign) => campaign.status === "archived");
  return (
    <section>
      <PlainHeader eyebrow="Records" title="Archive" copy="Archived campaigns remain available for review." />
      <PageState loading={loading} error={error} />
      <CampaignCardGrid campaigns={archived} />
    </section>
  );
}

function PlainHeader({ eyebrow, title, copy }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{copy}</p>
      </div>
    </header>
  );
}

function CampaignHeader({ campaign, id, eyebrow }) {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{campaign.name}</h1>
          <p className="lede">{titleCase(campaign.setting || "greyhawk")} | Session #{campaign.session_number || 1} | Day {campaign.current_campaign_day || 1}</p>
        </div>
        <Link className="secondary-button" to="/campaigns">All Campaigns</Link>
      </header>
      <CampaignTabs id={id} />
    </>
  );
}

function InlineText({ value, placeholder = "Empty", onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  if (!editing) {
    return <button className="inline-edit" onClick={() => setEditing(true)}>{value || placeholder}</button>;
  }
  return (
    <form className="inline-form" onSubmit={(event) => { event.preventDefault(); setEditing(false); onSave(draft); }}>
      <input value={draft} onChange={(event) => setDraft(event.target.value)} />
      <button>Save</button>
    </form>
  );
}

function InlineSelect({ value, options, onSave }) {
  return (
    <select className="inline-select" value={value} onChange={(event) => onSave(event.target.value)}>
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  );
}

function Stat({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
          )) : <tr><td colSpan={columns.length}>No records yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Protected><Shell /></Protected>}>
          <Route path="/" element={<Navigate to="/campaigns" replace />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/:id" element={<CampaignPage />} />
          <Route path="/campaigns/:id/players" element={<CampaignPlayersPage />} />
          <Route path="/campaigns/:id/characters" element={<CampaignCharactersPage />} />
          <Route path="/campaigns/:id/notes" element={<CampaignNotesPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/sessions" element={<PlaceholderPage eyebrow="Calendar" title="Sessions" copy="Session scheduling will live here. For now, use campaign next-session fields." />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/settings" element={<PlaceholderPage eyebrow="Portal" title="Settings" copy="Portal preferences and account controls will live here." />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
