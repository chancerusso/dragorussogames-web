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
          <NavLink to="/campaigns">Campaigns</NavLink>
        </nav>
        <button className="ghost-button" onClick={signOut}>Sign Out</button>
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
      await reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <header className="page-header dashboard-header">
        <div>
          <p className="eyebrow">Campaign Command</p>
          <h1>DM Dashboard</h1>
          <p className="lede">Create campaigns, assign players, and keep the table roster ready for play.</p>
        </div>
        <div className="summary-strip">
          <Stat label="Active Campaigns" value={activeCampaigns.length} />
          <Stat label="Archived" value={archivedCampaigns.length} />
          <Stat label="Characters" value={campaigns.reduce((total, campaign) => total + Number(campaign.character_count || 0), 0)} />
        </div>
      </header>

      <form className="panel form-grid dashboard-create" onSubmit={createCampaign}>
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
        <button disabled={saving}>{saving ? "Creating..." : "Create Campaign"}</button>
      </form>

      <PageState loading={loading} error={error} />
      <CampaignCardGrid campaigns={activeCampaigns} />
      {archivedCampaigns.length ? (
        <>
          <h2 className="section-title">Archived</h2>
          <CampaignCardGrid campaigns={archivedCampaigns} />
        </>
      ) : null}
    </section>
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
        </Route>
      </Routes>
    </AuthProvider>
  );
}
