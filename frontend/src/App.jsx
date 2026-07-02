import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { api, getToken, login, logout } from "./api.js";

const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
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
            <small>First Edition</small>
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
  const [form, setForm] = useState({ name: "", default_location: "Town", description: "" });
  const [saving, setSaving] = useState(false);

  async function createCampaign(event) {
    event.preventDefault();
    setSaving(true);
    await api("/1e/campaigns", { method: "POST", body: JSON.stringify(form) });
    setForm({ name: "", default_location: "Town", description: "" });
    setSaving(false);
    reload();
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Campaign Command</p>
          <h1>Campaigns</h1>
        </div>
      </header>
      <form className="panel form-grid" onSubmit={createCampaign}>
        <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Default Location<input value={form.default_location} onChange={(e) => setForm({ ...form, default_location: e.target.value })} /></label>
        <label className="wide">Notes<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <button disabled={saving}>{saving ? "Creating..." : "Create Campaign"}</button>
      </form>
      <PageState loading={loading} error={error} />
      <div className="card-grid">
        {(data || []).map((campaign) => (
          <Link className="campaign-card" key={campaign.id} to={`/campaigns/${campaign.id}`}>
            <span>{campaign.status}</span>
            <h2>{campaign.name}</h2>
            <p>{campaign.description || "No campaign notes yet."}</p>
            <dl>
              <div><dt>Day</dt><dd>{campaign.current_campaign_day}</dd></div>
              <div><dt>Base</dt><dd>{campaign.default_location}</dd></div>
              <div><dt>Characters</dt><dd>{campaign.character_count}</dd></div>
            </dl>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CampaignTabs({ id }) {
  return (
    <nav className="tabs">
      <NavLink end to={`/campaigns/${id}`}>Overview</NavLink>
      <NavLink to={`/campaigns/${id}/players`}>Players</NavLink>
      <NavLink to={`/campaigns/${id}/characters`}>Characters</NavLink>
    </nav>
  );
}

function CampaignPage() {
  const { id } = useParams();
  const { data: campaign, error, loading, reload } = useLoad(() => api(`/1e/campaigns/${id}`), [id]);
  const [saving, setSaving] = useState(false);

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    await api(`/1e/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    setSaving(false);
    reload();
  }

  if (loading || error || !campaign) return <PageState loading={loading} error={error} />;
  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Campaign Workspace</p>
          <h1>{campaign.name}</h1>
        </div>
        <Link className="secondary-button" to="/campaigns">All Campaigns</Link>
      </header>
      <CampaignTabs id={id} />
      <div className="stats-row">
        <Stat label="Players" value={campaign.players?.length || 0} />
        <Stat label="Characters" value={campaign.characters?.length || 0} />
        <Stat label="Active" value={campaign.active_characters?.length || 0} />
        <Stat label="Storage" value={campaign.safe_storage_locations?.length || 0} />
      </div>
      <form className="panel form-grid" onSubmit={save}>
        <label>Name<input name="name" defaultValue={campaign.name} required /></label>
        <label>Current Day<input name="current_campaign_day" type="number" min="1" defaultValue={campaign.current_campaign_day} /></label>
        <label>Default Location<input name="default_location" defaultValue={campaign.default_location} /></label>
        <label>Status<select name="status" defaultValue={campaign.status}><option>active</option><option>paused</option><option>archived</option></select></label>
        <label className="wide">Notes<textarea name="description" defaultValue={campaign.description || ""} /></label>
        <button disabled={saving}>{saving ? "Saving..." : "Save Campaign"}</button>
      </form>
    </section>
  );
}

function CampaignPlayersPage() {
  const { id } = useParams();
  const { data: campaign, error, loading, reload } = useLoad(() => api(`/1e/campaigns/${id}`), [id]);
  const [form, setForm] = useState({ display_name: "", email: "", discord_user_id: "", role: "player" });

  async function addPlayer(event) {
    event.preventDefault();
    await api(`/1e/campaigns/${id}/players`, { method: "POST", body: JSON.stringify(form) });
    setForm({ display_name: "", email: "", discord_user_id: "", role: "player" });
    reload();
  }

  async function removePlayer(userId) {
    await api(`/1e/campaigns/${id}/players/${userId}`, { method: "DELETE" });
    reload();
  }

  if (loading || error || !campaign) return <PageState loading={loading} error={error} />;
  return (
    <section>
      <PageTitle campaign={campaign} id={id} title="Players" />
      <form className="panel form-grid" onSubmit={addPlayer}>
        <label>Display Name<input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Discord User ID<input value={form.discord_user_id} onChange={(e) => setForm({ ...form, discord_user_id: e.target.value })} /></label>
        <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>player</option><option>dm</option><option>observer</option></select></label>
        <button>Add Player</button>
      </form>
      <DataTable
        columns={["Name", "Email", "Discord", "Role", ""]}
        rows={(campaign.players || []).map((entry) => [
          entry.player?.display_name || entry.player?.player_name || `Player ${entry.user_id}`,
          entry.player?.email || "-",
          entry.player?.discord_user_id || "-",
          entry.role,
          <button className="table-button" onClick={() => removePlayer(entry.user_id)}>Remove</button>,
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
    reload();
  }

  async function remove(characterIdToRemove) {
    await api(`/1e/campaigns/${id}/characters/${characterIdToRemove}`, { method: "DELETE" });
    reload();
  }

  if (loading || error || !campaign) return <PageState loading={loading} error={error} />;
  const assignedIds = new Set((campaign.characters || []).map((character) => character.id));
  const available = (allCharacters || []).filter((character) => !assignedIds.has(character.id));
  return (
    <section>
      <PageTitle campaign={campaign} id={id} title="Characters" />
      <form className="panel form-grid compact" onSubmit={assign}>
        <label className="wide">Assign Existing Character
          <select value={characterId} onChange={(e) => setCharacterId(e.target.value)}>
            <option value="">Choose a character...</option>
            {available.map((character) => <option key={character.id} value={character.id}>{character.name} ({character.race} {character.class_name})</option>)}
          </select>
        </label>
        <button>Assign</button>
      </form>
      <DataTable
        columns={["Name", "Player", "Race", "Class", "Level", "Status", "Location", ""]}
        rows={(campaign.characters || []).map((character) => [
          character.name,
          character.owner_name || character.player?.display_name || "-",
          character.race,
          character.class_name,
          character.level,
          `${character.status} / ${character.life_status}`,
          character.current_location,
          <button className="table-button" onClick={() => remove(character.id)}>Remove</button>,
        ])}
      />
    </section>
  );
}

function PageTitle({ campaign, id, title }) {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{campaign.name}</p>
          <h1>{title}</h1>
        </div>
      </header>
      <CampaignTabs id={id} />
    </>
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
        </Route>
      </Routes>
    </AuthProvider>
  );
}
