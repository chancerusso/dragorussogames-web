import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import dragonlanceRaceManifest from "../../content/settings/dragonlance/races/index.json";
import gullyDwarfRace from "../../content/settings/dragonlance/races/gully-dwarf.json";
import halfElfRace from "../../content/settings/dragonlance/races/half-elf.json";
import hillDwarfRace from "../../content/settings/dragonlance/races/hill-dwarf.json";
import humanRace from "../../content/settings/dragonlance/races/human.json";
import irdaRace from "../../content/settings/dragonlance/races/irda.json";
import kenderRace from "../../content/settings/dragonlance/races/kender.json";
import minotaurRace from "../../content/settings/dragonlance/races/minotaur.json";
import mountainDwarfRace from "../../content/settings/dragonlance/races/mountain-dwarf.json";
import qualinestiElfRace from "../../content/settings/dragonlance/races/qualinesti-elf.json";
import silvanestiElfRace from "../../content/settings/dragonlance/races/silvanesti-elf.json";
import tinkerGnomeRace from "../../content/settings/dragonlance/races/tinker-gnome.json";
import dragonlanceReference from "../../content/settings/dragonlance/reference/index.json";
import { api, getPlayerToken, getToken, login, logout, playerLogin, playerLogout } from "./api.js";

const AuthContext = createContext(null);
const PlayerPortalContext = createContext(null);
const SETTINGS = ["dragonlance", "greyhawk"];
const DRAGONLANCE_RACE_PATH = "/content/settings/dragonlance/races/";
const BUNDLED_DRAGONLANCE_RACE_FILES = {
  "gully-dwarf.json": gullyDwarfRace,
  "half-elf.json": halfElfRace,
  "hill-dwarf.json": hillDwarfRace,
  "human.json": humanRace,
  "irda.json": irdaRace,
  "kender.json": kenderRace,
  "minotaur.json": minotaurRace,
  "mountain-dwarf.json": mountainDwarfRace,
  "qualinesti-elf.json": qualinestiElfRace,
  "silvanesti-elf.json": silvanestiElfRace,
  "tinker-gnome.json": tinkerGnomeRace,
};
const BUNDLED_DRAGONLANCE_RACES = dragonlanceRaceManifest.map((file) => BUNDLED_DRAGONLANCE_RACE_FILES[file]).filter(Boolean);
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

function isDragolanceHost() {
  return window.location.hostname === "dragolance.dragorussogames.com";
}

function isClassicHost() {
  return window.location.hostname === "classic.dragorussogames.com";
}

function isDmHost() {
  return window.location.hostname === "dm.dragorussogames.com";
}

function isPlayerHostname() {
  return isClassicHost() || window.location.hostname.startsWith("portal.");
}

function playerCampaignPath(id) {
  return isClassicHost() ? `/campaigns/${id}` : `/portal/campaigns/${id}`;
}

function playerCharacterBuilderPath(campaignId) {
  const query = campaignId ? `?campaign_id=${campaignId}` : "";
  return `/1e/characters/new/${query}`;
}

function isDragonlanceCampaign(campaign) {
  const setting = String(campaign?.setting || "").toLowerCase();
  return setting === "dragonlance" || setting === "dragolance";
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

async function fetchDragonlanceRaces() {
  try {
    const files = await fetchJson(`${DRAGONLANCE_RACE_PATH}index.json`);
    return Promise.all(files.map((file) => fetchJson(`${DRAGONLANCE_RACE_PATH}${file}`)));
  } catch {
    return BUNDLED_DRAGONLANCE_RACES;
  }
}

function formatAbilityAdjustments(adjustments = {}) {
  const entries = Object.entries(adjustments);
  if (!entries.length) return "None";
  const labels = { strength: "STR", intelligence: "INT", wisdom: "WIS", dexterity: "DEX", constitution: "CON", charisma: "CHA" };
  return entries.map(([ability, value]) => `${labels[ability] || titleCase(ability)} ${Number(value) > 0 ? "+" : ""}${value}`).join(", ");
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
      signOutPlayer: async () => {
        await playerLogout();
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
  const loginPath = role === "player" ? (isClassicHost() ? "/login" : "/portal/login") : "/login";
  return authed ? children : <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
}

function HomeRedirect() {
  return <Navigate to={isPlayerHostname() ? "/" : "/campaigns"} replace />;
}

function ClassicRoot() {
  const auth = useAuth();
  if (!isClassicHost()) return <HomeRedirect />;
  return auth.playerAuthed ? <PlayerShell><ClassicPlayerHomepage /></PlayerShell> : <PlayerLoginPage />;
}

function AppSidebar({ mode, title, subtitle, brandTo, navItems, account, onSignOut }) {
  return (
    <aside className={`sidebar ${mode === "player" ? "player-sidebar" : ""}`}>
      <Link className="brand" to={brandTo}>
        {mode === "player" ? (
          <span className="brand-wordmark" aria-label="Dragolance">
            <img src="/assets/drago-classic-logo.png" alt="" />
          </span>
        ) : (
          <span className="brand-mark">DRG</span>
        )}
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
  if (mode === "player" && isClassicHost()) {
    return (
      <div className="portal-switcher">
        <span>Portal</span>
        <strong>Drago Classic</strong>
      </div>
    );
  }
  if (mode === "dm") {
    return (
      <div className="portal-switcher">
        <span>Portal</span>
        <a href="https://classic.dragorussogames.com/">View Classic Portal</a>
      </div>
    );
  }
  return (
    <div className="portal-switcher">
      <span>Portal</span>
      <strong>Drago Classic</strong>
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

function PlayerShell({ children }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const { data: activePlayer, error } = useLoad(() => api("/player/me", { auth: "player" }), []);
  const classic = isClassicHost();

  async function signOut() {
    await auth.signOutPlayer();
    navigate(classic ? "/login" : "/portal/login");
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
          title="Drago Classic"
          subtitle="Classic AD&D Player Portal"
          brandTo={classic ? "/" : "/portal"}
        navItems={[
            { label: "Home", to: classic ? "/" : "/portal", end: true },
            { label: "My Campaigns", to: classic ? "/campaigns" : "/portal/campaigns", end: true },
            { label: "My Characters", to: classic ? "/characters" : "/portal/characters" },
            { label: "Create Character", href: "/1e/characters/new/" },
            { label: "1e Rules", href: "/1e/" },
            { label: "Dragonlance Guide", to: classic ? "/dragonlance" : "/portal/dragonlance" },
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
          {children || <Outlet />}
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
  const classic = isClassicHost();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await playerLogin(username, password);
      auth.refreshPlayer();
      const params = new URLSearchParams(location.search);
      navigate(params.get("next") || location.state?.from || (classic ? "/" : "/portal"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page dragonlance-login">
      <form className="login-panel" onSubmit={submit}>
        <div className="classic-login-brands">
          <img src="/assets/dragolance-logo.png" alt="Dragolance" />
          <img src="/assets/drago-classic-logo.png" alt="Drago Classic" />
        </div>
        <p className="eyebrow">Drago Classic</p>
        <h1>Player Login</h1>
        <p className="login-subtitle">Your campaigns, characters, and classic rules in one place.</p>
        <label>
          Username
          <input autoFocus value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button disabled={busy}>{busy ? "Opening..." : "Begin Your Journey"}</button>
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
            <a className="secondary-button" href="https://classic.dragorussogames.com/" target="_blank" rel="noreferrer">Player View</a>
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
    <Link className={`campaign-card ${campaign.status === "archived" ? "is-archived" : ""}`} to={isPlayer ? playerCampaignPath(campaign.id) : `/campaigns/${campaign.id}`}>
      <div className="card-topline">
        <span>{isPlayer ? "Campaign" : "Campaign"}</span>
        <span>{isPlayer && isDragolanceHost() ? "Dragolance" : titleCase(campaign.setting || "greyhawk")}</span>
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

function ClassicPlayerHomepage() {
  const { activePlayer, activePlayerId } = usePlayerPortal();
  const { data, error, loading } = useLoad(() => api("/player/campaigns", { auth: "player" }), []);
  const { data: characterData, error: characterError, loading: charactersLoading, reload: reloadCharacters } = useLoad(() => api("/player/characters", { auth: "player" }), []);
  const campaigns = data || [];
  const characters = useMemo(() => (characterData || []).map((character) => ({
    ...character,
    campaign_name: campaigns.find((campaign) => campaign.id === character.campaign_id)?.name || character.campaign?.name,
  })), [characterData, campaigns]);
  const nextSession = useMemo(() => nextSessionCampaign(campaigns), [campaigns]);

  return (
    <section className="player-portal-page player-homepage">
      <PlayerHero
        eyebrow="Drago Classic"
        title={`Welcome, ${activePlayer?.display_name || activePlayer?.player_name || "Player"}`}
        copy="Your campaigns, characters, and classic First Edition rules are ready."
      />
      <PageState loading={loading} error={error} />
      {!loading && !error ? (
        <>
          <div className="home-grid">
            <section className="panel home-panel home-panel-wide">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">My Campaigns</p>
                  <h2>Assigned Campaigns</h2>
                </div>
                <Link className="table-link" to="/campaigns">View All</Link>
              </div>
              <div className="card-grid player-campaign-grid compact-grid">
                {campaigns.map((campaign) => {
                  const character = campaign.my_character || playerCharacterForCampaign(campaign, activePlayerId);
                  return <CampaignCard key={campaign.id} campaign={campaign} variant="player" character={character} />;
                })}
              </div>
              {campaigns.length === 0 ? <p className="portal-copy">No campaign memberships found. Ask your DM to add this account to a campaign.</p> : null}
            </section>
            <section className="panel home-panel">
              <p className="eyebrow">Next Session</p>
              {nextSession ? (
                <>
                  <h2>{displayDate(nextSession.next_session_date)}</h2>
                  <dl className="detail-list">
                    <div><dt>Campaign</dt><dd>{nextSession.name}</dd></div>
                    <div><dt>Schedule</dt><dd>{nextSession.schedule || "Unscheduled"}</dd></div>
                    <div><dt>Session</dt><dd>#{nextSession.session_number || 1}</dd></div>
                  </dl>
                </>
              ) : (
                <>
                  <h2>Not scheduled</h2>
                  <p className="portal-copy">Your next session has not been posted yet.</p>
                </>
              )}
            </section>
            <section className="panel home-panel">
              <p className="eyebrow">Create Character</p>
              <h2>Your legend begins here.</h2>
              <p className="portal-copy">Choose a campaign, then open the unified classic character builder.</p>
              <div className="form-actions">
                <CreateCharacterLink campaigns={campaigns} />
              </div>
            </section>
            <section className="panel home-panel">
              <p className="eyebrow">Sourcebook</p>
              <h2>Dragonlance Guide</h2>
              <p className="portal-copy">Read the player-safe Krynn reference before choosing a race, class, deity, or order.</p>
              <div className="form-actions">
                <Link className="secondary-button" to="/dragonlance">Open Guide</Link>
              </div>
            </section>
          </div>
          <section className="panel home-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">My Characters</p>
                <h2>Character Roster</h2>
              </div>
            </div>
            <PageState loading={charactersLoading} error={characterError} />
            {characters.length ? (
              <div className="character-card-grid">
                {characters.map((character) => <PlayerCharacterCard key={character.id} character={character} onDeleted={reloadCharacters} />)}
              </div>
            ) : (
              <div className="empty-character-callout">
                <h2>Your legend begins here.</h2>
                <p className="portal-copy">No characters are assigned to your account yet.</p>
                <CreateCharacterLink campaigns={campaigns} />
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}

function CreateCharacterLink({ campaigns }) {
  if (campaigns.length === 1) {
    return <a className="secondary-button" href={playerCharacterBuilderPath(campaigns[0].id)}>Create Character</a>;
  }
  if (campaigns.length > 1) return <Link className="secondary-button" to="/characters/new">Create Character</Link>;
  return <a className="secondary-button" href="/1e/characters/new/">Create Character</a>;
}

function PlayerCharacterCard({ character, onDeleted }) {
  const [busy, setBusy] = useState(false);

  async function deleteCharacter() {
    if (!window.confirm(`Delete ${character.name}?`)) return;
    setBusy(true);
    try {
      await api(`/player/characters/${character.id}`, { auth: "player", method: "DELETE" });
      if (onDeleted) await onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="character-card">
      <p className="eyebrow">{character.campaign_name || "Campaign"}</p>
      <h2>{character.name}</h2>
      <dl className="detail-list">
        <div><dt>Race</dt><dd>{character.race || "-"}</dd></div>
        <div><dt>Class</dt><dd>{character.class_name || "-"}</dd></div>
        <div><dt>Level</dt><dd>{character.level || 1}</dd></div>
        <div><dt>Campaign</dt><dd>{character.campaign_name || "-"}</dd></div>
      </dl>
      <div className="form-actions">
        <a className="secondary-button" href={`/characters/${character.id}`}>View</a>
        <a className="table-link" href={`/characters/${character.id}/edit`}>Edit</a>
        <button className="table-button" type="button" disabled={busy} onClick={deleteCharacter}>{busy ? "Deleting..." : "Delete"}</button>
      </div>
    </article>
  );
}

function PlayerVaultToolPage() {
  const { id } = useParams();
  const location = useLocation();

  useEffect(() => {
    ensureStylesheet("/style.css");
    ensureStylesheet("/styles/first-edition.css");
    ensureStylesheet("/styles/character-vault.css");
    document.querySelector("[data-vault-app]")?.replaceChildren();
    loadClassicScript("/components/first-edition-app.js", "player-vault-rules-nav")
      .then(() => loadClassicScript("/components/character-vault.js", "player-vault-character-vault"))
      .catch((error) => {
        const node = document.querySelector("[data-vault-app]");
        if (node) node.textContent = error?.message || "Unable to load character tools.";
      });
  }, [id, location.pathname, location.search]);

  return <main className="vault-shell" data-vault-app />;
}

function ensureStylesheet(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadClassicScript(src, id) {
  document.querySelector(`script[data-classic-loader="${id}"]`)?.remove();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.dataset.classicLoader = id;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.body.appendChild(script);
  });
}

function PlayerCampaignsPage() {
  const { activePlayerId, activePlayer } = usePlayerPortal();
  const { data, error, loading } = useLoad(() => api("/player/campaigns", { auth: "player" }), []);
  const campaigns = data || [];

  return (
    <section className="player-portal-page">
      <PlayerHero
        eyebrow="Drago Classic"
        title="My Campaigns"
        copy={activePlayer ? `Welcome, ${activePlayer.display_name || activePlayer.player_name}.` : "Sign in to see your campaigns."}
      />
      <PageState loading={loading} error={error} />
      <div className="card-grid player-campaign-grid">
        {campaigns.map((campaign) => {
          const character = campaign.my_character || playerCharacterForCampaign(campaign, activePlayerId);
          return <CampaignCard key={campaign.id} campaign={campaign} variant="player" character={character} />;
        })}
      </div>
      {!loading && !error && campaigns.length === 0 ? (
        <div className="panel notes-placeholder">
          <p className="eyebrow">No Campaigns</p>
          <h2>No campaign memberships found.</h2>
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
      {activeTab === "overview" ? <PlayerOverviewTab campaign={campaign} character={character} /> : null}
      {activeTab === "character" ? <PlayerCharacterTab character={character} /> : null}
      {activeTab === "players" ? <PlayerRosterTab campaign={campaign} /> : null}
      {activeTab === "journal" ? <ReadOnlyPlaceholder title="Journal" copy="Read-only session summaries will appear here once the journal backend exists." /> : null}
      {activeTab === "handouts" ? <ReadOnlyPlaceholder title="Handouts" copy="Read-only campaign handouts, maps, and clues will appear here once uploaded." /> : null}
      {activeTab === "rules" ? <PlayerRulesTab campaign={campaign} /> : null}
    </section>
  );
}

function PlayerCreateCharacterPage() {
  const { data, error, loading } = useLoad(() => api("/player/campaigns", { auth: "player" }), []);
  const campaigns = data || [];

  if (!loading && !error && campaigns.length === 1) {
    window.location.href = playerCharacterBuilderPath(campaigns[0].id);
    return <p className="muted">Opening character builder...</p>;
  }

  return (
    <section className="player-portal-page">
      <PlayerHero
        eyebrow="Create Character"
        title="Choose a Campaign"
        copy="Your campaign determines which sourcebooks are available in the shared builder."
      />
      <PageState loading={loading} error={error} />
      {!loading && !error ? (
        <div className="card-grid player-campaign-grid">
          {campaigns.map((campaign) => (
            <a key={campaign.id} className="campaign-card" href={playerCharacterBuilderPath(campaign.id)}>
              <div className="card-topline">
                <span>Campaign</span>
                <span>{titleCase(campaign.setting || "greyhawk")}</span>
              </div>
              <h2>{campaign.name}</h2>
              <dl className="campaign-facts">
                <div><dt>Next Session</dt><dd>{displayDate(campaign.next_session_date)}</dd></div>
                <div><dt>Session Number</dt><dd>#{campaign.session_number || 1}</dd></div>
              </dl>
              <span className="action-button">Create Character</span>
            </a>
          ))}
        </div>
      ) : null}
      {!loading && !error && campaigns.length === 0 ? (
        <Panel className="notes-placeholder">
          <p className="eyebrow">No Campaigns</p>
          <h2>Your DM has not assigned a campaign yet.</h2>
          <p>Characters can be created once this player account belongs to a campaign.</p>
        </Panel>
      ) : null}
    </section>
  );
}

function PlayerCharactersPage() {
  const { data: campaigns } = useLoad(() => api("/player/campaigns", { auth: "player" }), []);
  const { data: characters, error, loading, reload } = useLoad(() => api("/player/characters", { auth: "player" }), []);
  const campaignList = campaigns || [];
  const enriched = (characters || []).map((character) => ({
    ...character,
    campaign_name: campaignList.find((campaign) => campaign.id === character.campaign_id)?.name || character.campaign?.name,
  }));

  return (
    <section className="player-portal-page">
      <PlayerHero
        eyebrow="My Characters"
        title="Character Roster"
        copy="View, edit, or retire the characters owned by this player account."
      />
      <PageState loading={loading} error={error} />
      {!loading && !error && enriched.length ? (
        <div className="character-card-grid">
          {enriched.map((character) => <PlayerCharacterCard key={character.id} character={character} onDeleted={reload} />)}
        </div>
      ) : null}
      {!loading && !error && !enriched.length ? (
        <div className="empty-character-callout panel">
          <h2>Your legend begins here.</h2>
          <p className="portal-copy">No characters are assigned to your account yet.</p>
          <CreateCharacterLink campaigns={campaignList} />
        </div>
      ) : null}
    </section>
  );
}

function PlayerTabs({ activeTab, onChange }) {
  return <Tabs tabs={PLAYER_TABS} activeTab={activeTab} onChange={onChange} className="player-tabs" />;
}

function PlayerOverviewTab({ campaign, character }) {
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
      <section className="panel workspace-panel">
        <p className="eyebrow">My Character</p>
        {character ? (
          <>
            <h2>{character.name}</h2>
            <dl className="detail-list">
              <div><dt>Race</dt><dd>{character.race}</dd></div>
              <div><dt>Class</dt><dd>{character.class_name}</dd></div>
              <div><dt>Level</dt><dd>{character.level}</dd></div>
            </dl>
          </>
        ) : (
          <>
            <h2>Your legend begins here.</h2>
            <p className="portal-copy">No character has been assigned to you for this campaign yet.</p>
            <div className="form-actions">
              <Link className="secondary-button" to={playerCharacterBuilderPath(campaign.id)}>Create Character</Link>
            </div>
          </>
        )}
      </section>
      <section className="panel workspace-panel">
        <p className="eyebrow">Party</p>
        <h2>{campaign.players?.length || 0} Players</h2>
        <p className="portal-copy">{(campaign.players || []).map((entry) => entry.player?.display_name || entry.player?.player_name || `Player ${entry.user_id}`).join(", ") || "No party members listed yet."}</p>
      </section>
    </div>
  );
}

function PlayerCharacterTab({ character }) {
  const { id: campaignId } = useParams();
  const label = "My Character";
  if (!character) {
    return (
      <Panel className="notes-placeholder read-only-panel">
        <p className="eyebrow">{label}</p>
        <h2>Your legend begins here.</h2>
        <p>Choose a sourcebook option and begin building a character for this campaign.</p>
        <div className="form-actions">
          <Link className="secondary-button" to={playerCharacterBuilderPath(campaignId)}>Create Character</Link>
        </div>
      </Panel>
    );
  }
  return (
    <section className="panel workspace-panel character-summary">
        <p className="eyebrow">{label}</p>
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
        <a className="secondary-button" href={`/characters/${character.id}`}>View Character</a>
        <a className="table-link" href={`/characters/${character.id}/edit`}>Edit Character</a>
      </div>
    </section>
  );
}

function PlayerCharacterBuilderPage() {
  const { id: campaignId } = useParams();
  const { activePlayer } = usePlayerPortal();
  const { data: races, error, loading } = useLoad(fetchDragonlanceRaces, []);
  const { data: campaign } = useLoad(
    () => campaignId ? api(`/player/campaigns/${campaignId}`, { auth: "player" }) : Promise.resolve(null),
    [campaignId],
  );
  const [selectedRace, setSelectedRace] = useState("");
  const defaultRaces = (races || []).filter((race) => race.enabled_by_default);
  const advancedRaces = (races || []).filter((race) => race.advanced);

  return (
    <section className="player-portal-page character-builder-page">
      <PlayerHero
        eyebrow="Step 1"
        title="Choose Race"
        copy={campaign ? `${campaign.name} character foundation for ${activePlayer?.display_name || "your player profile"}.` : "Begin your Dragolance character with the peoples of Krynn."}
      />
      {campaign ? (
        <div className="builder-campaign-strip">
          <span><strong>Campaign</strong>{campaign.name}</span>
          <span><strong>Next Session</strong>{displayDate(campaign.next_session_date)}</span>
          <span><strong>Schedule</strong>{campaign.schedule || "Unscheduled"}</span>
          <span><strong>Session</strong>#{campaign.session_number || 1}</span>
        </div>
      ) : null}
      <PageState loading={loading} error={error} />
      {!loading && !error ? (
        <>
          <div className="builder-intro panel">
            <p className="eyebrow">Dragonlance Character Builder</p>
            <h2>Your legend begins here.</h2>
            <p>Choose a race to stage your character foundation. Full class, abilities, equipment, and saving flow will come later.</p>
            {selectedRace ? <strong>Selected Race: {selectedRace}</strong> : <span className="muted">No race selected yet.</span>}
          </div>
          <RaceCardSection title="Enabled Races" races={defaultRaces} selectedRace={selectedRace} onSelect={setSelectedRace} />
          <RaceCardSection title="Advanced / DM Approval" races={advancedRaces} selectedRace={selectedRace} onSelect={setSelectedRace} />
          <div className="form-actions builder-actions">
            <Link className="table-link" to={campaignId ? playerCampaignPath(campaignId) : (isDragolanceHost() ? "/campaigns" : "/portal")}>{campaignId ? "Back to Campaign" : "Back to My Campaigns"}</Link>
            <button disabled={!selectedRace} type="button">Continue Later</button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function RaceCardSection({ title, races, selectedRace, onSelect }) {
  return (
    <section className="race-section">
      <div className="section-heading">
        <p className="eyebrow">{title}</p>
      </div>
      <div className="race-card-grid">
        {races.map((race) => (
          <RaceCard key={race.slug} race={race} selected={selectedRace === race.name} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

function RaceCard({ race, selected, onSelect }) {
  const advisory = !race.enabled_by_default;
  return (
    <article className={`panel race-card ${selected ? "selected" : ""}`}>
      <div className="race-card-header">
        <div>
          <h2>{race.name}</h2>
          <p>{race.description}</p>
        </div>
        <span>{race.advanced ? "Advanced" : "Enabled"}</span>
      </div>
      <dl className="race-details">
        <div><dt>Ability Adjustments</dt><dd>{formatAbilityAdjustments(race.ability_adjustments)}</dd></div>
        <div><dt>Alignment</dt><dd>{race.allowed_alignments.join(", ")}</dd></div>
        <div><dt>Languages</dt><dd>{race.languages.join(", ")}</dd></div>
        <div><dt>Special Abilities</dt><dd>{race.special_abilities.join(", ")}</dd></div>
        <div><dt>Movement</dt><dd>{race.movement}</dd></div>
      </dl>
      {advisory ? <p className="portal-copy">Ask your DM before selecting this option.</p> : null}
      <button type="button" onClick={() => onSelect(race.name)}>
        {selected ? "Selected" : "Select Race"}
      </button>
    </article>
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
  const dragonlance = setting === "dragonlance" || setting === "dragolance";
  return (
    <div className="rule-link-grid">
      <a className="panel rule-card" href="/1e/">
        <p className="eyebrow">1e Rules</p>
        <h2>Rules Library</h2>
        <p>Open the shared classic First Edition rules reference.</p>
      </a>
      <Link className={`panel rule-card ${dragonlance ? "" : "muted-card"}`} to={dragonlance ? "/dragonlance" : "#"}>
        <p className="eyebrow">{titleCase(setting)}</p>
        <h2>{dragonlance ? "Dragonlance Guide" : "Campaign Rules"}</h2>
        <p>{dragonlance ? "Open the player-safe Krynn sourcebook reference." : "Setting-specific sourcebook rules will appear here as the library expands."}</p>
      </Link>
      <div className="panel rule-card muted-card">
        <p className="eyebrow">Sourcebook</p>
        <h2>{setting === "dragonlance" || setting === "dragolance" ? "Current Setting" : "Campaign Lore"}</h2>
        <p>Campaign information will be linked here once published.</p>
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

function DragonlanceGuidePage() {
  const ref = dragonlanceReference;
  return (
    <section className="player-portal-page dragonlance-guide-page">
      <PlayerHero
        eyebrow="Sourcebook"
        title={ref.title}
        copy="A player-safe Krynn reference for Classic campaigns."
      />
      <nav className="guide-nav" aria-label="Dragonlance guide sections">
        {ref.navigation.map((item) => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}
      </nav>
      <GuideIntroSection section={ref.guide} />
      <GuideDeities section={ref.deities} />
      <GuideClassSection section={ref.classes} />
      <GuideEntrySection section={ref.high_sorcery} />
      <GuideEntrySection section={ref.solamnia} />
      <GuideEquipment section={ref.equipment} />
      <GuideRaceSection section={ref.races} />
      <GuideEntrySection section={ref.timeline} />
      <GuideEntrySection section={ref.geography} />
      <GuideEntrySection section={ref.organizations} />
      <GuideEntrySection section={ref.languages} />
      <section className="panel guide-source-panel">
        <p className="eyebrow">Source Reviewed</p>
        <h2>PDF Sections</h2>
        <ul className="guide-list">
          {ref.source_pages_reviewed.map((page) => <li key={page}>{page}</li>)}
        </ul>
        <p className="portal-copy">{ref.forbidden_content_policy}</p>
      </section>
    </section>
  );
}

function GuideIntroSection({ section }) {
  return (
    <section className="panel guide-section" id={section.id}>
      <p className="eyebrow">{section.eyebrow}</p>
      <h2>{section.heading}</h2>
      <p className="portal-copy">{section.summary}</p>
      <div className="guide-card-grid">
        {section.cards.map((card) => <GuideCard key={card.title} title={card.title} body={card.body} />)}
      </div>
      <h3>Before Building</h3>
      <ul className="guide-list">
        {section.before_building.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function GuideDeities({ section }) {
  return (
    <section className="panel guide-section" id={section.id}>
      <p className="eyebrow">Faith</p>
      <h2>{section.heading}</h2>
      <p className="portal-copy">{section.summary}</p>
      {section.groups.map((group) => (
        <div className="guide-subsection" key={group.title}>
          <h3>{group.title}</h3>
          <div className="guide-card-grid compact-guide-grid">
            {group.entries.map((entry) => (
              <article className="guide-card" key={entry.name}>
                <p className="eyebrow">{entry.alignment}</p>
                <h4>{entry.name}</h4>
                <p>{entry.description}</p>
                <dl className="guide-details">
                  <div><dt>Role</dt><dd>{entry.portfolio}</dd></div>
                  <div><dt>Holy Symbol</dt><dd>{entry.holy_symbol}</dd></div>
                  <div><dt>Cleric / Druid Relevance</dt><dd>{entry.cleric_relevance}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function GuideClassSection({ section }) {
  return (
    <section className="panel guide-section" id={section.id}>
      <p className="eyebrow">Characters</p>
      <h2>{section.heading}</h2>
      <p className="portal-copy">{section.summary}</p>
      <GuideClassGroup title="Starting Classes" classes={section.starting} />
      <GuideClassGroup title="Progression Paths" classes={section.progression} />
    </section>
  );
}

function GuideClassGroup({ title, classes }) {
  return (
    <div className="guide-subsection">
      <h3>{title}</h3>
      <div className="guide-card-grid">
        {classes.map((item) => (
          <article className="guide-card" key={item.name}>
            <p className="eyebrow">{item.progression_note}</p>
            <h4>{item.name}</h4>
            <p>{item.overview}</p>
            <dl className="guide-details">
              <div><dt>Hit Die</dt><dd>{item.hit_die}</dd></div>
              <div><dt>Prime Ability</dt><dd>{item.prime_ability}</dd></div>
              <div><dt>Spell Table</dt><dd>{item.spell_table}</dd></div>
              <div><dt>Advancement</dt><dd>{item.advancement_notes}</dd></div>
              <div><dt>Campaign Restrictions</dt><dd>{item.campaign_restrictions}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

function GuideEquipment({ section }) {
  return (
    <section className="panel guide-section" id={section.id}>
      <p className="eyebrow">Equipment</p>
      <h2>{section.heading}</h2>
      <div className="guide-banner">{section.banner}</div>
      <p className="portal-copy">{section.summary}</p>
      <div className="guide-card-grid compact-guide-grid">
        {section.items.map((item) => <GuideCard key={item.name} title={item.name} eyebrow={item.type} body={item.description} />)}
      </div>
      <p className="portal-copy">{section.omission_note}</p>
    </section>
  );
}

function GuideRaceSection({ section }) {
  return (
    <section className="panel guide-section" id={section.id}>
      <p className="eyebrow">Peoples</p>
      <h2>{section.heading}</h2>
      <p className="portal-copy">{section.summary}</p>
      <div className="guide-card-grid">
        {section.entries.map((race) => (
          <article className="guide-card" key={race.name}>
            <p className="eyebrow">{race.campaign_note}</p>
            <h4>{race.name}</h4>
            <p>{race.culture}</p>
            <dl className="guide-details">
              <div><dt>Ability Adjustments</dt><dd>{race.ability_adjustments}</dd></div>
              <div><dt>Movement</dt><dd>{race.movement}</dd></div>
              <div><dt>Languages</dt><dd>{race.languages}</dd></div>
              <div><dt>Alignment</dt><dd>{race.alignment}</dd></div>
              <div><dt>Roleplaying Notes</dt><dd>{race.roleplaying}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function GuideEntrySection({ section }) {
  return (
    <section className="panel guide-section" id={section.id}>
      <p className="eyebrow">Reference</p>
      <h2>{section.heading}</h2>
      <p className="portal-copy">{section.summary}</p>
      <div className="guide-card-grid compact-guide-grid">
        {section.entries.map((entry) => <GuideCard key={entry.title || entry.name} title={entry.title || entry.name} body={entry.body || entry.description} />)}
      </div>
    </section>
  );
}

function GuideCard({ eyebrow, title, body }) {
  return (
    <article className="guide-card">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h4>{title}</h4>
      <p>{body}</p>
    </article>
  );
}

function PlayerHero({ eyebrow, title, copy }) {
  if (isClassicHost()) return <Header eyebrow={eyebrow} title={title} copy={copy} className="player-hero" />;
  return <Header eyebrow={eyebrow} title={title} copy={copy} className="player-hero" action={<Link className="secondary-button" to="/">Return to DM Portal</Link>} />;
}

function playerCharacterForCampaign(campaign, playerId) {
  return (campaign.characters || []).find((character) => String(character.user_id) === String(playerId));
}

function playerCharactersFromCampaigns(campaigns, playerId) {
  const seen = new Set();
  return campaigns.flatMap((campaign) => {
    const matches = [
      campaign.my_character,
      ...(campaign.characters || []).filter((character) => String(character.user_id) === String(playerId)),
    ].filter(Boolean);
    return matches.map((character) => ({ ...character, campaign_name: campaign.name, campaign_id: campaign.id }));
  }).filter((character) => {
    if (!character.id || seen.has(character.id)) return false;
    seen.add(character.id);
    return true;
  });
}

function nextSessionCampaign(campaigns) {
  const scheduled = campaigns
    .filter((campaign) => campaign.next_session_date)
    .slice()
    .sort((a, b) => String(a.next_session_date).localeCompare(String(b.next_session_date)));
  return scheduled[0] || campaigns[0] || null;
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
  const campaignBackPath = isClassicHost() ? "/campaigns" : window.location.pathname.startsWith("/portal") ? "/portal" : "/campaigns";
  return (
    <Header
      eyebrow={eyebrow}
      title={campaign.name}
      className="workspace-header"
      action={<Link className="secondary-button" to={campaignBackPath}>{isClassicHost() || window.location.pathname.startsWith("/portal") ? "My Campaigns" : "All Campaigns"}</Link>}
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
  useEffect(() => {
    document.title = isClassicHost() ? "Drago Classic | Player Portal" : "DM Portal | Drago Russo Games";
  }, []);

  if (isDragolanceHost()) {
    window.location.replace("https://classic.dragorussogames.com/");
    return null;
  }

  if (isClassicHost()) {
    return (
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PlayerLoginPage />} />
          <Route path="/" element={<ClassicRoot />} />
          <Route element={<Protected role="player"><PlayerShell /></Protected>}>
            <Route path="/campaigns" element={<PlayerCampaignsPage />} />
            <Route path="/campaigns/:id" element={<PlayerCampaignHome />} />
            <Route path="/characters" element={<PlayerCharactersPage />} />
            <Route path="/characters/new" element={<PlayerCreateCharacterPage />} />
            <Route path="/dragonlance" element={<DragonlanceGuidePage />} />
            <Route path="/characters/:id" element={<PlayerVaultToolPage />} />
            <Route path="/characters/:id/edit" element={<PlayerVaultToolPage />} />
            <Route path="/1e/characters/new" element={<PlayerVaultToolPage />} />
            <Route path="/1e/characters/:id" element={<PlayerVaultToolPage />} />
            <Route path="/1e/characters/:id/edit" element={<PlayerVaultToolPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/portal/login" element={<PlayerLoginPage />} />
        <Route path="/" element={<HomeRedirect />} />
        <Route element={<Protected role="player"><PlayerShell /></Protected>}>
          <Route path="/portal" element={<PlayerCampaignsPage />} />
          <Route path="/portal/campaigns" element={<PlayerCampaignsPage />} />
          <Route path="/portal/campaigns/:id" element={<PlayerCampaignHome />} />
          <Route path="/portal/characters" element={<PlayerCharactersPage />} />
          <Route path="/portal/characters/new" element={<PlayerCreateCharacterPage />} />
          <Route path="/portal/campaigns/:id/characters/new" element={<PlayerCreateCharacterPage />} />
          <Route path="/portal/dragonlance" element={<DragonlanceGuidePage />} />
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
