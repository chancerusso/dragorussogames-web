import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, getPlayerToken, getToken, login, logout, playerLogin, playerLogout } from "./api.js";

const AuthContext = createContext(null);
const PlayerPortalContext = createContext(null);
const SETTINGS = ["dragonlance", "greyhawk"];
const PLAYER_TABS = [
  ["overview", "Overview"],
  ["character", "My Character"],
  ["players", "Party"],
  ["journal", "Journal"],
  ["handouts", "Handouts"],
  ["rules", "Rules"],
];

function useAuth() {
  return useContext(AuthContext);
}

function usePlayerPortal() {
  return useContext(PlayerPortalContext);
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
  const [playerToken, setPlayerTokenState] = useState(getPlayerToken());
  const value = useMemo(
    () => ({
      authed: Boolean(token),
      playerAuthed: Boolean(playerToken),
      refresh: () => setTokenState(getToken()),
      refreshPlayer: () => setPlayerTokenState(getPlayerToken()),
      signOut: async () => {
        await logout();
        setTokenState(null);
      },
      signOutPlayer: () => {
        playerLogout();
        setPlayerTokenState(null);
      },
    }),
    [token, playerToken],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function Protected({ children, role = "admin" }) {
  const auth = useAuth();
  const location = useLocation();
  const authed = role === "player" ? auth.playerAuthed : auth.authed;
  return authed ? children : <Navigate to={role === "player" ? "/portal/login" : "/login"} replace state={{ from: location.pathname }} />;
}

function HomeRedirect() {
  return <Navigate to={window.location.hostname.startsWith("portal.") ? "/portal" : "/campaigns"} replace />;
}

function AppSidebar({ mode, title, subtitle, brandTo, navItems, account, onSignOut }) {
  return (
    <aside className={`sidebar ${mode === "player" ? "player-sidebar" : ""}`}>
      <Link className="brand" to={brandTo}>
        <span className="brand-mark">DRG</span>
        <span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
      </Link>
      <nav>
        {navItems.map((item) => (
          item.href ? (
            <a key={item.label} href={item.href}>{item.label}</a>
          ) : (
            <NavLink key={item.label} end={item.end} to={item.to}>{item.label}</NavLink>
          )
        ))}
      </nav>
      <div className="sidebar-footer">
        <PortalSwitcher mode={mode} />
        {account}
        <button className="ghost-button" onClick={onSignOut}>Sign Out</button>
      </div>
    </aside>
  );
}

function PortalSwitcher({ mode }) {
  if (mode === "dm") {
    return (
      <div className="portal-switcher">
        <span>Portal</span>
        <Link to="/portal">View Dragonlance Portal</Link>
      </div>
    );
  }
  return (
    <div className="portal-switcher">
      <span>Portal</span>
      <strong>Dragonlance Portal</strong>
    </div>
  );
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
      <AppSidebar
        mode="dm"
        title="DM Portal"
        subtitle="Campaign Command"
        brandTo="/campaigns"
        navItems={[
          { label: "Command Center", to: "/campaigns" },
          { label: "Campaigns", href: "/campaigns#active-campaigns" },
          { label: "Players", to: "/players" },
          { label: "Characters", to: "/characters" },
          { label: "Archive", to: "/archive" },
          { label: "Settings", to: "/settings" },
        ]}
        account={<small>DM Account</small>}
        onSignOut={signOut}
      />
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

function PlayerShell() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { data: activePlayer, error } = useLoad(() => api("/player/me", { auth: "player" }), []);

  async function signOut() {
    auth.signOutPlayer();
    navigate("/portal/login");
  }

  const context = useMemo(
    () => ({ activePlayerId: activePlayer?.id ? String(activePlayer.id) : "", activePlayer }),
    [activePlayer],
  );

  return (
    <PlayerPortalContext.Provider value={context}>
      <div className="app-shell player-shell">
        <AppSidebar
          mode="player"
          title="Dragonlance Portal"
          subtitle="Dragonlance Campaigns"
          brandTo="/portal"
        navItems={[
            { label: "My Campaigns", to: "/portal", end: true },
            { label: "Dragonlance Rules", href: "/1e/" },
            { label: "Create Character", href: "/1e/characters/new/" },
          ]}
          account={
            <div className="account-card">
              <span>Logged in as:</span>
              <strong>{error ? "Unavailable" : activePlayer?.display_name || activePlayer?.player_name || "Player Name"}</strong>
              <span>Role:</span>
              <strong>Player</strong>
              {error ? <small className="error">{error}</small> : null}
            </div>
          }
          onSignOut={signOut}
        />
        <main className="content player-content">
          <Outlet />
        </main>
      </div>
    </PlayerPortalContext.Provider>
  );
}

function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(password);
      auth.refresh();
      navigate(location.state?.from || (window.location.hostname.startsWith("portal.") ? "/portal" : "/campaigns"));
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

function PlayerLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await playerLogin(username, password);
      auth.refreshPlayer();
      navigate(location.state?.from || "/portal");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page dragonlance-login">
      <form className="login-panel" onSubmit={submit}>
        <div className="dragonlance-mark">DL</div>
        <p className="eyebrow">Dragonlance</p>
        <h1>Dragonlance Portal</h1>
        <label>
          Username
          <input autoFocus value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button disabled={busy}>{busy ? "Opening..." : "Enter Dragonlance"}</button>
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
  const { data: players } = useLoad(() => api("/1e/players"), []);
  const { data: characters } = useLoad(() => api("/1e/characters?include_archived=true"), []);
  const [createOpen, setCreateOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    setting: "dragonlance",
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
    setFormError("");
    try {
      await api("/1e/campaigns", { method: "POST", body: JSON.stringify(form) });
      setForm({
        name: "",
        setting: "dragonlance",
        schedule: "",
        next_session_date: "",
        session_number: 1,
        current_campaign_day: 1,
        description: "",
      });
      setCreateOpen(false);
      await reload();
    } catch (err) {
      setFormError(err.message);
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
          <p className="lede">Manage campaigns, players, and characters from one quiet command center.</p>
          <div className="hero-actions">
            <a className="secondary-button" href="/portal" target="_blank" rel="noreferrer">Player View</a>
          </div>
        </div>
        <div className="summary-strip hero-stats">
          <StatCard label="Campaigns" value={activeCampaigns.length} />
          <StatCard label="Players" value={(players || []).length} />
          <StatCard label="Characters" value={(characters || []).filter((character) => character.status !== "archived").length} />
        </div>
      </div>

      <PageState loading={loading} error={error} />

      <div className="action-grid">
        <ActionCard tone="red" title="Campaigns" copy="Create, review, and prepare campaign workspaces." action="Create Campaign" onClick={() => setCreateOpen(true)} />
        <ActionCard tone="green" title="Players" copy="Manage the table roster and campaign membership." action="Manage Players" to="/players" />
        <ActionCard tone="blue" title="Characters" copy="Review characters and open the existing sheet tools." action="View Characters" to="/characters" />
      </div>

      <div className="command-grid" id="active-campaigns">
        <ActiveCampaignPanel campaign={activeCampaigns[0]} onCreate={() => setCreateOpen(true)} />
        <ArchiveSummaryPanel campaigns={archivedCampaigns} />
      </div>

      {activeCampaigns.length > 1 ? (
        <>
          <h2 className="section-title">Active Campaigns</h2>
          <CampaignCardGrid campaigns={activeCampaigns.slice(1)} />
        </>
      ) : null}

      {createOpen ? (
        <Modal title="Create Campaign" onClose={() => setCreateOpen(false)}>
          <form className="form-grid dashboard-create modal-form" onSubmit={createCampaign}>
            <label className="wide primary-field">Campaign Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label className="setting-field">Setting
              <select value={form.setting} onChange={(event) => setForm({ ...form, setting: event.target.value })}>
                {SETTINGS.map((setting) => <option key={setting} value={setting}>{titleCase(setting)}</option>)}
              </select>
            </label>
            <label>Schedule<input placeholder="Weekly Sundays, 7 PM" value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} /></label>
            <label>Next Session<input type="date" value={form.next_session_date} onChange={(event) => setForm({ ...form, next_session_date: event.target.value })} /></label>
            <label>Session #<input type="number" min="1" value={form.session_number} onChange={(event) => setForm({ ...form, session_number: event.target.value })} /></label>
            <label>Campaign Day<input type="number" min="1" value={form.current_campaign_day} onChange={(event) => setForm({ ...form, current_campaign_day: event.target.value })} /></label>
            <label className="wide">Notes<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            {formError ? <p className="error wide">{formError}</p> : null}
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

function ActionCard({ tone, title, copy, action, to, onClick }) {
  const content = (
    <>
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

function ArchiveSummaryPanel({ campaigns }) {
  return (
    <section className="command-panel archive-summary">
      <p className="eyebrow">Archive</p>
      <h2>{campaigns.length} archived campaign{campaigns.length === 1 ? "" : "s"}</h2>
      <p>Older campaigns stay available without crowding the command center.</p>
      <Link className="wide-command" to="/archive">View Archive</Link>
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
        <CampaignCard key={campaign.id} campaign={campaign} variant="dm" />
      ))}
    </div>
  );
}

function CampaignCard({ campaign, variant = "dm", character }) {
  const isPlayer = variant === "player";
  return (
    <Link className={`campaign-card ${campaign.status === "archived" ? "is-archived" : ""}`} to={isPlayer ? `/portal/campaigns/${campaign.id}` : `/campaigns/${campaign.id}`}>
      <div className="card-topline">
        <span>{isPlayer ? "Campaign" : "Campaign"}</span>
        <span>{titleCase(campaign.setting || "greyhawk")}</span>
      </div>
      <h2>{campaign.name}</h2>
      <dl className="campaign-facts">
        {isPlayer ? (
          <>
            <div><dt>My Character</dt><dd>{character?.name || "No character assigned"}</dd></div>
            <div><dt>Next Session</dt><dd>{displayDate(campaign.next_session_date)}</dd></div>
          </>
        ) : (
          <>
            <div><dt>Players</dt><dd>{campaign.player_count || campaign.players?.length || 0}</dd></div>
            <div><dt>Characters</dt><dd>{campaign.character_count || campaign.characters?.length || 0}</dd></div>
            <div><dt>Next Session</dt><dd>{displayDate(campaign.next_session_date)}</dd></div>
            <div><dt>Session Number</dt><dd>#{campaign.session_number || 1}</dd></div>
          </>
        )}
      </dl>
      <span className="action-button">{isPlayer ? "Open" : "Edit"}</span>
    </Link>
  );
}

const WORKSPACE_TABS = [
  ["overview", "Overview"],
  ["players", "Players"],
  ["characters", "Characters"],
  ["session-notes", "Session Notes"],
  ["journal", "Journal"],
  ["npcs", "NPCs"],
  ["treasure", "Treasure"],
  ["handouts", "Handouts"],
  ["settings", "Settings"],
];

function CampaignTabs({ activeTab, onChange }) {
  return <Tabs tabs={WORKSPACE_TABS} activeTab={activeTab} onChange={onChange} />;
}

function CampaignWorkspace({ initialTab = "overview" }) {
  const { id } = useParams();
  const { data: campaign, error, loading, reload } = useLoad(() => api(`/1e/campaigns/${id}`), [id]);
  const { data: players, reload: reloadPlayers } = useLoad(() => api("/1e/players"), []);
  const { data: allCharacters } = useLoad(() => api("/1e/characters?include_archived=true"), []);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [workspaceError, setWorkspaceError] = useState("");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, id]);

  async function refreshWorkspace() {
    await reload();
    if (reloadPlayers) await reloadPlayers();
  }

  if (loading || error || !campaign) return <PageState loading={loading} error={error} />;
  return (
    <section className="campaign-workspace">
      <CampaignHeader campaign={campaign} eyebrow="Campaign Workspace" />
      <CampaignTabs activeTab={activeTab} onChange={setActiveTab} />
      {workspaceError ? <p className="error">{workspaceError}</p> : null}
      {activeTab === "overview" ? <CampaignOverviewTab campaign={campaign} /> : null}
      {activeTab === "players" ? (
        <CampaignPlayersTab
          campaign={campaign}
          players={players || []}
          onError={setWorkspaceError}
          onReload={refreshWorkspace}
        />
      ) : null}
      {activeTab === "characters" ? (
        <CampaignCharactersTab
          campaign={campaign}
          allCharacters={allCharacters || []}
          onError={setWorkspaceError}
          onReload={reload}
        />
      ) : null}
      {activeTab === "session-notes" ? <PlaceholderPanel title="Session Notes" copy="Session prep, recap, and table notes will live here in the next pass." /> : null}
      {activeTab === "journal" ? <PlaceholderPanel title="Journal" copy="Campaign chronology and adventure logs will live here." /> : null}
      {activeTab === "npcs" ? <PlaceholderPanel title="NPCs" copy="Important contacts, rivals, factions, and hirelings will live here." /> : null}
      {activeTab === "treasure" ? <PlaceholderPanel title="Treasure" copy="Party treasure, claims, and discovered hoards will live here." /> : null}
      {activeTab === "handouts" ? <PlaceholderPanel title="Handouts" copy="Maps, letters, clues, and player-facing files will live here." /> : null}
      {activeTab === "settings" ? <CampaignSettingsTab campaign={campaign} onError={setWorkspaceError} onReload={reload} /> : null}
    </section>
  );
}

function CampaignOverviewTab({ campaign }) {
  return (
    <div className="workspace-grid">
      <section className="panel workspace-panel">
        <p className="eyebrow">Overview</p>
        <h2>{campaign.name}</h2>
        <dl className="detail-list">
          <div><dt>Setting</dt><dd>{titleCase(campaign.setting || "greyhawk")}</dd></div>
          <div><dt>Status</dt><dd>{campaign.status || "active"}</dd></div>
          <div><dt>Schedule</dt><dd>{campaign.schedule || "Unscheduled"}</dd></div>
          <div><dt>Next Session</dt><dd>{displayDate(campaign.next_session_date)}</dd></div>
          <div><dt>Session Number</dt><dd>#{campaign.session_number || 1}</dd></div>
          <div><dt>Campaign Day</dt><dd>{campaign.current_campaign_day || 1}</dd></div>
        </dl>
      </section>
      <section className="panel workspace-panel">
        <p className="eyebrow">Table State</p>
        <div className="stats-row compact-stats">
          <StatCard label="Players" value={campaign.player_count || campaign.players?.length || 0} />
          <StatCard label="Characters" value={campaign.character_count || campaign.characters?.length || 0} />
          <StatCard label="Active PCs" value={campaign.active_characters?.length || 0} />
        </div>
        <div className="notes-box">
          <strong>Notes</strong>
          <p>{campaign.description || "No campaign notes yet."}</p>
        </div>
      </section>
    </div>
  );
}

function CampaignPlayersTab({ campaign, players, onError, onReload }) {
  const [assignForm, setAssignForm] = useState({ user_id: "", role: "player" });

  async function assignPlayer(event) {
    event.preventDefault();
    if (!assignForm.user_id) return;
    onError("");
    try {
      await api(`/1e/campaigns/${campaign.id}/players`, {
        method: "POST",
        body: JSON.stringify({ user_id: Number(assignForm.user_id), role: assignForm.role }),
      });
      setAssignForm({ user_id: "", role: "player" });
      await onReload();
    } catch (err) {
      onError(err.message);
    }
  }

  async function removePlayer(userId) {
    onError("");
    try {
      await api(`/1e/campaigns/${campaign.id}/players/${userId}`, { method: "DELETE" });
      await onReload();
    } catch (err) {
      onError(err.message);
    }
  }

  const members = campaign.players || [];
  const memberIds = new Set(members.map((entry) => entry.user_id));
  const availablePlayers = players.filter((player) => !memberIds.has(player.id));

  return (
    <>
      <form className="panel form-grid compact workspace-form" onSubmit={assignPlayer}>
        <div className="form-heading wide">
          <p className="eyebrow">Roster</p>
          <h2>Assign Existing Player</h2>
        </div>
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

      <h2 className="section-title">Campaign Members</h2>
      <DataTable
        columns={["Name", "Username", "Character", "Status", "Campaign Role", "Actions"]}
        rows={members.map((entry) => {
          const player = entry.player || {};
          const character = (campaign.characters || []).find((item) => item.user_id === entry.user_id);
          return [
            player.display_name || player.player_name || `Player ${entry.user_id}`,
            player.username || "-",
            character?.name || "-",
            player.active === false ? "inactive" : player.status || "active",
            entry.role,
            <button className="table-button" onClick={() => removePlayer(entry.user_id)}>Unassign</button>,
          ];
        })}
      />
    </>
  );
}

function CampaignCharactersTab({ campaign, allCharacters, onError, onReload }) {
  const [characterId, setCharacterId] = useState("");

  async function assign(event) {
    event.preventDefault();
    if (!characterId) return;
    onError("");
    try {
      await api(`/1e/campaigns/${campaign.id}/characters/${characterId}`, { method: "POST" });
      setCharacterId("");
      await onReload();
    } catch (err) {
      onError(err.message);
    }
  }

  async function remove(characterIdToRemove) {
    onError("");
    try {
      await api(`/1e/campaigns/${campaign.id}/characters/${characterIdToRemove}`, { method: "DELETE" });
      await onReload();
    } catch (err) {
      onError(err.message);
    }
  }

  const assignedIds = new Set((campaign.characters || []).map((character) => character.id));
  const available = allCharacters.filter((character) => !assignedIds.has(character.id));

  return (
    <>
      <form className="panel form-grid compact workspace-form" onSubmit={assign}>
        <div className="form-heading wide">
          <p className="eyebrow">Vault</p>
          <h2>Assign Existing Character</h2>
        </div>
        <label className="wide">Assign Existing Character
          <select value={characterId} onChange={(event) => setCharacterId(event.target.value)}>
            <option value="">Choose a character...</option>
            {available.map((character) => <option key={character.id} value={character.id}>{character.name} ({character.race} {character.class_name})</option>)}
          </select>
        </label>
        <button>Assign</button>
      </form>
      <h2 className="section-title">Campaign Characters</h2>
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
    </>
  );
}

function CampaignSettingsTab({ campaign, onError, onReload }) {
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onError("");
    setSaving(true);
    try {
      await api(`/1e/campaigns/${campaign.id}`, {
        method: "PUT",
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      await onReload();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function archiveCampaign() {
    onError("");
    setArchiving(true);
    try {
      await api(`/1e/campaigns/${campaign.id}`, { method: "DELETE" });
      await onReload();
    } catch (err) {
      onError(err.message);
    } finally {
      setArchiving(false);
    }
  }

  return (
    <form className="panel form-grid settings-form" onSubmit={save}>
      <div className="form-heading wide">
        <p className="eyebrow">Campaign Settings</p>
        <h2>Edit Metadata</h2>
      </div>
      <label className="wide primary-field">Campaign Name<input name="name" defaultValue={campaign.name} required /></label>
      <label>Setting
        <select name="setting" defaultValue={campaign.setting || "greyhawk"}>
          {SETTINGS.map((setting) => <option key={setting} value={setting}>{titleCase(setting)}</option>)}
        </select>
      </label>
      <label>Status
        <select name="status" defaultValue={campaign.status}>
          <option>active</option>
          <option>paused</option>
          <option>archived</option>
        </select>
      </label>
      <label>Schedule<input name="schedule" defaultValue={campaign.schedule || ""} placeholder="Weekly Sundays, 7 PM" /></label>
      <label>Next Session<input name="next_session_date" type="date" defaultValue={campaign.next_session_date || ""} /></label>
      <label>Session #<input name="session_number" type="number" min="1" defaultValue={campaign.session_number || 1} /></label>
      <label>Campaign Day<input name="current_campaign_day" type="number" min="1" defaultValue={campaign.current_campaign_day || 1} /></label>
      <label className="wide">Overview Notes<textarea name="description" defaultValue={campaign.description || ""} /></label>
      <div className="form-actions wide">
        <button disabled={saving}>{saving ? "Saving..." : "Save Campaign"}</button>
        <button className="danger-button" type="button" disabled={archiving || campaign.status === "archived"} onClick={archiveCampaign}>
          {campaign.status === "archived" ? "Archived" : archiving ? "Archiving..." : "Archive Campaign"}
        </button>
      </div>
    </form>
  );
}

function PlaceholderPanel({ title, copy }) {
  return (
    <Panel className="notes-placeholder">
      <p className="eyebrow">Placeholder</p>
      <h2>{title}</h2>
      <p>{copy}</p>
    </Panel>
  );
}

function PlayerCampaignsPage() {
  const { activePlayerId, activePlayer } = usePlayerPortal();
  const navigate = useNavigate();
  const { data, error, loading } = useLoad(() => api("/player/campaigns", { auth: "player" }), []);

  useEffect(() => {
    if (!loading && data?.length === 1) {
      navigate(`/portal/campaigns/${data[0].id}`, { replace: true });
    }
  }, [data, loading, navigate]);

  return (
    <section className="player-portal-page">
      <PlayerHero
        eyebrow="Dragonlance"
        title="My Campaigns"
        copy={activePlayer ? `Welcome to Dragonlance, ${activePlayer.display_name || activePlayer.player_name}.` : "Sign in to see your Dragonlance campaigns."}
      />
      <PageState loading={loading} error={error} />
      <div className="card-grid player-campaign-grid">
        {(data || []).map((campaign) => {
          const character = campaign.my_character || playerCharacterForCampaign(campaign, activePlayerId);
          return <CampaignCard key={campaign.id} campaign={campaign} variant="player" character={character} />;
        })}
      </div>
      {!loading && !error && data?.length === 0 ? (
        <div className="panel notes-placeholder">
          <p className="eyebrow">No Campaigns</p>
          <h2>No active campaign memberships found.</h2>
          <p>Ask your DM to add this player profile to a campaign.</p>
        </div>
      ) : null}
    </section>
  );
}

function PlayerCampaignHome() {
  const { id } = useParams();
  const { activePlayerId } = usePlayerPortal();
  const { data: campaign, error, loading } = useLoad(() => api(`/player/campaigns/${id}`, { auth: "player" }), [id]);
  const [activeTab, setActiveTab] = useState("overview");

  if (loading || error || !campaign) return <PageState loading={loading} error={error} />;

  const character = campaign.my_character || playerCharacterForCampaign(campaign, activePlayerId);

  return (
    <section className="player-portal-page">
      <CampaignHeader campaign={campaign} eyebrow="Campaign Home" />
      <PlayerTabs activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === "overview" ? <PlayerOverviewTab campaign={campaign} /> : null}
      {activeTab === "character" ? <PlayerCharacterTab character={character} /> : null}
      {activeTab === "players" ? <PlayerRosterTab campaign={campaign} /> : null}
      {activeTab === "journal" ? <ReadOnlyPlaceholder title="Journal" copy="Read-only session summaries will appear here once the journal backend exists." /> : null}
      {activeTab === "handouts" ? <ReadOnlyPlaceholder title="Handouts" copy="Read-only campaign handouts, maps, and clues will appear here once uploaded." /> : null}
      {activeTab === "rules" ? <PlayerRulesTab campaign={campaign} /> : null}
    </section>
  );
}

function PlayerTabs({ activeTab, onChange }) {
  return <Tabs tabs={PLAYER_TABS} activeTab={activeTab} onChange={onChange} className="player-tabs" />;
}

function PlayerOverviewTab({ campaign }) {
  return (
    <div className="workspace-grid">
      <section className="panel workspace-panel">
        <p className="eyebrow">Overview</p>
        <h2>{campaign.name}</h2>
        <p className="portal-copy">{campaign.description || "No campaign description has been posted yet."}</p>
      </section>
      <section className="panel workspace-panel">
        <p className="eyebrow">Session</p>
        <dl className="detail-list">
          <div><dt>Schedule</dt><dd>{campaign.schedule || "Unscheduled"}</dd></div>
          <div><dt>Next Session</dt><dd>{displayDate(campaign.next_session_date)}</dd></div>
          <div><dt>Current Adventure</dt><dd>{campaign.default_location || "Not recorded yet"}</dd></div>
          <div><dt>Session Number</dt><dd>#{campaign.session_number || 1}</dd></div>
        </dl>
      </section>
    </div>
  );
}

function PlayerCharacterTab({ character }) {
  if (!character) {
    return (
      <Panel className="notes-placeholder read-only-panel">
        <p className="eyebrow">Dragonlance Character</p>
        <h2>No character assigned yet.</h2>
        <p>Launch the existing Character Vault to create your Dragonlance character.</p>
        <div className="form-actions">
          <a className="secondary-button" href="/1e/characters/new/">Create Character</a>
        </div>
      </Panel>
    );
  }
  return (
    <section className="panel workspace-panel character-summary">
        <p className="eyebrow">Dragonlance Character</p>
      <h2>{character.name}</h2>
      <dl className="detail-list">
        <div><dt>Race</dt><dd>{character.race}</dd></div>
        <div><dt>Class</dt><dd>{character.class_name}</dd></div>
        <div><dt>Level</dt><dd>{character.level}</dd></div>
        <div><dt>Status</dt><dd>{character.status} / {character.life_status}</dd></div>
        <div><dt>Location</dt><dd>{character.current_location || "-"}</dd></div>
        <div><dt>XP</dt><dd>{character.xp || 0}</dd></div>
      </dl>
      <div className="form-actions">
        <a className="secondary-button" href={`/1e/characters/${character.id}/`}>View Character</a>
        <a className="table-link" href={`/1e/characters/${character.id}/edit/`}>Edit in Vault</a>
      </div>
    </section>
  );
}

function PlayerRosterTab({ campaign }) {
  return (
    <>
      <h2 className="section-title">Dragonlance Party</h2>
      <DataTable
        columns={["Player", "Campaign Role", "Character", "Class", "Level", "Status"]}
        rows={(campaign.players || []).map((entry) => {
          const player = entry.player || {};
          const character = (campaign.characters || []).find((item) => item.user_id === entry.user_id);
          return [
            player.display_name || player.player_name || `Player ${entry.user_id}`,
            entry.role,
            character?.name || "-",
            character?.class_name || "-",
            character?.level || "-",
            character ? `${character.status} / ${character.life_status}` : "-",
          ];
        })}
      />
    </>
  );
}

function PlayerRulesTab({ campaign }) {
  const setting = campaign.setting || "greyhawk";
  return (
    <div className="rule-link-grid">
      <a className="panel rule-card" href="/1e/">
        <p className="eyebrow">Dragonlance</p>
        <h2>Player Rules</h2>
        <p>Temporary rules reference until Dragonlance-specific data replaces the engine.</p>
      </a>
      <div className="panel rule-card muted-card">
        <p className="eyebrow">Dragonlance</p>
        <h2>Setting Rules</h2>
        <p>Setting rules are staged for v0.6.0.</p>
      </div>
      <div className="panel rule-card muted-card">
        <p className="eyebrow">Krynn</p>
        <h2>{setting === "dragonlance" ? "Current Setting" : "Campaign Lore"}</h2>
        <p>Dragonlance campaign information will be linked here once published.</p>
      </div>
    </div>
  );
}

function ReadOnlyPlaceholder({ title, copy }) {
  return (
    <Panel className="notes-placeholder read-only-panel">
      <p className="eyebrow">Read Only</p>
      <h2>{title}</h2>
      <p>{copy}</p>
    </Panel>
  );
}

function PlayerHero({ eyebrow, title, copy }) {
  return <Header eyebrow={eyebrow} title={title} copy={copy} className="player-hero" action={<Link className="secondary-button" to="/">Return to DM Portal</Link>} />;
}

function playerCharacterForCampaign(campaign, playerId) {
  return (campaign.characters || []).find((character) => String(character.user_id) === String(playerId));
}

function PlayersPage() {
  const { data: players, error, loading, reload } = useLoad(() => api("/1e/players"), []);
  const [modal, setModal] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function openNew() {
    setFormError("");
    setModal({ type: "new", player: { display_name: "", username: "", password: "", active: true } });
  }

  function openEdit(player) {
    setFormError("");
    setModal({ type: "edit", player: { ...player } });
  }

  function openReset(player) {
    setFormError("");
    setModal({ type: "reset", player, password: "" });
  }

  async function savePlayer(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (modal.type === "new") {
        await api("/1e/players", { method: "POST", body: JSON.stringify(modal.player) });
      } else {
        await api(`/1e/players/${modal.player.id}`, { method: "PUT", body: JSON.stringify(modal.player) });
      }
      setModal(null);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(player) {
    await api(`/1e/players/${player.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...player, active: false, status: "inactive" }),
    });
    await reload();
  }

  async function resetPassword(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await api(`/1e/players/${modal.player.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password: modal.password }),
      });
      setModal(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <Header
        eyebrow="Roster"
        title="Players"
        copy="Manage Dragonlance player accounts, campaign access, and credentials."
        action={<button onClick={openNew}>New Player</button>}
      />
      <PageState loading={loading} error={error} />
      <DataTable
        columns={["Display Name", "Username", "Campaigns", "Characters", "Status", "Actions"]}
        rows={(players || []).map((player) => [
          player.display_name || player.player_name,
          player.username || "-",
          player.campaign_count || 0,
          player.character_count || 0,
          player.active ? "Active" : "Inactive",
          <div className="row-actions">
            <button className="table-button" onClick={() => openEdit(player)}>Edit</button>
            <button className="table-button" disabled={!player.active} onClick={() => deactivate(player)}>Deactivate</button>
            <button className="table-button" onClick={() => openReset(player)}>Reset Password</button>
          </div>,
        ])}
      />
      {modal?.type === "new" || modal?.type === "edit" ? (
        <Modal title={modal.type === "new" ? "New Player" : "Edit Player"} onClose={() => setModal(null)}>
          <form className="form-grid modal-form" onSubmit={savePlayer}>
            <label>Display Name<input value={modal.player.display_name || ""} onChange={(event) => setModal({ ...modal, player: { ...modal.player, display_name: event.target.value, player_name: event.target.value } })} required /></label>
            <label>Username<input value={modal.player.username || ""} onChange={(event) => setModal({ ...modal, player: { ...modal.player, username: event.target.value } })} required /></label>
            {modal.type === "new" ? <label>Password<input type="password" value={modal.player.password || ""} onChange={(event) => setModal({ ...modal, player: { ...modal.player, password: event.target.value } })} required /></label> : null}
            <label>Active
              <select value={modal.player.active ? "true" : "false"} onChange={(event) => setModal({ ...modal, player: { ...modal.player, active: event.target.value === "true" } })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            {formError ? <p className="error wide">{formError}</p> : null}
            <div className="form-actions wide">
              <button disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              <button type="button" className="ghost-button" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      ) : null}
      {modal?.type === "reset" ? (
        <Modal title="Reset Password" onClose={() => setModal(null)}>
          <form className="form-grid single-column modal-form" onSubmit={resetPassword}>
            <p className="muted">Set a new password for {modal.player.display_name || modal.player.player_name}.</p>
            <label>New Password<input type="password" value={modal.password} onChange={(event) => setModal({ ...modal, password: event.target.value })} required /></label>
            {formError ? <p className="error">{formError}</p> : null}
            <div className="form-actions">
              <button disabled={saving}>{saving ? "Saving..." : "Reset Password"}</button>
              <button type="button" className="ghost-button" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      ) : null}
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
  return <Header eyebrow={eyebrow} title={title} copy={copy} />;
}

function CampaignHeader({ campaign, eyebrow }) {
  return (
    <Header
      eyebrow={eyebrow}
      title={campaign.name}
      className="workspace-header"
      action={<Link className="secondary-button" to={window.location.pathname.startsWith("/portal") ? "/portal" : "/campaigns"}>{window.location.pathname.startsWith("/portal") ? "My Campaigns" : "All Campaigns"}</Link>}
    >
      <div className="workspace-meta">
        <span>{titleCase(campaign.setting || "greyhawk")}</span>
        <span>Next: {displayDate(campaign.next_session_date)}</span>
        <span>Session #{campaign.session_number || 1}</span>
        <span>{campaign.schedule || "Schedule TBD"}</span>
      </div>
    </Header>
  );
}

function Header({ eyebrow, title, copy, className = "", action, children }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {copy ? <p className="lede">{copy}</p> : null}
        {children}
      </div>
      {action}
    </header>
  );
}

function Panel({ children, className = "" }) {
  return <div className={`panel ${className}`.trim()}>{children}</div>;
}

function Tabs({ tabs, activeTab, onChange, className = "" }) {
  return (
    <nav className={`tabs ${className}`.trim()}>
      {tabs.map(([key, label]) => (
        <button key={key} className={activeTab === key ? "active" : ""} onClick={() => onChange(key)} type="button">
          {label}
        </button>
      ))}
    </nav>
  );
}

function StatCard({ label, value }) {
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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/portal/login" element={<PlayerLoginPage />} />
        <Route path="/" element={<HomeRedirect />} />
        <Route element={<Protected role="player"><PlayerShell /></Protected>}>
          <Route path="/portal" element={<PlayerCampaignsPage />} />
          <Route path="/portal/campaigns/:id" element={<PlayerCampaignHome />} />
        </Route>
        <Route element={<Protected><Shell /></Protected>}>
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/:id" element={<CampaignWorkspace />} />
          <Route path="/campaigns/:id/players" element={<CampaignWorkspace initialTab="players" />} />
          <Route path="/campaigns/:id/characters" element={<CampaignWorkspace initialTab="characters" />} />
          <Route path="/campaigns/:id/notes" element={<CampaignWorkspace initialTab="session-notes" />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/sessions" element={<Navigate to="/campaigns" replace />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/settings" element={<PlaceholderPage eyebrow="Portal" title="Settings" copy="Portal preferences and account controls will live here." />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
