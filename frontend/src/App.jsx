import { Component, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { AUTH_CHANGED_EVENT, api, getPlayerToken, getToken, login, logout, playerLogin, playerLogout } from "./api.js";
import {
  classReference,
  deityGroups,
  deityRecord,
  dragolanceIntroContent,
  dragonlanceFlatPages,
  dragonlanceIa,
  dragonlancePageFor,
  godsReference,
  presentationOnlyRacePages,
  raceOverviewPages,
  racePresentation,
  raceRecords,
  relatedTopics,
  sourceBadges,
} from "./dragonlanceReference.js";
import { DM_NAV_ITEMS, playerPortalUrl } from "./dmNavigation.js";
import { filterReferenceItems, isCanonicalId, makeTypeOptions, recordSummary, recordTitle, reviewStatus, safeDisplayText, sourceLabel, titleize, typeLabel } from "./rulesReference.js";
import { MappingCanvas } from "./MappingCanvas.jsx";
import { emptyDrawingState } from "./mapping.js";

const AuthContext = createContext(null);
const PlayerPortalContext = createContext(null);
const SETTINGS = ["dragonlance", "greyhawk"];
const DRAGONLANCE_RACE_PATH = "/content/settings/dragonlance/races/";
const CLASSIC_STATIC_VERSION = "2026-07-13-facing-ac-v20";
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
  ["table", "Table"],
  ["maps", "Maps"],
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
  return ["classic.dragorussogames.com", "classic.localhost"].includes(window.location.hostname);
}

function isDmHost() {
  return ["dm.dragorussogames.com", "dm.localhost"].includes(window.location.hostname);
}

function isLocalDragoHost() {
  return ["127.0.0.1", "localhost", "table.dragorussogames.com"].includes(window.location.hostname);
}

function isRemoteDragoHost() {
  return window.location.hostname === "table.dragorussogames.com";
}

function isPlayerHostname() {
  return isClassicHost() || window.location.hostname.startsWith("portal.");
}

function playerCampaignPath(id) {
  return isClassicHost() ? `/campaigns/${id}` : `/portal/campaigns/${id}`;
}

function playerMapPath(campaignId, mapId) {
  return `${playerCampaignPath(campaignId)}/maps/${mapId}`;
}

function playerCharacterBuilderPath(campaignId) {
  const query = campaignId ? `?campaign_id=${campaignId}` : "";
  return `/1e/characters/new/${query}`;
}

function playerCharacterChooserPath() {
  return isClassicHost() ? "/characters/new" : "/portal/characters/new";
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

  useEffect(() => {
    function refreshAuthentication(event) {
      if (!event.detail?.role || event.detail.role === "admin") setTokenState(getToken());
      if (!event.detail?.role || event.detail.role === "player") setPlayerTokenState(getPlayerToken());
    }
    window.addEventListener(AUTH_CHANGED_EVENT, refreshAuthentication);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, refreshAuthentication);
  }, []);

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

function AppHeader({ mode, title, subtitle, brandTo, navItems, account, onSignOut }) {
  const location = useLocation();
  return (
    <header className={`app-header ${mode === "player" ? "player-header" : ""}`}>
      <Link className="brand" to={brandTo}>
        <span className="brand-mark">
          <img src="/assets/LogoDrago_Mesa_de_trabajo_1.png" alt="" />
        </span>
        <span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
      </Link>
      <nav>
        {navItems.map((item) => (
          item.href ? (
            <a key={item.label} href={item.href} target={item.target} rel={item.target ? "noreferrer" : undefined}>{item.label}</a>
          ) : (
            <NavLink
              key={item.label}
              end={item.end}
              to={item.to}
              className={({ isActive }) => (isActive || (item.match && item.match(location.pathname)) ? "active" : "")}
            >
              {item.label}
            </NavLink>
          )
        ))}
      </nav>
      <div className="app-header-actions">
        {mode === "dm" ? (
          <a className="header-player-link" href={playerPortalUrl()} target="_blank" rel="noreferrer">
            Player View
          </a>
        ) : null}
        {account}
        <button className="ghost-button" onClick={onSignOut}>Sign Out</button>
      </div>
    </header>
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
      <AppHeader
        mode="dm"
        title="Drago Table"
        subtitle="Dungeon Master"
        brandTo="/campaigns"
        navItems={DM_NAV_ITEMS}
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
        <AppHeader
          mode="player"
          title="Drago Table"
          subtitle="Player"
          brandTo={classic ? "/" : "/portal"}
        navItems={[
            { label: "Home", to: classic ? "/" : "/portal", end: true },
            { label: "Campaigns", to: classic ? "/campaigns" : "/portal/campaigns", end: true },
            { label: "Characters", to: classic ? "/characters" : "/portal/characters" },
            { label: "Create Character", to: classic ? "/characters/new" : "/portal/characters/new" },
            { label: "Player's Guide", href: "/1e/" },
            { label: "Dragonlance", href: classic ? "/dragonlance" : "/portal/dragonlance" },
          ]}
          account={
            <div className="account-card">
              <span>Player</span>
              <strong>{error ? "Unavailable" : activePlayer?.display_name || activePlayer?.player_name || "Player Name"}</strong>
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
        <div className="login-brand-mark">
          <img src="/assets/LogoDrago_Mesa_de_trabajo_1.png" alt="Drago Table" />
        </div>
        <p className="eyebrow">Drago Table</p>
        <h1>Dungeon Master</h1>
        <label>
          Admin Password
          <input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button disabled={busy}>{busy ? "Opening..." : "Open Drago Table"}</button>
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
        <div className="login-brand-mark">
          <img src="/assets/LogoDrago_Mesa_de_trabajo_1.png" alt="Drago Table" />
        </div>
        <p className="eyebrow">Drago Table</p>
        <h1>Player Sign In</h1>
        {isRemoteDragoHost() ? <p className="session-badge">Remote table session</p> : null}
        <p className="login-subtitle">
          {isRemoteDragoHost()
            ? "Sign in with the player account your Dungeon Master created for you."
            : "Your campaigns, characters, and classic rules in one place."}
        </p>
        <label>
          Username
          <input autoFocus value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button disabled={busy}>{busy ? "Joining..." : "Join the Table"}</button>
      </form>
    </div>
  );
}

function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function reload({ silent = false } = {}) {
    if (!silent) setLoading(true);
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

class RulesBrowserBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("Rules & Settings render failed", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get("record");
    return (
      <section>
        <PlainHeader eyebrow="DM Reference" title="Rules & Settings" copy="One canonical record could not be rendered safely." />
        <Panel className="rules-detail">
          <p className="error">Rules & Settings hit an unsupported record shape.</p>
          {recordId ? <p className="muted">Affected record: {safeDisplayText(recordId)}</p> : null}
          <Link className="secondary-button" to="/rules">Return to Rules & Settings</Link>
        </Panel>
      </section>
    );
  }
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
            <a className="secondary-button" href={playerPortalUrl()} target="_blank" rel="noreferrer">Player View</a>
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
        <ActionCard tone="gold" title="Drago Table" copy="Launch the DM screen for marching order, combat, trackers, monsters, treasure, and XP." action="Launch Table" to={activeCampaigns[0] ? `/campaigns/${activeCampaigns[0].id}/table` : "/table"} />
        <ActionCard tone="green" title="Players" copy="Manage the table roster and campaign membership." action="Manage Players" to="/players" />
        <ActionCard tone="blue" title="Characters" copy="Review characters and open the existing sheet tools." action="View Characters" to="/characters" />
        <ActionCard tone="violet" title="Rules & Settings" copy="Browse First Edition rules, Dragolance records, and campaign reference material." action="Open Reference" to="/rules" />
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
      <div className="launch-row">
        <Link className="wide-command" to={`/campaigns/${campaign.id}/table`}>Launch Drago Table</Link>
        <Link className="table-link" to={`/campaigns/${campaign.id}`}>View Campaign</Link>
      </div>
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
        <div className="table-launch-panel">
          <div>
            <strong>Drago Table</strong>
            <p>Open the referee-first table view for marching order, tactical rooms, monsters, and pending rewards.</p>
          </div>
          <Link className="secondary-button" to={`/campaigns/${campaign.id}/table`}>Launch Table</Link>
        </div>
        <div className="notes-box">
          <strong>Notes</strong>
          <p>{campaign.description || "No campaign notes yet."}</p>
        </div>
      </section>
    </div>
  );
}

function DragoTableIndexPage() {
  const { data, error, loading } = useLoad(() => api("/1e/campaigns?include_archived=true"), []);
  const campaigns = (data || []).filter((campaign) => campaign.status !== "archived");
  return (
    <section className="drago-table-page">
      <PlainHeader eyebrow="Drago Table" title="Choose A Campaign" copy="Launch the referee screen from an active campaign." />
      <PageState loading={loading} error={error} />
      <div className="card-grid">
        {campaigns.map((campaign) => (
          <Link className="campaign-card table-campaign-card" key={campaign.id} to={`/campaigns/${campaign.id}/table`}>
            <div className="card-topline">
              <span>Drago Table</span>
              <span>{titleCase(campaign.setting || "greyhawk")}</span>
            </div>
            <h2>{campaign.name}</h2>
            <dl className="campaign-facts">
              <div><dt>Session</dt><dd>#{campaign.session_number || 1}</dd></div>
              <div><dt>Campaign Day</dt><dd>{campaign.current_campaign_day || 1}</dd></div>
              <div><dt>Players</dt><dd>{campaign.player_count || campaign.players?.length || 0}</dd></div>
              <div><dt>Next Session</dt><dd>{displayDate(campaign.next_session_date)}</dd></div>
            </dl>
            <span className="action-button">Launch Table</span>
          </Link>
        ))}
      </div>
      {!loading && !error && campaigns.length === 0 ? <p className="muted">Create an active campaign before launching Drago Table.</p> : null}
    </section>
  );
}

function DragoTablePage() {
  const { id } = useParams();
  const { data: campaign, error, loading, reload: reloadCampaign } = useLoad(() => api(`/1e/campaigns/${id}`), [id]);
  const { data: monsterCatalog, error: monsterError, loading: monsterLoading } = useLoad(() => api("/1e/monsters?include_source_text=true"), []);
  const savedTable = useMemo(() => loadDragoTableState(id), [id]);
  const [mode, setMode] = useState(savedTable.mode);
  const [monsterSource, setMonsterSource] = useState("Monster Manual");
  const [monsterQuery, setMonsterQuery] = useState("");
  const [selectedMonsterId, setSelectedMonsterId] = useState(null);
  const [encounterMonsters, setEncounterMonsters] = useState(savedTable.encounterMonsters);
  const [expandedMonsterTypes, setExpandedMonsterTypes] = useState(savedTable.expandedMonsterTypes);
  const [pendingGridMonsterId, setPendingGridMonsterId] = useState(savedTable.pendingGridMonsterId);
  const [trackerMode, setTrackerMode] = useState(isDragonlanceCampaign(campaign) ? "dragonlance" : "greyhawk");
  const [tracker, setTracker] = useState(() => createTrackerState(isDragonlanceCampaign(campaign) ? "dragonlance" : "greyhawk"));
  const [combatGrid, setCombatGrid] = useState(savedTable.combatGrid);
  const [combatTracker, setCombatTracker] = useState(savedTable.combatTracker);
  const [hpEditor, setHpEditor] = useState(null);
  const [treasureXp, setTreasureXp] = useState(savedTable.treasureXp);
  const [bonusXp, setBonusXp] = useState(savedTable.bonusXp);
  const [rewardBusy, setRewardBusy] = useState(false);
  const [rewardMessage, setRewardMessage] = useState("");
  const [tokenPositions, setTokenPositions] = useState(savedTable.tokenPositions);
  const [playerColors, setPlayerColors] = useState(savedTable.playerColors);
  const [isSessionLive, setIsSessionLive] = useState(savedTable.isSessionLive);
  const [draggedToken, setDraggedToken] = useState(null);
  const tableHydrated = useRef(false);
  const basePlayerTokens = useMemo(() => buildPlayerTokens(campaign?.characters || [], playerColors), [campaign, playerColors]);
  const monsters = monsterCatalog || [];
  const monsterSources = useMemo(() => uniqueMonsterSources(monsters), [monsters]);
  const sourceMonsters = useMemo(
    () => monsters.filter((monster) => (monster.source || "Unknown") === monsterSource),
    [monsters, monsterSource],
  );
  const filteredMonsters = useMemo(() => filterMonsterCatalog(sourceMonsters, monsterQuery).slice(0, 12), [sourceMonsters, monsterQuery]);
  const selectedMonster = useMemo(
    () => monsters.find((monster) => monster.id === selectedMonsterId) || null,
    [filteredMonsters, monsters, selectedMonsterId],
  );
  const encounterGroups = useMemo(() => groupEncounterMonsters(encounterMonsters), [encounterMonsters]);
  const pendingMonster = useMemo(
    () => encounterMonsters.find((monster) => monster.id === pendingGridMonsterId) || null,
    [encounterMonsters, pendingGridMonsterId],
  );
  const { data: campaignMaps, reload: reloadMaps } = useLoad(() => api(`/1e/campaigns/${id}/maps`), [id]);
  const activeGrid = mode === "combat" ? combatGrid : DRAGO_OUTDOORS_GRID;
  const playerTokens = useMemo(() => applyTokenPositions(basePlayerTokens, tokenPositions), [basePlayerTokens, tokenPositions]);
  const monsterTokens = useMemo(
    () => applyTokenPositions(buildMonsterTokens(encounterMonsters), tokenPositions),
    [encounterMonsters, tokenPositions],
  );

  useEffect(() => {
    if (!campaign) return;
    const nextMode = isDragonlanceCampaign(campaign) ? "dragonlance" : "greyhawk";
    setTrackerMode(nextMode);
    setTracker(createTrackerState(nextMode));
  }, [campaign?.id]);

  useEffect(() => {
    if (!campaign || tableHydrated.current) return;
    const shared = normalizeDragoTableState(campaign.table_state);
    if (shared) {
      setMode(shared.mode);
      setEncounterMonsters(shared.encounterMonsters);
      setExpandedMonsterTypes(shared.expandedMonsterTypes);
      setPendingGridMonsterId(shared.pendingGridMonsterId);
      setCombatGrid(shared.combatGrid);
      setCombatTracker(shared.combatTracker);
      setTrackerMode(shared.trackerMode);
      setTracker(shared.tracker);
      setTreasureXp(shared.treasureXp);
      setBonusXp(shared.bonusXp);
      setTokenPositions(shared.tokenPositions);
      setPlayerColors(shared.playerColors);
      setIsSessionLive(shared.isSessionLive);
    }
    tableHydrated.current = true;
  }, [campaign]);

  useEffect(() => {
    if (!monsterSources.length || monsterSources.includes(monsterSource)) return;
    setMonsterSource(monsterSources[0]);
  }, [monsterSource, monsterSources]);

  useEffect(() => {
    const nextState = {
      combatGrid,
      combatTracker,
      encounterMonsters,
      expandedMonsterTypes,
      mode,
      pendingGridMonsterId,
      bonusXp,
      playerColors,
      isSessionLive,
      tracker,
      trackerMode,
      treasureXp,
      tokenPositions,
    };
    saveDragoTableState(id, nextState);
    if (!tableHydrated.current) return;
    const timer = window.setTimeout(() => {
      api(`/1e/campaigns/${id}/table-state`, { method: "PUT", body: JSON.stringify(nextState) }).catch(() => {});
    }, 350);
    return () => window.clearTimeout(timer);
  }, [bonusXp, combatGrid, combatTracker, encounterMonsters, expandedMonsterTypes, id, isSessionLive, mode, pendingGridMonsterId, playerColors, tokenPositions, tracker, trackerMode, treasureXp]);

  useEffect(() => {
    if (campaign?.table_mode) setMode(campaign.table_mode);
  }, [campaign?.table_mode]);

  async function changeTableMode(nextMode) {
    setMode(nextMode);
    await api(`/1e/campaigns/${id}/table-state`, { method: "PUT", body: JSON.stringify({ table_mode: nextMode }) });
  }

  function moveToken(token, event) {
    const grid = event.currentTarget;
    const rect = grid.getBoundingClientRect();
    const cellWidth = rect.width / activeGrid.columns;
    const cellHeight = rect.height / activeGrid.rows;
    const footprint = token.footprint || { columns: 1, rows: 1 };
    const relativeX = Math.max(0, Math.min(rect.width - 1, event.clientX - rect.left));
    const relativeY = Math.max(0, Math.min(rect.height - 1, event.clientY - rect.top));
    const x = Math.max(1, Math.min(activeGrid.columns - footprint.columns + 1, Math.floor(relativeX / cellWidth) + 1));
    const y = Math.max(1, Math.min(activeGrid.rows - footprint.rows + 1, Math.floor(relativeY / cellHeight) + 1));
    const slotX = token.monster ? 0 : (relativeX % cellWidth) >= cellWidth / 2 ? 1 : 0;
    const slotY = token.monster ? 0 : (relativeY % cellHeight) >= cellHeight / 2 ? 1 : 0;
    setTokenPositions((positions) => ({ ...positions, [token.id]: { x, y, slotX, slotY } }));
  }

  function addMonsterToEncounter(monster = selectedMonster) {
    if (!monster) return;
    setEncounterMonsters((current) => {
      const sameTypeCount = current.filter((entry) => entry.monster_id === monster.id).length;
      const maxHp = rollHitPoints(monster.hit_dice);
      const footprint = monsterFootprint(monster);
      const next = {
        id: `enc-${monster.id}-${Date.now()}-${sameTypeCount + 1}`,
        monster_id: monster.id,
        number: sameTypeCount + 1,
        label: sameTypeCount === 0 ? monster.name : `${monster.name} ${sameTypeCount + 1}`,
        name: monster.name,
        current_hp: maxHp,
        max_hp: maxHp,
        dead: false,
        on_grid: false,
        footprint_key: footprint.key,
        token_label: monsterTokenLabel(monster.name, sameTypeCount + 1),
        monster,
      };
      return [...current, next];
    });
  }

  function updateEncounterMonster(instanceId, updater) {
    setEncounterMonsters((current) => current.map((monster) => monster.id === instanceId ? updater(monster) : monster));
  }

  function applyHpAdjustment(instanceId, direction, amountValue) {
    const amount = Number(amountValue);
    if (!Number.isFinite(amount) || amount <= 0) return;
    updateEncounterMonster(instanceId, (monster) => {
      const currentHp = direction === "damage"
        ? Math.max(0, monster.current_hp - amount)
        : Math.min(monster.max_hp, monster.current_hp + amount);
      return { ...monster, current_hp: currentHp, dead: currentHp <= 0 };
    });
    setHpEditor(null);
  }

  function markMonsterDead(instanceId) {
    updateEncounterMonster(instanceId, (monster) => ({ ...monster, current_hp: 0, dead: true }));
  }

  function updateMonsterFootprint(instanceId, footprintKey) {
    updateEncounterMonster(instanceId, (monster) => ({ ...monster, footprint_key: footprintKey }));
  }

  function setTrackerModeAndState(nextMode) {
    setTrackerMode(nextMode);
    setTracker(createTrackerState(nextMode));
  }

  function updateTracker(update) {
    setTracker((current) => ({ ...current, ...update }));
  }

  function updateCombatGrid(key, value) {
    const nextValue = Math.max(1, Math.min(30, Number(value) || 1));
    setCombatGrid((current) => ({ ...current, [key]: nextValue }));
  }

  function endCombat() {
    setEncounterMonsters([]);
    setExpandedMonsterTypes({});
    setPendingGridMonsterId(null);
    setHpEditor(null);
    setCombatTracker(createCombatTrackerState());
    setTokenPositions((positions) => Object.fromEntries(Object.entries(positions).filter(([key]) => !key.startsWith("monster-token-"))));
  }

  function toggleSessionLive() {
    setIsSessionLive((current) => !current);
  }

  async function distributeXpAwards() {
    const recipients = (campaign.characters || []).filter((character) => character.status !== "archived");
    const monsterAward = encounterMonsters.filter((monster) => monster.dead).reduce((sum, monster) => sum + monsterXp(monster.monster, monster.max_hp), 0);
    const totalAward = monsterAward + numericReward(treasureXp) + numericReward(bonusXp);
    if (!recipients.length || totalAward <= 0) return;
    const share = Math.floor(totalAward / recipients.length);
    const remainder = totalAward % recipients.length;
    setRewardBusy(true);
    setRewardMessage("");
    try {
      await Promise.all(recipients.map((character, index) => api(`/1e/characters/${character.id}`, {
        method: "PATCH",
        body: JSON.stringify({ xp: numericReward(character.xp) + share + (index < remainder ? 1 : 0) }),
      })));
      setTreasureXp(0);
      setBonusXp(0);
      setEncounterMonsters((current) => current.filter((monster) => !monster.dead));
      setExpandedMonsterTypes({});
      setRewardMessage(`Distributed ${totalAward} XP to ${recipients.length} character${recipients.length === 1 ? "" : "s"}.`);
      await reloadCampaign();
    } catch (err) {
      setRewardMessage(err.message || "Could not distribute XP.");
    } finally {
      setRewardBusy(false);
    }
  }

  function openExternalWindow(url, name) {
    window.open(url, name, "noopener,noreferrer,width=1200,height=820");
  }

  function addPendingMonsterToGrid(event) {
    if (!pendingMonster || mode !== "combat") return;
    moveToken({
      id: `monster-token-${pendingMonster.id}`,
      footprint: footprintByKey(pendingMonster.footprint_key || monsterFootprint(pendingMonster.monster).key),
      monster: true,
    }, event);
    setEncounterMonsters((current) => current.map((monster) => (
      monster.id === pendingMonster.id ? { ...monster, on_grid: true } : monster
    )));
    setPendingGridMonsterId(null);
  }

  if (loading || error || !campaign) return <PageState loading={loading} error={error} />;

  const modeLabel = mode === "combat" ? "Combat Mode" : mode === "hex_crawl" ? "Hex Crawl Mode" : "Mapping Mode";
  const gridTitle = mode === "combat" ? `${combatGrid.columns} x ${combatGrid.rows} Ten-Foot Area` : "Hex Crawl Coming Next";
  const gridEyebrow = mode === "combat" ? "10-Foot Tactical Grid" : "Campaign Travel";
  const monsterAward = encounterMonsters.filter((monster) => monster.dead).reduce((sum, monster) => sum + monsterXp(monster.monster, monster.max_hp), 0);
  const pendingAward = monsterAward + numericReward(treasureXp) + numericReward(bonusXp);

  return (
    <section className="drago-table-page">
      <Header
        eyebrow="Drago Table"
        title={campaign.name}
        className="workspace-header drago-table-header"
        action={<Link className="secondary-button" to={`/campaigns/${campaign.id}`}>Campaign Workspace</Link>}
      >
        <div className="workspace-meta">
          <span>{modeLabel}</span>
          <span>Session #{campaign.session_number || 1}</span>
          <span>Day {campaign.current_campaign_day || 1}</span>
          <span>{mode === "combat" ? "10 ft squares / four token slots" : mode === "mapping" ? "Player-authored graph paper" : "Wilderness travel hexes"}</span>
        </div>
      </Header>

      <div className="drago-modebar">
        <Tabs tabs={DRAGO_TABLE_MODES} activeTab={mode} onChange={changeTableMode} className="drago-mode-tabs" />
        <div className="drago-live-actions">
          <button type="button" className="ghost-button" onClick={() => openExternalWindow(playerPortalUrl(), "drago-player-view")}>Player View</button>
          <button type="button" className="ghost-button" onClick={() => openExternalWindow("/1e/", "drago-rules")}>Rules</button>
          <button type="button" className={isSessionLive ? "danger-button" : ""} onClick={toggleSessionLive}>
            {isSessionLive ? "Stop Session" : "Start Session"}
          </button>
        </div>
      </div>

      <div className="drago-table-layout">
        <aside className="panel drago-side-panel">
          <TrackerPanel mode={trackerMode} tracker={tracker} onModeChange={setTrackerModeAndState} onUpdate={updateTracker} />
          <CombatTrackerPanel tracker={combatTracker} onUpdate={setCombatTracker} onEndCombat={endCombat} />
          <DiceRollerPanel />
          <MonsterLibrarySidebar
            error={monsterError}
            loading={monsterLoading}
            monsters={filteredMonsters}
            query={monsterQuery}
            selectedMonster={selectedMonster}
            source={monsterSource}
            sources={monsterSources}
            onAdd={addMonsterToEncounter}
            onQueryChange={setMonsterQuery}
            onSelect={setSelectedMonsterId}
            onSourceChange={setMonsterSource}
          />
        </aside>

        {mode === "mapping" ? (
          <main className="panel drago-map-panel dm-mapping-control-panel">
            <DmMappingControls campaign={campaign} maps={campaignMaps || []} onReload={reloadMaps} />
          </main>
        ) : (
        <main className="panel drago-map-panel">
          <div className="drago-map-toolbar">
            <div>
              <p className="eyebrow">{gridEyebrow}</p>
              <h2>{gridTitle}</h2>
            </div>
            {mode === "combat" ? (
              <div className="grid-size-controls">
                <label>Width<input type="number" min="1" max="30" value={combatGrid.columns} onChange={(event) => updateCombatGrid("columns", event.target.value)} /></label>
                <label>Length<input type="number" min="1" max="30" value={combatGrid.rows} onChange={(event) => updateCombatGrid("rows", event.target.value)} /></label>
              </div>
            ) : <span className="status-pill">Hex crawl builder next phase</span>}
          </div>
          <div
            className={`drago-grid ${mode === "combat" ? "combat-grid" : "outdoors-grid"}`}
            style={{ "--grid-columns": activeGrid.columns, "--grid-rows": activeGrid.rows, aspectRatio: `${activeGrid.columns} / ${activeGrid.rows}` }}
            onPointerMove={(event) => {
              if (draggedToken) moveToken(draggedToken, event);
            }}
            onClick={addPendingMonsterToGrid}
            onPointerUp={() => setDraggedToken(null)}
            onPointerLeave={() => setDraggedToken(null)}
          >
            {mode === "combat" ? playerTokens.map((token) => (
              <TableToken key={token.id} grid={activeGrid} token={token} onDragStart={(event) => { setDraggedToken(token); moveToken(token, event); }} />
            )) : null}
            {mode === "combat" ? monsterTokens.map((token) => (
              <TableToken key={token.id} grid={activeGrid} token={token} monster onDragStart={(event) => { setDraggedToken(token); moveToken(token, event); }} />
            )) : null}
          </div>
        </main>
        )}

        <aside className="panel drago-monster-panel">
          <p className="eyebrow">Encounter</p>
          <EncounterList
            monsters={encounterMonsters}
            mode={mode}
            pendingGridMonsterId={pendingGridMonsterId}
            hpEditor={hpEditor}
            onApplyHp={applyHpAdjustment}
            onCloseHpEditor={() => setHpEditor(null)}
            onOpenHpEditor={(monsterId, direction) => setHpEditor({ monsterId, direction, amount: 1 })}
            onDead={markMonsterDead}
            onFootprint={updateMonsterFootprint}
            onPrepareGrid={setPendingGridMonsterId}
            onSetHpEditor={setHpEditor}
          />
        </aside>
      </div>

      <div className="drago-bottom-grid">
        <section className="panel monster-type-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Monsters</p>
              <h2>Stat Blocks</h2>
            </div>
            {pendingMonster ? <span className="status-pill">Click combat grid to place {pendingMonster.label}</span> : null}
          </div>
          <MonsterTypeCards
            groups={encounterGroups}
            expanded={expandedMonsterTypes}
            onToggle={(key) => setExpandedMonsterTypes((current) => ({ [key]: !current[key] }))}
          />
        </section>
        <section className="panel drago-roster-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Party</p>
              <h2>Character Snippets</h2>
            </div>
            <Link className="table-link" to={`/campaigns/${campaign.id}/characters`}>Manage</Link>
          </div>
          <div className="snippet-grid">
            {!playerTokens.length ? <p className="empty-state">No characters have been added to this campaign.</p> : null}
            {playerTokens.map((token) => (
              <div className="character-snippet" key={token.id}>
                <span className="snippet-token" style={{ background: token.color }}>{token.label}</span>
                <strong>{token.name}</strong>
                <dl>
                  <div><dt>HP</dt><dd>{token.hp}</dd></div>
                  <div><dt>AC</dt><dd>{token.ac}</dd></div>
                  <div><dt>Move</dt><dd>{token.move}</dd></div>
                  <div><dt>Status</dt><dd>{token.status}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </section>

        <section className="panel drago-reward-panel">
          <p className="eyebrow">Rewards</p>
          <RewardPanel
            bonusXp={bonusXp}
            busy={rewardBusy}
            message={rewardMessage}
            monsterXp={monsterAward}
            onBonusXp={setBonusXp}
            onDistribute={distributeXpAwards}
            onTreasureXp={setTreasureXp}
            pendingXp={pendingAward}
            recipients={(campaign.characters || []).filter((character) => character.status !== "archived").length}
            treasureXp={treasureXp}
          />
          <div className="notes-box">
            <strong>Encounter XP</strong>
            <p>Monster XP is added when a monster is marked dead. Treasure and bonus XP can be distributed to the current character cards.</p>
          </div>
        </section>
      </div>
    </section>
  );
}

const DRAGO_TABLE_MODES = [
  ["mapping", "Mapping"],
  ["combat", "Combat"],
  ["hex_crawl", "Hex Crawl"],
];

function createCombatTrackerState() {
  return { round: 1, activeSide: "party" };
}

function DmMappingControls({ campaign, maps, onReload }) {
  const [name, setName] = useState("");
  const [mapperId, setMapperId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const activeMap = maps.find((campaignMap) => campaignMap.id === campaign.active_map_id);
  const players = (campaign.players || []).filter((membership) => membership.role !== "observer" && membership.player);

  async function createMap(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await api(`/1e/campaigns/${campaign.id}/maps`, {
        method: "POST",
        body: JSON.stringify({ name, map_type: "square", mapper_user_id: mapperId ? Number(mapperId) : null }),
      });
      await api(`/1e/campaigns/${campaign.id}/table-state`, { method: "PUT", body: JSON.stringify({ active_map_id: created.id, table_mode: "mapping" }) });
      setName("");
      await onReload();
      window.location.reload();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function selectActiveMap(mapId) {
    await api(`/1e/campaigns/${campaign.id}/table-state`, { method: "PUT", body: JSON.stringify({ active_map_id: mapId ? Number(mapId) : null }) });
    window.location.reload();
  }

  async function assignMapper(mapId, userId) {
    await api(`/1e/campaigns/${campaign.id}/maps/${mapId}`, { method: "PUT", body: JSON.stringify({ mapper_user_id: userId ? Number(userId) : null }) });
    await onReload();
  }

  return (
    <div className="dm-mapping-controls">
      <div>
        <p className="eyebrow">Player Mapping</p>
        <h2>{activeMap?.name || "No active player map"}</h2>
        <p className="muted">You choose the active map here. Drawing and player viewing remain in the Drago Table player interface.</p>
      </div>
      <label>Active Player Map
        <select value={campaign.active_map_id || ""} onChange={(event) => selectActiveMap(event.target.value)}>
          <option value="">No active map</option>
          {maps.filter((map) => map.map_type === "square").map((map) => <option key={map.id} value={map.id}>{map.name}</option>)}
        </select>
      </label>
      {maps.length ? (
        <div className="dm-map-list">
          {maps.map((map) => (
            <label key={map.id}><span><strong>{map.name}</strong><small>{map.active_level} · Revision {map.revision}</small></span>
              <select value={map.mapper_user_id || ""} onChange={(event) => assignMapper(map.id, event.target.value)}>
                <option value="">No Mapper assigned</option>
                {players.map((membership) => <option key={membership.user_id} value={membership.user_id}>{membership.player.display_name || membership.player.player_name}</option>)}
              </select>
            </label>
          ))}
        </div>
      ) : null}
      <form className="dm-create-map" onSubmit={createMap}>
        <label>New Map Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Moathouse — Ground Floor" required /></label>
        <label>Mapper
          <select value={mapperId} onChange={(event) => setMapperId(event.target.value)}>
            <option value="">Assign later</option>
            {players.map((membership) => <option key={membership.user_id} value={membership.user_id}>{membership.player.display_name || membership.player.player_name}</option>)}
          </select>
        </label>
        <button disabled={saving}>{saving ? "Creating..." : "Create Player Map"}</button>
      </form>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}

function defaultDragoTableState() {
  return {
    bonusXp: 0,
    combatGrid: { columns: 8, rows: 8 },
    combatTracker: createCombatTrackerState(),
    encounterMonsters: [],
    expandedMonsterTypes: {},
    isSessionLive: false,
    mode: "mapping",
    pendingGridMonsterId: null,
    playerColors: {},
    tracker: createTrackerState("greyhawk"),
    trackerMode: "greyhawk",
    treasureXp: 0,
    tokenPositions: {},
  };
}

function loadDragoTableState(campaignId) {
  const defaults = defaultDragoTableState();
  if (typeof window === "undefined") return defaults;
  try {
    const saved = window.localStorage.getItem(`drago-table:${campaignId}`);
    if (!saved) return defaults;
    const parsed = JSON.parse(saved);
    return {
      ...defaults,
      ...parsed,
      combatGrid: { ...defaults.combatGrid, ...(parsed.combatGrid || {}) },
      combatTracker: { ...defaults.combatTracker, ...(parsed.combatTracker || {}) },
    };
  } catch {
    return defaults;
  }
}

function normalizeDragoTableState(state) {
  if (!state || typeof state !== "object" || !Object.keys(state).length) return null;
  const defaults = defaultDragoTableState();
  return {
    ...defaults,
    ...state,
    combatGrid: { ...defaults.combatGrid, ...(state.combatGrid || {}) },
    combatTracker: { ...defaults.combatTracker, ...(state.combatTracker || {}) },
    tracker: { ...defaults.tracker, ...(state.tracker || {}) },
    trackerMode: state.trackerMode || defaults.trackerMode,
    encounterMonsters: Array.isArray(state.encounterMonsters) ? state.encounterMonsters : [],
    expandedMonsterTypes: state.expandedMonsterTypes || {},
    isSessionLive: Boolean(state.isSessionLive),
    playerColors: state.playerColors || {},
    tokenPositions: state.tokenPositions || {},
  };
}

function saveDragoTableState(campaignId, state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`drago-table:${campaignId}`, JSON.stringify(state));
  } catch {
    // Local persistence is a convenience; storage failures should not interrupt play.
  }
}

function filterMonsterCatalog(monsters, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return monsters
    .filter((monster) => String(monster.name || "").toLowerCase().includes(needle))
    .sort((a, b) => {
      const aName = String(a.name || "").toLowerCase();
      const bName = String(b.name || "").toLowerCase();
      const aStarts = aName.startsWith(needle) ? 0 : 1;
      const bStarts = bName.startsWith(needle) ? 0 : 1;
      return aStarts - bStarts || aName.localeCompare(bName);
    });
}

function uniqueMonsterSources(monsters) {
  const sources = Array.from(new Set(monsters.map((monster) => monster.source || "Unknown"))).sort((a, b) => {
    if (a === "Monster Manual") return -1;
    if (b === "Monster Manual") return 1;
    return a.localeCompare(b);
  });
  return sources;
}

function monsterSourceLabel(source) {
  if (source === "OSRIC Core Rules" || source === "Legacy OSRIC Catalog") {
    return "Legacy Monster Catalog";
  }
  return source;
}

function monsterSourceReference(monster) {
  if (!monster) return "";
  const source = monster.source || (monster.is_core_osric ? "OSRIC Core Rules" : "Adventure");
  const page = monster.source_pdf_page ? ` p. ${monster.source_pdf_page}` : "";
  const supplemental = monster.supplemental_source ? ` · ${monster.supplemental_source}` : "";
  return `${monsterSourceLabel(source)}${page}${supplemental}`;
}

function numericReward(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function RewardPanel({ bonusXp, busy, message, monsterXp, onBonusXp, onDistribute, onTreasureXp, pendingXp, recipients, treasureXp }) {
  const share = recipients > 0 ? Math.floor(pendingXp / recipients) : 0;
  return (
    <div className="reward-flow">
      <div className="reward-ledger">
        <div><span>Monster XP</span><strong>{monsterXp}</strong></div>
        <label><span>Treasure XP</span><input type="number" min="0" value={treasureXp} onChange={(event) => onTreasureXp(event.target.value)} /></label>
        <label><span>Bonus XP</span><input type="number" min="0" value={bonusXp} onChange={(event) => onBonusXp(event.target.value)} /></label>
        <div><span>Pending Total</span><strong>{pendingXp}</strong></div>
      </div>
      <div className="reward-distribution">
        <span>{recipients ? `${recipients} recipient${recipients === 1 ? "" : "s"} · ${share} XP each${pendingXp % Math.max(1, recipients) ? " + remainder" : ""}` : "No character cards"}</span>
        <button type="button" className="table-button" disabled={busy || pendingXp <= 0 || recipients === 0} onClick={onDistribute}>
          {busy ? "Distributing..." : "Distribute XP"}
        </button>
      </div>
      {message ? <p className="compact-help">{message}</p> : null}
    </div>
  );
}

function MonsterLibrarySidebar({ error, loading, monsters, query, selectedMonster, source, sources, onAdd, onQueryChange, onSelect, onSourceChange }) {
  const showResults = query.trim().length > 0;
  return (
    <section className="monster-library">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Monsters</p>
          <h2>Add Monster</h2>
        </div>
      </div>
      <select
        aria-label="Monster source"
        className="monster-source-select"
        value={source}
        onChange={(event) => {
          onSourceChange(event.target.value);
          onQueryChange("");
        }}
      >
        {sources.length ? sources.map((option) => (
          <option key={option} value={option}>{monsterSourceLabel(option)}</option>
        )) : <option value={source}>{monsterSourceLabel(source)}</option>}
      </select>
      <input
        aria-label="Search monsters"
        placeholder="Type monster name..."
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <PageState loading={loading} error={error} />
      {selectedMonster ? <p className="compact-help">Last added: {selectedMonster.name}</p> : <p className="compact-help">Type a name, then click a result to add it.</p>}
      {showResults ? (
        <div className="monster-library-list">
          {monsters.map((monster) => (
            <button
              className={selectedMonster?.id === monster.id ? "active" : ""}
              key={monster.id}
              type="button"
              onClick={() => {
                onSelect(monster.id);
                onAdd(monster);
              }}
            >
              <strong>{monster.name}</strong>
              <span>AC {monster.armor_class || "-"} · HD {monster.hit_dice || "-"} · XP {monster.level_xp || "-"}</span>
              <span>{monsterSourceReference(monster)}</span>
            </button>
          ))}
        </div>
      ) : null}
      {showResults && !loading && !error && monsters.length === 0 ? <p className="muted">No monsters match that search.</p> : null}
    </section>
  );
}

function MonstersPage() {
  const { data, error, loading } = useLoad(() => api("/1e/monsters?include_source_text=true"), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const selectedMonsterId = searchParams.get("monster") || "";
  const monsters = data || [];
  const sortedMonsters = useMemo(
    () => [...monsters].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [monsters],
  );
  const visibleMonsters = useMemo(
    () => (query.trim() ? filterMonsterCatalog(monsters, query) : sortedMonsters),
    [monsters, query, sortedMonsters],
  );
  const selectedMonster = useMemo(
    () => monsters.find((monster) => String(monster.id) === selectedMonsterId) || visibleMonsters[0] || null,
    [monsters, selectedMonsterId, visibleMonsters],
  );

  function updateQuery(value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("q", value);
    else next.delete("q");
    next.delete("monster");
    setSearchParams(next);
  }

  function selectMonster(monsterId) {
    const next = new URLSearchParams(searchParams);
    next.set("monster", monsterId);
    setSearchParams(next);
  }

  return (
    <section>
      <Header
        eyebrow="DM Reference"
        title="Monsters"
        copy="Browse the legacy and adventure monster records currently installed. The Monster Manual import is still pending."
        action={<a className="secondary-button" href="/monsters" target="_blank" rel="noreferrer">Open in New Tab</a>}
      />
      <PageState loading={loading} error={error} />
      {!loading && !error ? (
        <div className="rules-browser monster-browser">
          <Panel className="rules-sidebar">
            <label>Search
              <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Monster name..." />
            </label>
            <div className="tracker-status-box">
              <strong>{visibleMonsters.length} monsters</strong>
              <span>Click a name to view its full monster entry.</span>
            </div>
          </Panel>

          <Panel className="rules-results">
            <div className="rules-panel-heading">
              <div>
                <p className="eyebrow">Glossary</p>
                <h2>{query.trim() ? "Search Results" : "All Monsters"}</h2>
              </div>
            </div>
            {visibleMonsters.length ? (
              <div className="reference-list monster-glossary-list">
                {visibleMonsters.map((monster) => (
                  <button
                    className={`reference-row ${selectedMonster?.id === monster.id ? "active" : ""}`}
                    key={monster.id}
                    type="button"
                    onClick={() => selectMonster(monster.id)}
                  >
                    <div>
                      <strong>{monster.name}</strong>
                      <p>AC {monster.armor_class || "-"} · HD {monster.hit_dice || "-"} · XP {monster.level_xp || "-"}</p>
                    </div>
                    <div className="reference-meta">
                      <span>{monsterSourceReference(monster)}</span>
                      <span>{monster.size || "Size -"}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">No monsters match that search.</p>
            )}
          </Panel>

          <Panel className="rules-detail">
            {selectedMonster ? <MonsterGlossaryDetail monster={selectedMonster} /> : <p className="muted">Select a monster to view the complete entry.</p>}
          </Panel>
        </div>
      ) : null}
    </section>
  );
}

function MonsterGlossaryDetail({ monster }) {
  const facts = [
    ["AC", monster.armor_class],
    ["HD", monster.hit_dice],
    ["Move", monster.movement],
    ["Attacks", monster.attacks],
    ["Damage", monster.damage],
    ["THAC0", monsterThac0(monster.hit_dice)],
    ["Hit +", monsterAttackBonus(monster)],
    ["Size", monster.size],
    ["Morale", monster.morale],
    ["Alignment", monster.alignment],
    ["XP", monster.level_xp],
    ["Lair", monster.in_lair],
  ];
  return (
    <article className="reference-detail-view monster-glossary-detail">
      <div className="detail-title-row">
        <div>
          <p className="eyebrow">{monsterSourceReference(monster)}</p>
          <h2>{monster.name}</h2>
        </div>
      </div>
      <dl className="reference-facts monster-detail-facts">
        {facts.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value || "-"}</dd></div>
        ))}
      </dl>
      <MonsterTextSection title="Special Attacks" value={monster.special_attacks} />
      <MonsterTextSection title="Special Defences" value={monster.special_defences} />
      <MonsterTextSection title="Description" value={monster.description} />
      <MonsterTextSection title="Treasure" value={monster.treasure} />
      {monster.source_text ? (
        <details className="monster-source-block">
          <summary>Full Source Block</summary>
          <pre>{monster.source_text}</pre>
        </details>
      ) : null}
    </article>
  );
}

function EncounterList({ monsters, mode, pendingGridMonsterId, hpEditor, onApplyHp, onCloseHpEditor, onDead, onFootprint, onOpenHpEditor, onPrepareGrid, onSetHpEditor }) {
  if (!monsters.length) {
    return <p className="muted">No monsters added yet.</p>;
  }
  return (
    <div className="encounter-mini-list">
      {monsters.map((monster) => (
        <article className={`encounter-mini-card ${monster.dead ? "is-dead" : ""}`} key={monster.id}>
          <div className="encounter-mini-top">
            <strong>{monster.label}</strong>
            <span>{monster.current_hp}/{monster.max_hp} HP</span>
          </div>
          <div className="monster-actions compact-actions">
            <button type="button" className="table-button" onClick={() => onOpenHpEditor(monster.id, "damage")}>Damage</button>
            <button type="button" className="table-button" onClick={() => onOpenHpEditor(monster.id, "heal")}>Heal</button>
            <button type="button" className="table-button" onClick={() => onDead(monster.id)}>Dead</button>
          </div>
          <label className="footprint-control">Token
            <select value={monster.footprint_key || monsterFootprint(monster.monster).key} onChange={(event) => onFootprint(monster.id, event.target.value)}>
              {MONSTER_FOOTPRINTS.map((footprint) => <option key={footprint.key} value={footprint.key}>{footprint.label}</option>)}
            </select>
          </label>
          {hpEditor?.monsterId === monster.id ? (
            <form
              className="hp-popover"
              onSubmit={(event) => {
                event.preventDefault();
                onApplyHp(monster.id, hpEditor.direction, hpEditor.amount);
              }}
            >
              <label>{hpEditor.direction === "damage" ? "Damage" : "Heal"}
                <input
                  autoFocus
                  type="number"
                  min="1"
                  value={hpEditor.amount}
                  onChange={(event) => onSetHpEditor({ ...hpEditor, amount: event.target.value })}
                />
              </label>
              <div>
                <button type="submit" className="table-button">Apply</button>
                <button type="button" className="table-button" onClick={onCloseHpEditor}>Cancel</button>
              </div>
            </form>
          ) : null}
          <button
            type="button"
            className={`table-button add-grid-button ${pendingGridMonsterId === monster.id ? "active" : ""}`}
            disabled={mode !== "combat" || monster.dead}
            onClick={() => onPrepareGrid(monster.id)}
          >
            {monster.on_grid ? "Move On Grid" : mode === "combat" ? "Add To Grid" : "Combat Grid Only"}
          </button>
        </article>
      ))}
    </div>
  );
}

function CombatTrackerPanel({ tracker, onUpdate, onEndCombat }) {
  const activeLabel = tracker.activeSide === "party" ? "Party Turn" : "Monster Turn";
  return (
    <section className="combat-tracker">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Combat</p>
          <h2>Round {tracker.round}</h2>
        </div>
        <span className="status-pill">{activeLabel}</span>
      </div>
      <div className="combat-turn-toggle">
        <button type="button" className={tracker.activeSide === "party" ? "active" : ""} onClick={() => onUpdate((current) => ({ ...current, activeSide: "party" }))}>Party</button>
        <button type="button" className={tracker.activeSide === "monsters" ? "active" : ""} onClick={() => onUpdate((current) => ({ ...current, activeSide: "monsters" }))}>Monsters</button>
      </div>
      <div className="tracker-button-group">
        <button type="button" className="table-button" onClick={() => onUpdate((current) => ({ ...current, round: current.round + 1, activeSide: "party" }))}>Advance Round</button>
        <button type="button" className="table-button" onClick={onEndCombat}>End Combat</button>
      </div>
    </section>
  );
}

function DiceRollerPanel() {
  const dice = [20, 12, 10, 8, 6, 4, 100];
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [lastRoll, setLastRoll] = useState(null);

  function rollDie(sides) {
    const quantity = Math.max(1, count);
    const rolls = Array.from({ length: quantity }, () => Math.floor(Math.random() * sides) + 1);
    const subtotal = rolls.reduce((sum, value) => sum + value, 0);
    setLastRoll({
      formula: `${quantity}d${sides}${modifier ? `${modifier > 0 ? "+" : ""}${modifier}` : ""}`,
      rolls,
      total: subtotal + modifier,
    });
  }

  return (
    <section className="dice-roller">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Dice</p>
          <h2>Roller</h2>
        </div>
        {lastRoll ? <span className="status-pill">{lastRoll.formula}</span> : null}
      </div>
      <div className="dice-controls">
        <label>Dice
          <span>
            <button type="button" onClick={() => setCount((value) => Math.max(1, value - 1))}>-</button>
            <strong>{count}</strong>
            <button type="button" onClick={() => setCount((value) => Math.min(20, value + 1))}>+</button>
          </span>
        </label>
        <label>Mod
          <span>
            <button type="button" onClick={() => setModifier((value) => Math.max(-99, value - 1))}>-</button>
            <strong>{modifier >= 0 ? `+${modifier}` : modifier}</strong>
            <button type="button" onClick={() => setModifier((value) => Math.min(99, value + 1))}>+</button>
          </span>
        </label>
      </div>
      <div className="dice-button-grid">
        {dice.map((sides) => (
          <button key={sides} type="button" className="table-button" onClick={() => rollDie(sides)}>D{sides}</button>
        ))}
      </div>
      {lastRoll ? (
        <div className="dice-result">
          <strong>{lastRoll.total}</strong>
          <span>{lastRoll.rolls.join(" + ")}{modifier ? ` ${modifier > 0 ? "+" : "-"} ${Math.abs(modifier)}` : ""}</span>
        </div>
      ) : <p className="compact-help">Set dice and modifier, then tap a die.</p>}
    </section>
  );
}

function MonsterTypeCards({ groups, expanded, onToggle }) {
  if (!groups.length) {
    return <p className="muted">Added monster types will appear here in compact initiative cards.</p>;
  }
  return (
    <div className="monster-type-grid">
      {groups.map((group) => (
        <MonsterTypeCard
          expanded={Boolean(expanded[group.key])}
          group={group}
          key={group.key}
          onToggle={() => onToggle(group.key)}
        />
      ))}
    </div>
  );
}

function MonsterTypeCard({ group, expanded, onToggle }) {
  const monster = group.monster;
  const facts = [
    ["AC", monster.armor_class],
    ["HD", monster.hit_dice],
    ["Move", monster.movement],
    ["Attacks", monster.attacks],
    ["Damage", monster.damage],
    ["THAC0", monsterThac0(monster.hit_dice)],
    ["Hit +", monsterAttackBonus(monster)],
    ["Size", monster.size],
    ["XP", `${monsterXp(monster, group.averageHp)} avg`],
  ];
  return (
    <article className="monster-type-card">
      <div className="monster-card-header">
        <div>
          <h2>{monster.name}</h2>
          <span>{group.instances.length} in encounter · {monsterSourceReference(monster)}</span>
        </div>
        <button type="button" className="expand-button" onClick={onToggle} aria-label={expanded ? "Collapse monster stat block" : "Expand monster stat block"}>
          {expanded ? "-" : "+"}
        </button>
      </div>
      <dl className="monster-type-facts">
        {facts.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value || "-"}</dd></div>
        ))}
      </dl>
      {expanded ? (
        <div className="monster-expanded-block">
          <MonsterTextSection title="Special Attacks" value={monster.special_attacks} />
          <MonsterTextSection title="Special Defences" value={monster.special_defences} />
          <MonsterTextSection title="Description" value={monster.description} />
          <MonsterTextSection title="Treasure" value={monster.treasure} />
          {monster.source_text ? (
            <details className="monster-source-block">
              <summary>Full Source Block</summary>
              <pre>{monster.source_text}</pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function MonsterTextSection({ title, value, compact = false }) {
  if (!value || value === "None" || value === "Nil") return null;
  return (
    <section className={`monster-text-section ${compact ? "compact" : ""}`}>
      <h3>{title}</h3>
      <p>{value}</p>
    </section>
  );
}

function TrackerPanel({ mode, tracker, onModeChange, onUpdate }) {
  const dragonlance = mode === "dragonlance";
  return (
    <section className="tracker-console">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Trackers</p>
          <h2>{dragonlance ? "Dragonlance 1985" : "Classic Tracker"}</h2>
        </div>
        <select aria-label="Tracker preset" value={mode} onChange={(event) => onModeChange(event.target.value)}>
          <option value="dragonlance">Dragonlance</option>
          <option value="greyhawk">Greyhawk</option>
        </select>
      </div>
      <div className="tracker-status-box">
        <strong>{tracker.weekday}, {tracker.day} {tracker.month}, {tracker.year}</strong>
        <span>Time: {tracker.time}</span>
        <span>Turn: {tracker.turn}</span>
        <span>Rest: {tracker.turnsSinceRest} / 5</span>
        <span>Torch: {tracker.torchLit ? "Lit" : "Unlit"} · {tracker.torchTurns} turn(s) · Carried {tracker.torches}</span>
        <span>Lantern: {tracker.lanternLit ? "Lit" : "Unlit"} · Oil {tracker.oil}</span>
        {dragonlance ? <span>Moons: Sol {tracker.solinari} / Lun {tracker.lunitari} / Nui {tracker.nuitari}</span> : null}
      </div>
      <div className="tracker-button-group">
        <button type="button" className="table-button" onClick={() => openTrackerStatusWindow(mode, tracker)}>Status</button>
        <button type="button" className="table-button">Calendar</button>
        {dragonlance ? <button type="button" className="table-button">Moons</button> : null}
        <button type="button" className="table-button">Help</button>
      </div>
      <div className="tracker-button-group">
        <button type="button" className="table-button" onClick={() => onUpdate({ turn: tracker.turn + 1, turnsSinceRest: tracker.turnsSinceRest + 1 })}>Turn</button>
        <button type="button" className="table-button" onClick={() => onUpdate({ turnsSinceRest: 0 })}>Rest</button>
        <button type="button" className="table-button">+10m</button>
        <button type="button" className="table-button">+30m</button>
        <button type="button" className="table-button">+1h</button>
        <button type="button" className="table-button">+1d</button>
      </div>
      <div className="tracker-button-group">
        <button type="button" className="table-button" onClick={() => onUpdate({ torches: tracker.torches + 1 })}>+1 Torch</button>
        <button type="button" className="table-button" onClick={() => onUpdate({ torches: tracker.torches + 5 })}>+5 Torches</button>
        <button type="button" className="table-button" onClick={() => onUpdate({ torches: Math.max(0, tracker.torches - 1) })}>-1 Torch</button>
        <button type="button" className="table-button" onClick={() => onUpdate({ torchLit: true, torchTurns: 6 })}>Light Torch</button>
        <button type="button" className="table-button" onClick={() => onUpdate({ torchLit: false, torchTurns: 0 })}>Snuff Torch</button>
      </div>
      <div className="tracker-button-group">
        <button type="button" className="table-button" onClick={() => onUpdate({ oil: tracker.oil + 1 })}>+1 Oil</button>
        <button type="button" className="table-button" onClick={() => onUpdate({ oil: tracker.oil + 5 })}>+5 Oil</button>
        <button type="button" className="table-button" onClick={() => onUpdate({ oil: Math.max(0, tracker.oil - 1) })}>-1 Oil</button>
        <button type="button" className="table-button" onClick={() => onUpdate({ lanternLit: true })}>Light Lantern</button>
        <button type="button" className="table-button" onClick={() => onUpdate({ lanternLit: false })}>Snuff Lantern</button>
      </div>
      {dragonlance ? (
        <div className="tracker-button-group">
          <button type="button" className="table-button">Set Solinari</button>
          <button type="button" className="table-button">Set Lunitari</button>
          <button type="button" className="table-button">Set Nuitari</button>
        </div>
      ) : null}
    </section>
  );
}

const DRAGO_MARCHING_GRID = { columns: 2, rows: 6 };
const DRAGO_OUTDOORS_GRID = { columns: 12, rows: 8 };

function buildPlayerTokens(characters, playerColors = {}) {
  return characters.slice(0, 6).map((character, index) => ({
    id: `pc-${character.id}`,
    name: character.name || `Character ${index + 1}`,
    label: String(character.name || "PC").slice(0, 2).toUpperCase(),
    color: playerColors[`pc-${character.id}`] || PLAYER_TOKEN_COLORS[index % PLAYER_TOKEN_COLORS.length].value,
    hp: characterHpText(character),
    ac: characterAcText(character),
    move: characterMoveText(character),
    status: character.life_status || character.status || "Ready",
    x: 1,
    y: Math.floor(index / 4) + 1,
    slotX: index % 2,
    slotY: Math.floor((index % 4) / 2),
  }));
}

function characterHpValues(character) {
  const combat = character?.combat || {};
  const maxHp = Number(combat.max_hp ?? character?.max_hp ?? character?.hit_points ?? 0);
  const currentHp = Number(combat.current_hp ?? character?.current_hp ?? maxHp);
  return {
    current: Number.isFinite(currentHp) ? currentHp : 0,
    max: Number.isFinite(maxHp) ? maxHp : 0,
    temporary: Number(combat.temporary_hp ?? 0) || 0,
  };
}

function characterHpText(character) {
  const hp = characterHpValues(character);
  return `${Number.isFinite(hp.current) ? hp.current : "-"} / ${hp.max || "-"}`;
}

function characterAcText(character) {
  return character?.combat?.armor_class ?? character?.armor_class ?? character?.ac ?? "-";
}

function characterMoveText(character) {
  return character?.combat?.movement_rate ?? character?.movement_rate ?? character?.move ?? "12";
}

function characterThac0Text(character) {
  const thac0 = character?.combat?.runtime?.thac0;
  return thac0?.final_thac0 ?? thac0?.base_thac0 ?? thac0?.value ?? "-";
}

function characterAttackRateText(character) {
  const rate = character?.combat?.runtime?.attacks_per_round;
  return rate?.attacks_per_round ?? rate?.value ?? rate ?? "1";
}

function characterWeaponRows(character) {
  const weapons = character?.combat?.runtime?.weapons || [];
  return weapons.slice(0, 4).map((weapon) => ({
    name: weapon.weapon || "Weapon",
    attack: weapon.final_attack_value ?? weapon.total_attack_bonus ?? "-",
    damage: weapon.damage?.final_small_medium || weapon.damage?.base_small_medium || "-",
    speed: weapon.weapon_speed ?? "—",
    range: weapon.range?.raw || null,
    mode: weapon.mode || "melee",
  }));
}

function availablePlayerTokenColors(tableState, tokenId) {
  const used = new Set(
    Object.entries(tableState.playerColors || {})
      .filter(([id]) => id !== tokenId)
      .map(([, color]) => color),
  );
  return PLAYER_TOKEN_COLORS.filter((color) => !used.has(color.value));
}

function applyTokenPositions(tokens, positions) {
  return tokens.map((token) => ({ ...token, ...(positions[token.id] || {}) }));
}

function buildMonsterTokens(encounterMonsters) {
  return encounterMonsters
    .filter((monster) => monster.on_grid && !monster.dead)
    .map((monster, index) => {
      const footprint = footprintByKey(monster.footprint_key || monsterFootprint(monster.monster).key);
      return {
        id: `monster-token-${monster.id}`,
        name: `${monster.label} (${footprint.label})`,
        label: monster.token_label,
        color: monsterHealthColor(monster),
        footprint,
        monster: true,
        x: 5 + (index % 4),
        y: 4 + Math.floor(index / 4),
        slotX: 0,
        slotY: 0,
      };
    });
}

const PLAYER_TOKEN_COLORS = [
  { key: "white", label: "White", value: "#f8f4e8" },
  { key: "gold", label: "Gold", value: "#d6a94d" },
  { key: "pink", label: "Pink", value: "#f08fbc" },
  { key: "blue", label: "Blue", value: "#5aa7e8" },
  { key: "silver", label: "Silver", value: "#c8ccd2" },
  { key: "purple", label: "Purple", value: "#9b78e6" },
  { key: "gray", label: "Gray", value: "#5b6068" },
  { key: "turquoise", label: "Turquoise", value: "#31c6c0" },
];

function monsterHealthColor(monster) {
  const maxHp = Math.max(1, Number(monster.max_hp) || 1);
  const ratio = Math.max(0, Number(monster.current_hp) || 0) / maxHp;
  if (ratio < 0.25) return "#b93a31";
  if (ratio <= 0.5) return "#d87b24";
  return "#4f9d55";
}

function groupEncounterMonsters(encounterMonsters) {
  const groups = new Map();
  for (const instance of encounterMonsters) {
    const key = String(instance.monster_id);
    if (!groups.has(key)) {
      groups.set(key, { key, monster: instance.monster, instances: [], averageHp: instance.max_hp });
    }
    groups.get(key).instances.push(instance);
  }
  return Array.from(groups.values()).map((group) => ({
    ...group,
    averageHp: Math.max(1, Math.round(group.instances.reduce((sum, monster) => sum + monster.max_hp, 0) / group.instances.length)),
  }));
}

function monsterTokenLabel(name, number) {
  const words = String(name || "M").replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "M";
  return `${initials}${number > 1 ? number : ""}`.slice(0, 3);
}

const MONSTER_FOOTPRINTS = [
  { key: "slot", label: "Standard", columns: 0.45, rows: 0.45, color: "#b76b5b" },
  { key: "1x1", label: "1 x 1", columns: 1, rows: 1, color: "#b76b5b" },
  { key: "2x1", label: "2 x 1", columns: 2, rows: 1, color: "#b76b5b" },
  { key: "1x2", label: "1 x 2", columns: 1, rows: 2, color: "#b76b5b" },
  { key: "2x2", label: "2 x 2", columns: 2, rows: 2, color: "#a8574e" },
  { key: "1x3", label: "1 x 3", columns: 1, rows: 3, color: "#a8574e" },
  { key: "3x1", label: "3 x 1", columns: 3, rows: 1, color: "#a8574e" },
];

function footprintByKey(key) {
  return MONSTER_FOOTPRINTS.find((footprint) => footprint.key === key) || MONSTER_FOOTPRINTS[1];
}

function monsterFootprint(monster) {
  const text = [monster?.name, monster?.size, monster?.description].filter(Boolean).join(" ").toLowerCase();
  const lengthMatch = text.match(/(\d+)\s*ft\s+long/);
  const length = lengthMatch ? Number(lengthMatch[1]) : 0;
  if (/dragon|purple worm|giant snake|constrictor|crocodile|lizard|eel|serpent/.test(text) && length >= 25) return footprintByKey("2x2");
  if (/huge|gargantuan|mammoth|whale|elephant|dinosaur/.test(text)) return footprintByKey("2x2");
  if (/large/.test(text) && /long/.test(text) && length >= 20) return footprintByKey("2x1");
  if (/large|giant|ogre|troll|minotaur|bear/.test(text)) return footprintByKey("1x1");
  return footprintByKey("slot");
}

function parseHitDice(hitDice) {
  const text = String(hitDice || "1").replace(/\s+/g, "");
  const match = text.match(/(\d+)(?:d(\d+))?/i);
  const dice = match ? Number(match[1]) : 1;
  const sides = match?.[2] ? Number(match[2]) : 8;
  const flatMatches = [...text.matchAll(/([+-])(\d+)(?!d)/g)];
  const flat = flatMatches.reduce((sum, matchItem) => sum + (matchItem[1] === "-" ? -1 : 1) * Number(matchItem[2]), 0);
  return { dice: Math.max(1, dice), sides: Math.max(1, sides), flat };
}

function rollHitPoints(hitDice) {
  const { dice, sides, flat } = parseHitDice(hitDice);
  let total = flat;
  for (let index = 0; index < dice; index += 1) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return Math.max(1, total);
}

function monsterThac0(hitDice) {
  const { dice } = parseHitDice(hitDice);
  return Math.max(8, 20 - Math.max(0, dice - 1));
}

function monsterAttackBonus(monster) {
  const text = [monster?.attacks, monster?.damage, monster?.special_attacks, monster?.description].filter(Boolean).join(" ");
  const match = text.match(/([+-]\d+)\s*(?:to hit|to-hit|attack|hit)/i);
  return match ? match[1] : "+0";
}

function monsterXp(monster, hp) {
  const text = String(monster?.level_xp || "");
  const baseMatch = text.match(/\/\s*([0-9,]+)/);
  const perHpMatch = text.match(/\+\s*([0-9,]+)\s*\/?\s*hp/i);
  const base = baseMatch ? Number(baseMatch[1].replace(/,/g, "")) : 0;
  const perHp = perHpMatch ? Number(perHpMatch[1].replace(/,/g, "")) : 0;
  if (base || perHp) return base + perHp * Math.max(1, Number(hp) || 1);
  return fallbackMonsterXp(monster, hp);
}

function fallbackMonsterXp(monster, hp) {
  const hdText = String(monster?.hit_dice || "");
  const matches = [...hdText.matchAll(/\d+/g)].map((match) => Number(match[0])).filter(Number.isFinite);
  const hd = Math.max(1, Math.max(...matches, 1));
  const row = [
    [1, 10, 1],
    [2, 20, 2],
    [3, 35, 3],
    [4, 75, 4],
    [5, 175, 5],
    [6, 275, 6],
    [7, 450, 8],
    [8, 650, 10],
    [9, 900, 12],
    [10, 1100, 14],
    [11, 1300, 16],
    [12, 1550, 18],
    [13, 1800, 20],
    [14, 2100, 22],
    [15, 2400, 24],
    [16, 2800, 26],
  ].find(([level]) => hd <= level) || [hd, 3000 + (hd - 16) * 400, 28 + (hd - 16) * 2];
  return row[1] + row[2] * Math.max(1, Number(hp) || 1);
}

function createTrackerState(mode) {
  return {
    weekday: mode === "dragonlance" ? "Seventhday" : "Godsday",
    day: 21,
    month: mode === "dragonlance" ? "Rannmont" : "Harvester",
    year: mode === "dragonlance" ? "346 AC" : "576 CY",
    time: "10:00",
    turn: 21,
    turnsSinceRest: 3,
    torchLit: true,
    torchTurns: 3,
    torches: 2,
    lanternLit: false,
    oil: 0,
    solinari: "Low",
    lunitari: "Waxing",
    nuitari: "Low",
  };
}

function openTrackerStatusWindow(mode, tracker) {
  const moons = mode === "dragonlance"
    ? `<section><strong>Moons</strong><br>Sol: ${tracker.solinari}<br>Lun: ${tracker.lunitari}<br>Nui: ${tracker.nuitari}</section>`
    : "";
  const popup = window.open("", "drago-tracker-status", "width=360,height=620");
  if (!popup) return;
  popup.document.write(`
    <html><head><title>Drago Table Status</title><style>
      body{background:#121212;color:#eee;font-family:Arial,sans-serif;margin:0;padding:22px}
      article{border:1px solid #555;padding:16px} h1{font-size:18px;letter-spacing:2px;text-transform:uppercase}
      section{border-top:1px solid #aaa;margin-top:18px;padding-top:18px;line-height:1.45}
    </style></head><body><article>
      <h1>${mode === "dragonlance" ? "Dragolance 1985" : "Classic"} - Dungeon Status</h1>
      <section><strong>Dungeon Turn:</strong> ${tracker.turn}<br><strong>${tracker.weekday}, ${tracker.day} ${tracker.month}, ${tracker.year}</strong><br>Time: ${tracker.time}</section>
      <section><strong>Light</strong><br>Torch: ${tracker.torchLit ? "Lit" : "Unlit"} - ${tracker.torchTurns} turn(s)<br>Torches carried: ${tracker.torches}<br>Lantern: ${tracker.lanternLit ? "Lit" : "Unlit"}<br>Oil carried: ${tracker.oil}</section>
      <section><strong>Exploration</strong><br>Turns since rest: ${tracker.turnsSinceRest} / 5<br>Rest due in ${Math.max(0, 5 - tracker.turnsSinceRest)} turn(s)</section>
      ${moons}
    </article></body></html>
  `);
  popup.document.close();
}

function TableToken({ grid, token, monster = false, disabled = false, onDragStart }) {
  const slotX = token.slotX || 0;
  const slotY = token.slotY || 0;
  const footprint = monster ? (token.footprint || footprintByKey("1x1")) : { columns: 0.38, rows: 0.38 };
  const insetX = monster ? 4 / grid.columns : 6 / grid.columns;
  const insetY = monster ? 4 / grid.rows : 6 / grid.rows;
  const width = monster ? Math.max(0.1, (footprint.columns * 100) / grid.columns - insetX * 2) : 38 / grid.columns;
  const height = monster ? Math.max(0.1, (footprint.rows * 100) / grid.rows - insetY * 2) : 38 / grid.rows;
  const left = ((token.x - 1) * 100) / grid.columns + (monster ? insetX : (slotX * 50) / grid.columns + 6 / grid.columns);
  const top = ((token.y - 1) * 100) / grid.rows + (monster ? insetY : (slotY * 50) / grid.rows + 6 / grid.rows);
  return (
    <button
      type="button"
      className={`table-token ${monster ? "monster-token" : ""}`}
      disabled={disabled}
      title={token.name}
      style={{ "--token-color": token.color, height: `${height}%`, left: `${left}%`, top: `${top}%`, width: `${width}%` }}
      onPointerDown={(event) => {
        if (!onDragStart || disabled) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        onDragStart(event);
      }}
    >
      {token.label}
    </button>
  );
}

function TrackerCard({ label, value, note, meta }) {
  return (
    <div className="tracker-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
      {meta ? <em>{meta}</em> : null}
    </div>
  );
}

function MonsterCard({ monster }) {
  return (
    <article className={`monster-card ${monster.status === "Dead" ? "is-dead" : ""}`}>
      <div className="monster-card-header">
        <div>
          <strong>{monster.name}</strong>
          <span>{monster.status}</span>
        </div>
        <span className="status-pill">{monster.xp} XP</span>
      </div>
      <dl>
        <div><dt>AC</dt><dd>{monster.ac}</dd></div>
        <div><dt>HP</dt><dd>{monster.hp}</dd></div>
        <div><dt>Attack</dt><dd>{monster.attacks}</dd></div>
        <div><dt>Damage</dt><dd>{monster.damage}</dd></div>
        <div><dt>Morale</dt><dd>{monster.morale}</dd></div>
      </dl>
      <div className="monster-actions">
        <button type="button" className="table-button">Damage</button>
        <button type="button" className="table-button">Heal</button>
        <button type="button" className="table-button">Dead</button>
      </div>
    </article>
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
            <a className="table-link" href={`/1e/characters/${character.id}/?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`} target="_blank" rel="noreferrer">Open Sheet</a>
            <a className="table-link" href={`/1e/characters/${character.id}/edit/?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`}>Edit</a>
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
        eyebrow="Drago Table"
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
              <h2>Dragolance Reference</h2>
              <p className="portal-copy">Read our player-safe Krynn reference before choosing a race, class, deity, or order.</p>
              <div className="form-actions">
                <Link className="secondary-button" to="/dragonlance">Open Reference</Link>
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
  if (campaigns.length > 1) return <Link className="secondary-button" to={playerCharacterChooserPath()}>Create Character</Link>;
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
        <a className="secondary-button" href={`/1e/characters/${character.id}/?player=1`}>View</a>
        <a className="table-link" href={`/1e/characters/${character.id}/edit/?player=1`}>Edit</a>
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
    ensureStylesheet(versionedClassicAsset("/styles/character-vault.css"), "character-vault");
    document.querySelector("[data-vault-app]")?.replaceChildren();
    loadClassicScript(versionedClassicAsset("/components/first-edition-app.js"), "player-vault-rules-nav")
      .then(() => loadClassicScript(versionedClassicAsset("/components/character-vault.js"), "player-vault-character-vault"))
      .catch((error) => {
        const node = document.querySelector("[data-vault-app]");
        if (node) node.textContent = error?.message || "Unable to load character tools.";
      });
  }, [id, location.pathname, location.search]);

  return <main className="vault-shell" data-vault-app />;
}

function versionedClassicAsset(path) {
  return `${path}?v=${CLASSIC_STATIC_VERSION}`;
}

function ensureStylesheet(href, id = "") {
  const selector = id ? `link[data-classic-stylesheet="${id}"]` : `link[href="${href}"]`;
  const existing = document.querySelector(selector);
  if (existing?.getAttribute("href") === href) return;
  existing?.remove();
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  if (id) link.dataset.classicStylesheet = id;
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
        eyebrow="Drago Table"
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
  const { data: campaign, error, loading, reload } = useLoad(() => api(`/player/campaigns/${id}`, { auth: "player" }), [id]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const timer = window.setInterval(() => reload({ silent: true }), 2500);
    return () => window.clearInterval(timer);
  }, [id]);

  if (loading || error || !campaign) return <PageState loading={loading} error={error} />;

  const character = campaign.my_character || playerCharacterForCampaign(campaign, activePlayerId);

  return (
    <section className="player-portal-page">
      <CampaignHeader campaign={campaign} eyebrow="Campaign Home" />
      <PlayerTabs activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === "overview" ? <PlayerOverviewTab campaign={campaign} character={character} /> : null}
      {activeTab === "table" ? <PlayerTableTab campaign={campaign} character={character} /> : null}
      {activeTab === "maps" ? <PlayerMapsTab campaign={campaign} /> : null}
      {activeTab === "character" ? <PlayerCharacterTab character={character} /> : null}
      {activeTab === "players" ? <PlayerRosterTab campaign={campaign} /> : null}
      {activeTab === "journal" ? <PlayerJournalTab campaign={campaign} /> : null}
      {activeTab === "handouts" ? <ReadOnlyPlaceholder title="Handouts" copy="Read-only campaign handouts, maps, and clues will appear here once uploaded." /> : null}
      {activeTab === "rules" ? <PlayerRulesTab campaign={campaign} /> : null}
    </section>
  );
}

function PlayerMapsTab({ campaign }) {
  const { data, error, loading, reload } = useLoad(() => api(`/player/campaigns/${campaign.id}/maps`, { auth: "player" }), [campaign.id]);
  const maps = data || [];
  const activeMap = maps.find((map) => map.id === campaign.active_map_id);

  useEffect(() => {
    const timer = window.setInterval(() => reload({ silent: true }), 2500);
    return () => window.clearInterval(timer);
  }, [campaign.id]);

  return (
    <div className="player-maps-area">
      <PageState loading={loading} error={error} />
      {campaign.table_mode === "mapping" && activeMap ? (
        <section className="panel player-active-map">
          <div className="section-heading">
            <div><p className="eyebrow">Active Player Map</p><h2>{activeMap.name}</h2><p className="muted">Mapper: {activeMap.mapper_name || "Not assigned"}</p></div>
            <Link className="secondary-button" target="_blank" to={playerMapPath(campaign.id, activeMap.id)}>{activeMap.can_edit ? "Open Mapper" : "Open Map"}</Link>
          </div>
          <MappingCanvas campaignMap={activeMap} followViewport />
        </section>
      ) : (
        <ReadOnlyPlaceholder title={campaign.table_mode === "combat" ? "Combat Mode Active" : campaign.table_mode === "hex_crawl" ? "Hex Crawl Mode Active" : "No Active Map"} copy="The DM controls the current table mode and active player map." />
      )}
      <section className="panel map-library-panel">
        <p className="eyebrow">Campaign Map Library</p>
        <h2>Saved Player Maps</h2>
        <div className="map-library-grid">
          {maps.map((map) => (
            <Link key={map.id} className="map-library-card" target="_blank" to={playerMapPath(campaign.id, map.id)}>
              <strong>{map.name}</strong><span>{map.active_level}</span><small>{map.mapper_name ? `Mapper: ${map.mapper_name}` : "No Mapper assigned"} · Revision {map.revision}</small>
            </Link>
          ))}
        </div>
        {!maps.length && !loading ? <p className="muted">No player maps have been created for this campaign.</p> : null}
      </section>
    </div>
  );
}

function PlayerJournalTab({ campaign }) {
  const [journal, setJournal] = useState(campaign.my_journal || "");
  const [saveState, setSaveState] = useState("Saved");
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!dirtyRef.current) setJournal(campaign.my_journal || "");
  }, [campaign.id, campaign.my_journal]);

  useEffect(() => {
    if (!dirtyRef.current) return undefined;
    setSaveState("Saving...");
    const timer = window.setTimeout(async () => {
      try {
        await api(`/player/campaigns/${campaign.id}/journal`, {
          auth: "player",
          method: "PUT",
          body: JSON.stringify({ journal }),
        });
        dirtyRef.current = false;
        setSaveState("Saved");
      } catch (error) {
        setSaveState(error.message || "Save failed");
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [campaign.id, journal]);

  return (
    <section className="panel player-journal-panel">
      <div className="section-heading">
        <div><p className="eyebrow">My Campaign Journal</p><h2>Journal Notes</h2></div>
        <span className={`map-save-state ${saveState !== "Saved" ? "is-saving" : ""}`}>{saveState}</span>
      </div>
      <p className="muted">Your private notes for this campaign. They save automatically.</p>
      <textarea
        aria-label="Campaign journal notes"
        value={journal}
        onChange={(event) => { dirtyRef.current = true; setJournal(event.target.value); }}
        placeholder="Record clues, names, plans, treasure, suspicions, and session notes..."
      />
    </section>
  );
}

function PlayerMapPage() {
  const { id, mapId } = useParams();
  const { data: campaignMap, error, loading, reload } = useLoad(() => api(`/player/campaigns/${id}/maps/${mapId}`, { auth: "player" }), [id, mapId]);
  const [draft, setDraft] = useState(null);
  const [viewport, setViewport] = useState(null);
  const [saveState, setSaveState] = useState("Saved");
  const [mapName, setMapName] = useState("");
  const [revisions, setRevisions] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conflict, setConflict] = useState(false);
  const dirtyRef = useRef(false);
  const serverRevisionRef = useRef(null);

  useEffect(() => {
    if (campaignMap && !dirtyRef.current) {
      setDraft(campaignMap.drawing_state || emptyDrawingState());
      setViewport(campaignMap.viewport || { x: 0, y: 0, zoom: 1 });
      serverRevisionRef.current = campaignMap.revision;
    }
  }, [campaignMap]);

  useEffect(() => {
    if (campaignMap) setMapName(campaignMap.name || "");
  }, [campaignMap?.id, campaignMap?.name]);

  async function saveMapName() {
    const name = mapName.trim();
    if (!campaignMap?.can_edit || !name || name === campaignMap.name) return;
    setSaveState("Saving...");
    try {
      const renamed = await api(`/player/campaigns/${id}/maps/${mapId}`, {
        auth: "player",
        method: "PUT",
        body: JSON.stringify({ name, expected_revision: serverRevisionRef.current }),
      });
      serverRevisionRef.current = renamed.revision;
      setSaveState("Saved");
      await reload({ silent: true });
    } catch (renameError) {
      setSaveState(renameError.message || "Rename failed");
    }
  }

  useEffect(() => {
    if (!campaignMap?.can_edit || !dirtyRef.current || !draft) return undefined;
    setSaveState("Saving...");
    const timer = window.setTimeout(async () => {
      try {
        const saved = await api(`/player/campaigns/${id}/maps/${mapId}`, {
          auth: "player",
          method: "PUT",
          body: JSON.stringify({
            drawing_state: draft,
            viewport: viewport || campaignMap.viewport,
            expected_revision: serverRevisionRef.current,
          }),
        });
        serverRevisionRef.current = saved.revision;
        dirtyRef.current = false;
        setConflict(false);
        setSaveState("Saved");
        await reload({ silent: true });
      } catch (saveError) {
        if (saveError.status === 409 || /another window/i.test(saveError.message || "")) setConflict(true);
        setSaveState(saveError.message || "Save failed");
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draft, viewport, campaignMap?.can_edit, id, mapId]);

  useEffect(() => {
    if (campaignMap?.can_edit) return undefined;
    const timer = window.setInterval(() => reload({ silent: true }), 2500);
    return () => window.clearInterval(timer);
  }, [campaignMap?.can_edit, id, mapId]);

  async function toggleHistory() {
    if (historyOpen) {
      setHistoryOpen(false);
      return;
    }
    try {
      const entries = await api(`/player/campaigns/${id}/maps/${mapId}/revisions`, { auth: "player" });
      setRevisions(entries || []);
      setHistoryOpen(true);
    } catch (historyError) {
      setSaveState(historyError.message || "Could not load map history");
    }
  }

  async function restoreRevision(revisionNumber) {
    if (!window.confirm(`Restore map revision ${revisionNumber}? The current map will remain available in history.`)) return;
    setSaveState("Restoring...");
    try {
      const restored = await api(`/player/campaigns/${id}/maps/${mapId}/revisions/${revisionNumber}/restore`, {
        auth: "player",
        method: "POST",
        body: JSON.stringify({ expected_revision: serverRevisionRef.current }),
      });
      serverRevisionRef.current = restored.revision;
      dirtyRef.current = false;
      setDraft(restored.drawing_state);
      setViewport(restored.viewport);
      setConflict(false);
      setHistoryOpen(false);
      setSaveState("Saved");
      await reload({ silent: true });
    } catch (restoreError) {
      if (restoreError.status === 409 || /another window/i.test(restoreError.message || "")) setConflict(true);
      setSaveState(restoreError.message || "Restore failed");
    }
  }

  async function reloadAfterConflict() {
    dirtyRef.current = false;
    setConflict(false);
    setSaveState("Saved");
    await reload({ silent: true });
  }

  if (loading || error || !campaignMap || !draft) return <PageState loading={loading} error={error} />;
  const displayedMap = { ...campaignMap, drawing_state: draft, viewport: viewport || campaignMap.viewport };

  return (
    <section className="player-map-page">
      <header className="player-map-header">
        <div><p className="eyebrow">{campaignMap.can_edit ? "Mapper Desk" : "Player Map"}</p>{campaignMap.can_edit ? <input className="player-map-name-input" aria-label="Map name" value={mapName} onChange={(event) => setMapName(event.target.value)} onBlur={saveMapName} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /> : <h1>{campaignMap.name}</h1>}<p>{campaignMap.active_level} · {campaignMap.mapper_name || "No Mapper assigned"}</p></div>
        <div className="player-map-header-actions">
          <span className={`map-save-state ${saveState !== "Saved" ? "is-saving" : ""}`}>{saveState}</span>
          {campaignMap.can_edit ? <button type="button" className="secondary-button" onClick={toggleHistory}>History</button> : null}
          <Link className="secondary-button" to={playerCampaignPath(id)}>Campaign Home</Link>
        </div>
      </header>
      {conflict ? <div className="map-conflict-notice"><strong>This map changed in another window.</strong><span>Your unsaved view has not overwritten it.</span><button type="button" onClick={reloadAfterConflict}>Reload Latest Map</button></div> : null}
      {campaignMap.can_edit && historyOpen ? (
        <section className="panel map-history-panel">
          <div><p className="eyebrow">Recoverable History</p><h2>Saved Map Revisions</h2></div>
          <div className="map-history-list">
            {revisions.map((entry) => (
              <div key={entry.revision}>
                <span>Revision {entry.revision}</span>
                <small>{entry.created_at ? new Date(entry.created_at).toLocaleString() : "Saved revision"}</small>
                <button type="button" disabled={entry.revision === serverRevisionRef.current} onClick={() => restoreRevision(entry.revision)}>Restore</button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <MappingCanvas
        campaignMap={displayedMap}
        editable={campaignMap.can_edit}
        followViewport={!campaignMap.can_edit}
        onChange={(nextState) => { dirtyRef.current = true; setDraft(nextState); }}
        onViewportChange={(nextViewport) => { dirtyRef.current = true; setViewport(nextViewport); }}
      />
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
              <a className="secondary-button" href={playerCharacterBuilderPath(campaign.id)}>Create Character</a>
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

function PlayerTableTab({ campaign, character }) {
  const initialState = normalizeDragoTableState(campaign.table_state) || defaultDragoTableState();
  const [tableState, setTableState] = useState(initialState);
  const [currentCharacter, setCurrentCharacter] = useState(character);
  const [draggedToken, setDraggedToken] = useState(null);
  const [colorRequestOpen, setColorRequestOpen] = useState(false);
  const [hpEditor, setHpEditor] = useState(null);
  const tableSaveCountRef = useRef(0);
  const tableSaveVersionRef = useRef(0);
  const tokenId = currentCharacter ? `pc-${currentCharacter.id}` : null;
  const activeGrid = tableState.mode === "combat" ? tableState.combatGrid : tableState.mode === "outdoors" ? DRAGO_OUTDOORS_GRID : DRAGO_MARCHING_GRID;
  const tableCharacters = currentCharacter && !(campaign.characters || []).some((entry) => entry.id === currentCharacter.id)
    ? [...(campaign.characters || []), currentCharacter]
    : (campaign.characters || []).map((entry) => entry.id === currentCharacter?.id ? currentCharacter : entry);
  const playerTokens = applyTokenPositions(buildPlayerTokens(tableCharacters, tableState.playerColors), tableState.tokenPositions);
  const monsterTokens = applyTokenPositions(buildMonsterTokens(tableState.encounterMonsters || []), tableState.tokenPositions);
  const placedPlayerTokens = playerTokens.filter((token) => tableState.tokenPositions?.[token.id]);
  const visibleTokens = tableState.mode === "combat" ? [...placedPlayerTokens, ...monsterTokens] : placedPlayerTokens;
  const myToken = placedPlayerTokens.find((token) => token.id === tokenId);
  const colorChoices = tokenId ? availablePlayerTokenColors(tableState, tokenId) : [];
  const selectedColor = tokenId ? tableState.playerColors?.[tokenId] : null;
  const sessionLive = Boolean(tableState.isSessionLive);

  useEffect(() => {
    setCurrentCharacter(character);
  }, [character]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (tableSaveCountRef.current) return;
      const version = tableSaveVersionRef.current;
      api(`/player/campaigns/${campaign.id}`, { auth: "player" }).then((nextCampaign) => {
        if (tableSaveCountRef.current || version !== tableSaveVersionRef.current) return;
        const shared = normalizeDragoTableState(nextCampaign.table_state);
        if (shared) setTableState(shared);
        const refreshedCharacter = (nextCampaign.characters || []).find((entry) => entry.id === currentCharacter?.id);
        if (refreshedCharacter) setCurrentCharacter(refreshedCharacter);
      }).catch(() => {});
    }, 2500);
    return () => window.clearInterval(timer);
  }, [campaign.id, currentCharacter?.id]);

  useEffect(() => {
    if (sessionLive) return;
    setDraggedToken(null);
    setColorRequestOpen(false);
    setHpEditor(null);
  }, [sessionLive]);

  function publish(nextState) {
    if (!sessionLive) return;
    setTableState(nextState);
    const version = ++tableSaveVersionRef.current;
    tableSaveCountRef.current += 1;
    api(`/player/campaigns/${campaign.id}/table-state`, { auth: "player", method: "PUT", body: JSON.stringify(nextState) })
      .then((result) => {
        if (version !== tableSaveVersionRef.current) return;
        const saved = normalizeDragoTableState(result.table_state);
        if (saved) setTableState(saved);
      })
      .catch(() => {
        if (version !== tableSaveVersionRef.current) return;
        api(`/player/campaigns/${campaign.id}`, { auth: "player" }).then((nextCampaign) => {
          const saved = normalizeDragoTableState(nextCampaign.table_state);
          if (saved) setTableState(saved);
        }).catch(() => {});
      })
      .finally(() => { tableSaveCountRef.current = Math.max(0, tableSaveCountRef.current - 1); });
  }

  function moveOwnToken(token, event) {
    if (!sessionLive) return;
    if (!tokenId || token.id !== tokenId) return;
    const grid = event.currentTarget;
    const rect = grid.getBoundingClientRect();
    const cellWidth = rect.width / activeGrid.columns;
    const cellHeight = rect.height / activeGrid.rows;
    const relativeX = Math.max(0, Math.min(rect.width - 1, event.clientX - rect.left));
    const relativeY = Math.max(0, Math.min(rect.height - 1, event.clientY - rect.top));
    const x = Math.max(1, Math.min(activeGrid.columns, Math.floor(relativeX / cellWidth) + 1));
    const y = Math.max(1, Math.min(activeGrid.rows, Math.floor(relativeY / cellHeight) + 1));
    const slotX = (relativeX % cellWidth) >= cellWidth / 2 ? 1 : 0;
    const slotY = (relativeY % cellHeight) >= cellHeight / 2 ? 1 : 0;
    publish({ ...tableState, tokenPositions: { ...tableState.tokenPositions, [tokenId]: { x, y, slotX, slotY } } });
  }

  function setOwnColor(color, nextPosition = null) {
    if (!sessionLive) return;
    if (!tokenId) return;
    publish({
      ...tableState,
      playerColors: { ...tableState.playerColors, [tokenId]: color },
      tokenPositions: nextPosition ? { ...tableState.tokenPositions, [tokenId]: nextPosition } : tableState.tokenPositions,
    });
    setColorRequestOpen(false);
  }

  function addOwnToken() {
    if (!sessionLive) return;
    if (!tokenId) return;
    const position = { x: 1, y: 1, slotX: 0, slotY: 0 };
    if (!selectedColor) {
      setColorRequestOpen(true);
      return;
    }
    publish({ ...tableState, tokenPositions: { ...tableState.tokenPositions, [tokenId]: position } });
  }

  function chooseColorAndAdd(color) {
    setOwnColor(color.value, { x: 1, y: 1, slotX: 0, slotY: 0 });
  }

  function openHpEditor(direction) {
    if (!sessionLive) return;
    setHpEditor({ direction, amount: "1" });
  }

  function updateCharacterHp(direction, amountValue) {
    if (!sessionLive) return;
    if (!currentCharacter) return;
    const amount = Math.max(0, Number(amountValue) || 0);
    const hp = characterHpValues(currentCharacter);
    const nextCurrent = direction === "damage"
      ? Math.max(0, hp.current - amount)
      : hp.max ? Math.min(hp.max, hp.current + amount) : hp.current + amount;
    const nextLifeStatus = nextCurrent <= 0 ? "dead" : currentCharacter.life_status === "dead" ? "alive" : currentCharacter.life_status;
    const nextCharacter = {
      ...currentCharacter,
      combat: { ...(currentCharacter.combat || {}), current_hp: nextCurrent },
      life_status: nextLifeStatus,
    };
    setCurrentCharacter(nextCharacter);
    api(`/player/characters/${currentCharacter.id}`, {
      auth: "player",
      method: "PATCH",
      body: JSON.stringify({
        combat: { current_hp: nextCurrent },
        life_status: nextCharacter.life_status,
      }),
    }).then(setCurrentCharacter).catch(() => setCurrentCharacter(currentCharacter));
    setHpEditor(null);
  }

  return (
    <div className="player-table-layout">
      <aside className="panel player-table-status">
        <ReadOnlyTrackerStatus tracker={tableState.tracker} mode={tableState.trackerMode || (isDragonlanceCampaign(campaign) ? "dragonlance" : "greyhawk")} />
        <ReadOnlyCombatStatus tracker={tableState.combatTracker} />
        <PlayerCharacterCombatPanel
          character={currentCharacter}
          colorChoices={colorChoices}
          colorRequestOpen={colorRequestOpen}
          hpEditor={hpEditor}
          myToken={myToken}
          selectedColor={selectedColor}
          sessionLive={sessionLive}
          onAddToken={addOwnToken}
          onChooseColor={chooseColorAndAdd}
          onCloseColorRequest={() => setColorRequestOpen(false)}
          onOpenHpEditor={openHpEditor}
          onSetHpEditor={setHpEditor}
          onUpdateHp={updateCharacterHp}
        />
      </aside>
      <main className="panel drago-map-panel player-map-panel">
        <div className="drago-map-toolbar">
          <div>
            <p className="eyebrow">Player View</p>
            <h2>{tableState.mode === "combat" ? `${activeGrid.columns} x ${activeGrid.rows} Combat Grid` : tableState.mode === "outdoors" ? "Outdoor View" : "Marching Order"}</h2>
          </div>
          <span className={`status-pill ${sessionLive ? "live-pill" : ""}`}>{sessionLive ? "Live Session" : "Saved View"}</span>
        </div>
        {!sessionLive ? <p className="table-lock-note">The DM has not started the session yet. You can view the saved table, but movement and HP controls are locked.</p> : null}
        <div
          className={`drago-grid ${tableState.mode === "combat" ? "combat-grid" : tableState.mode === "outdoors" ? "outdoors-grid" : "marching-grid"}`}
          style={{ "--grid-columns": activeGrid.columns, "--grid-rows": activeGrid.rows, aspectRatio: `${activeGrid.columns} / ${activeGrid.rows}` }}
          onPointerMove={(event) => { if (draggedToken) moveOwnToken(draggedToken, event); }}
          onPointerUp={() => setDraggedToken(null)}
          onPointerLeave={() => setDraggedToken(null)}
        >
          {visibleTokens.map((token) => (
            <TableToken
              key={token.id}
              grid={activeGrid}
              token={token}
              monster={token.monster}
              disabled={!sessionLive || token.id !== tokenId}
              onDragStart={sessionLive && token.id === tokenId ? (event) => { setDraggedToken(token); moveOwnToken(token, event); } : undefined}
            />
          ))}
        </div>
      </main>
      <aside className="panel player-table-rules">
        <PlayerCombatRules mode={tableState.mode} />
      </aside>
    </div>
  );
}

function PlayerCharacterCombatPanel({
  character,
  colorChoices,
  colorRequestOpen,
  hpEditor,
  myToken,
  selectedColor,
  sessionLive,
  onAddToken,
  onChooseColor,
  onCloseColorRequest,
  onOpenHpEditor,
  onSetHpEditor,
  onUpdateHp,
}) {
  if (!character) {
    return (
      <section className="player-character-panel">
        <p className="eyebrow">My Character</p>
        <h2>No Character</h2>
        <p className="muted">Create or assign a character to use the player table.</p>
      </section>
    );
  }
  const hp = characterHpValues(character);
  const weapons = characterWeaponRows(character);
  return (
    <section className="player-character-panel">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">My Character</p>
          <h2>{character.name}</h2>
        </div>
        <span className="status-pill">{!sessionLive ? "Locked" : myToken ? "On Grid" : selectedColor ? "Ready" : "Choose Color"}</span>
      </div>
      <dl className="player-combat-facts">
        <div><dt>HP</dt><dd>{hp.current} / {hp.max || "-"}</dd></div>
        <div><dt>AC</dt><dd>{characterAcText(character)}</dd></div>
        <div><dt>THAC0</dt><dd>{characterThac0Text(character)}</dd></div>
        <div><dt>Move</dt><dd>{characterMoveText(character)}</dd></div>
        <div><dt>Attacks</dt><dd>{characterAttackRateText(character)}</dd></div>
        <div><dt>Status</dt><dd>{character.life_status || character.status || "Ready"}</dd></div>
      </dl>
      <div className="player-hp-actions">
        <button type="button" className="table-button" disabled={!sessionLive} onClick={() => onOpenHpEditor("damage")}>Damage</button>
        <button type="button" className="table-button" disabled={!sessionLive} onClick={() => onOpenHpEditor("heal")}>Heal</button>
      </div>
      {hpEditor ? (
        <form
          className="inline-hp-editor player-inline-hp"
          onSubmit={(event) => {
            event.preventDefault();
            onUpdateHp(hpEditor.direction, hpEditor.amount);
          }}
        >
          <label>{hpEditor.direction === "damage" ? "Damage" : "Heal"}
            <input
              autoFocus
              min="0"
              type="number"
              value={hpEditor.amount}
              onChange={(event) => onSetHpEditor({ ...hpEditor, amount: event.target.value })}
            />
          </label>
          <button type="submit" className="table-button">Apply</button>
          <button type="button" className="table-button ghost-button" onClick={() => onSetHpEditor(null)}>Cancel</button>
        </form>
      ) : null}
      <div>
        <p className="eyebrow">Weapons</p>
        {weapons.length ? (
          <div className="player-weapon-list">
            {weapons.map((weapon) => (
              <div key={`${weapon.name}-${weapon.mode}`}>
                <strong>{weapon.name}</strong>
                <span>Hit {weapon.attack} · Dmg {weapon.damage} · Spd {weapon.speed}{weapon.range ? ` · Rng ${weapon.range}` : ""}</span>
              </div>
            ))}
          </div>
        ) : <p className="muted compact-note">No equipped weapons listed.</p>}
      </div>
      <div className="player-character-actions">
        <button className="table-button" type="button" disabled={!sessionLive} onClick={onAddToken}>Add To Grid</button>
        <a className="table-button" href={`/1e/characters/${character.id}/?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`} target="_blank" rel="noreferrer">Open Sheet</a>
      </div>
      {colorRequestOpen ? (
        <div className="player-token-color-request">
          <div className="section-heading compact-heading">
            <div><p className="eyebrow">Token Color</p><strong>Choose an open color</strong></div>
            <button type="button" className="table-button" onClick={onCloseColorRequest}>x</button>
          </div>
          {colorChoices.length ? (
            <div className="player-color-grid compact-color-grid">
              {colorChoices.map((color) => (
                <button key={color.key} type="button" style={{ "--swatch": color.value }} onClick={() => onChooseColor(color)}>{color.label}</button>
              ))}
            </div>
          ) : <p className="muted compact-note">All player colors are already claimed.</p>}
        </div>
      ) : null}
    </section>
  );
}

function ReadOnlyTrackerStatus({ tracker, mode }) {
  return (
    <section className="tracker-console readonly-tracker">
      <div className="section-heading compact-heading"><div><p className="eyebrow">Tracker</p><h2>{mode === "dragonlance" ? "Dragonlance 1985" : "Classic Tracker"}</h2></div></div>
      <div className="tracker-status-box">
        <strong>{tracker.weekday}, {tracker.day} {tracker.month}, {tracker.year}</strong>
        <span>Time: {tracker.time}</span>
        <span>Turn: {tracker.turn}</span>
        <span>Rest: {tracker.turnsSinceRest} / 5</span>
        <span>Torch: {tracker.torchLit ? "Lit" : "Unlit"} · {tracker.torchTurns} turn(s)</span>
        <span>Lantern: {tracker.lanternLit ? "Lit" : "Unlit"} · Oil {tracker.oil}</span>
        {mode === "dragonlance" ? <span>Moons: Sol {tracker.solinari} / Lun {tracker.lunitari} / Nui {tracker.nuitari}</span> : null}
      </div>
    </section>
  );
}

function ReadOnlyCombatStatus({ tracker }) {
  return (
    <section className="combat-tracker readonly-tracker">
      <div className="section-heading compact-heading">
        <div><p className="eyebrow">Combat</p><h2>Round {tracker?.round || 1}</h2></div>
        <span className="status-pill">{tracker?.activeSide === "monsters" ? "Monster Turn" : "Party Turn"}</span>
      </div>
    </section>
  );
}

function PlayerCombatRules({ mode }) {
  if (mode !== "combat") {
    const explorationSteps = [
      ["Marching order", "Your token shows the party’s current order. Keep the front, middle, and rear clear so the DM can quickly tell who sees danger first and who is exposed from behind."],
      ["Time and light", "The tracker shows dungeon turns, torches, lantern oil, and rest pressure. Most careful exploration actions cost time, so watch the light before splitting up or lingering."],
      ["Searching and listening", "Tell the DM exactly what your character is checking: doors, floors, walls, containers, sounds, tracks, or unusual air. The DM will call for rolls when the rules or situation require them."],
      ["Doors and movement", "Opening stuck doors, forcing locks, moving quietly, and scouting ahead can change who is surprised. Keep your token where your character actually is before the DM advances the scene."],
      ["Wandering danger", "Noise, delay, and light can attract trouble. If the status panel changes, treat it as shared table information and adjust your plan before the next turn passes."],
    ];
    return (
      <section>
        <p className="eyebrow">Exploration</p>
        {explorationSteps.map(([title, text]) => (
          <details className="player-rule-step" key={title}><summary>{title}</summary><p>{text}</p></details>
        ))}
      </section>
    );
  }
  const combatSteps = [
    ["1. Surprise", "The DM checks whether either side is surprised before normal initiative. Surprise can grant one or more opening segments in which the surprised side cannot act, so resolve those actions first."],
    ["2. Confirm position", "Put your token where your character is standing. Distance, blocked paths, marching order, cover, and who can reach whom all depend on the grid being honest."],
    ["3. Declare actions", "Before initiative is resolved, state what your character will attempt: charge, attack, cast, fire, retreat, change weapons, protect someone, or interact with the room."],
    ["4. Roll initiative", "The DM resolves initiative for the round and calls the acting order. Spell casting time, charging, reach, multiple attacks, and other circumstances can change when an action occurs."],
    ["5. Movement", "Move your own token when the DM allows movement. If you leave melee, cross danger, or pass through crowded squares, pause so the DM can apply the right ruling."],
    ["6. Attacks, spells, and weapon speed", "Use your snippet for THAC0, damage, and Speed Factor. Speed Factor is not a universal initiative bonus: the DM uses it when weapon timing matters, especially important individual melees and certain tied or close exchanges. Lower numbers indicate a quicker weapon. For spells, announce the target, range, casting time, and saving throw."],
    ["7. Damage and status", "Apply Damage or Heal as soon as HP changes. If you reach 0 HP or a condition changes, call it out so the DM can update the shared table state."],
    ["8. End of round", "After both sides act, the DM advances the round. Check HP, spell effects, morale, light, and whether your next position or declared action has changed."],
  ];
  return (
    <section>
      <p className="eyebrow">Combat Rules</p>
      {combatSteps.map(([title, text]) => (
        <details className="player-rule-step" key={title}><summary>{title}</summary><p>{text}</p></details>
      ))}
    </section>
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
        <a className="secondary-button" href={`/characters/${character.id}?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`} target="_blank" rel="noreferrer">Open Character Sheet</a>
        <a className="table-link" href={`/characters/${character.id}/edit?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`}>Edit Character</a>
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
            <p className="eyebrow">Dragolance Character Builder</p>
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
      <h2 className="section-title">Dragolance Party</h2>
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
      <a className="panel rule-card" href="/1e/" target="_blank" rel="noreferrer">
        <p className="eyebrow">1e Rules</p>
        <h2>Rules Library</h2>
        <p>Open the shared classic First Edition rules reference.</p>
      </a>
      <Link className={`panel rule-card ${dragonlance ? "" : "muted-card"}`} target="_blank" rel="noreferrer" to={dragonlance ? dragonlanceBasePath() : "#"}>
        <p className="eyebrow">{titleCase(setting)}</p>
        <h2>{dragonlance ? "Dragolance Reference" : "Campaign Rules"}</h2>
        <p>{dragonlance ? "Open our player-safe Krynn campaign reference." : "Setting-specific sourcebook rules will appear here as the library expands."}</p>
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
  const params = useParams();
  const path = (params["*"] || "").replace(/^\/+|\/+$/g, "");
  const basePath = dragonlanceBasePath();
  const currentPage = dragonlancePageFor(path);
  const deityPage = dragonlanceDeityPage(path);
  const navPage = currentPage || deityPage || { label: "Source Pending", path };
  const previousNext = dragonlancePreviousNext(path);

  return (
    <section className="player-portal-page dragonlance-guide-page">
      <PlayerHero
        eyebrow="Campaign Setting"
        title="Dragolance Reference"
        copy="Our interpretation of Krynn using the original AD&D 1st Edition rules and Dragonlance Adventures as the canonical foundation."
      />
      <div className="reference-return-row">
        <Link className="secondary-button" to={isClassicHost() ? "/" : "/portal"}>Return to Player Portal</Link>
        <a className="secondary-button" href="/1e/">Player's Guide</a>
      </div>
      <div className="dragonlance-reader">
        <aside className="dragonlance-tree" aria-label="Dragolance reference navigation">
          <Link className={!path ? "active" : ""} to={basePath}>Dragolance Reference</Link>
          <DragonlanceTree items={dragonlanceIa} basePath={basePath} currentPath={path} />
        </aside>
        <article className="panel dragonlance-article" id="top">
          <DragonlanceBreadcrumb page={navPage} basePath={basePath} />
          <SourceBadge badge={badgeForReferencePage(path)} />
          <DragonlanceArticleContent path={path} currentPage={currentPage} deityPage={deityPage} basePath={basePath} />
          <RelatedTopics path={path} basePath={basePath} />
          <DragonlanceReaderNav previousNext={previousNext} page={navPage} basePath={basePath} />
        </article>
      </div>
    </section>
  );
}

function dragonlanceBasePath() {
  return isClassicHost() ? "/dragonlance" : "/portal/dragonlance";
}

function DragonlanceTree({ items, basePath, currentPath }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.path}>
          <Link className={currentPath === item.path ? "active" : ""} to={`${basePath}/${item.path}`}>{item.label}</Link>
          {item.children?.length ? <DragonlanceTree items={item.children} basePath={basePath} currentPath={currentPath} /> : null}
        </li>
      ))}
    </ul>
  );
}

function DragonlanceBreadcrumb({ page, basePath }) {
  const crumbs = dragonlanceBreadcrumbs(page?.path || "");
  return (
    <nav className="reference-breadcrumbs" aria-label="Breadcrumb">
      <Link to={basePath}>Dragolance</Link>
      {crumbs.map((crumb) => (
        <Link key={crumb.path || "home"} to={crumb.path ? `${basePath}/${crumb.path}` : basePath}>{crumb.label}</Link>
      ))}
    </nav>
  );
}

function dragonlanceBreadcrumbs(path) {
  if (!path) return [];
  const segments = path.split("/");
  const crumbs = [];
  for (let index = 0; index < segments.length; index += 1) {
    const partial = segments.slice(0, index + 1).join("/");
    const page = dragonlancePageFor(partial);
    if (page) crumbs.push(page);
  }
  if (path.startsWith("gods/") && segments.length === 3) {
    crumbs.push({ label: titleCase(segments[2]), path });
  }
  return crumbs;
}

function badgeForReferencePage(path) {
  if (!path || path === "what-is-dragonlance") return sourceBadges.campaign;
  if (path === "world-of-krynn") return sourceBadges.mixed;
  if (path.startsWith("races/") || path === "races") return sourceBadges.mixed;
  if (classReference[path]) return classReference[path].badge || sourceBadges.mixed;
  if (godsReference[path] || path.startsWith("gods/")) return sourceBadges.mixed;
  return sourceBadges.setting;
}

function SourceBadge({ badge }) {
  if (!badge) return null;
  return (
    <div className="source-badge">
      <strong>{badge.type}</strong>
      <span>{badge.label}</span>
    </div>
  );
}

function RelatedTopics({ path, basePath }) {
  const topics = relatedTopics[path] || relatedTopics[path?.split("/").slice(0, 2).join("/")] || [];
  if (!topics.length) return null;
  return (
    <section className="related-topics" aria-label="Related topics">
      <h2>Related Topics</h2>
      <div>
        {topics.map((topic) => topic.path
          ? <Link key={topic.label} to={`${basePath}/${topic.path}`}>{topic.label}</Link>
          : topic.href
            ? <a key={topic.label} href={topic.href}>{topic.label}</a>
            : <span key={topic.label}>{topic.label}</span>)}
      </div>
    </section>
  );
}

function DragonlanceArticleContent({ path, currentPage, deityPage, basePath }) {
  if (!path) return <DragonlanceHub basePath={basePath} />;
  if (deityPage) return <DragonlanceDeityPage deityPage={deityPage} />;
  if (!currentPage) return <SourcePendingPage title="Source Pending" />;
  if (path === "what-is-dragonlance") return <DragolanceIntroPage />;
  if (path === "world-of-krynn") return <DragonlanceWorldPage basePath={basePath} />;
  if (raceOverviewPages[path]) return <DragonlanceRaceOverview path={path} basePath={basePath} />;
  if (presentationOnlyRacePages[path]) return <DragonlancePresentationOnlyRacePage path={path} basePath={basePath} />;
  if (path.startsWith("races/")) return <DragonlanceRacePage path={path} title={currentPage.label} />;
  if (path === "classes") return <DragonlanceClassPage reference={classReference.classes} basePath={basePath} />;
  if (path.startsWith("classes/")) return <DragonlanceClassPage reference={classReference[path]} />;
  if (godsReference[path]) return <DragonlanceGodReferencePage reference={godsReference[path]} basePath={basePath} />;
  if (path === "gods") return <DragonlanceGodReferencePage reference={godsReference.gods} basePath={basePath} />;
  if (path === "gods/good" || path === "gods/neutrality" || path === "gods/evil") return <DragonlanceGodGroup groupKey={path.split("/")[1]} basePath={basePath} />;
  return <SourcePendingPage title={currentPage.label} />;
}

function DragonlanceHub({ basePath }) {
  return (
    <>
      <p className="eyebrow">Player Reference</p>
      <h1>Dragolance Reference</h1>
      <p className="portal-copy">Dragolance is our campaign branch for the shared First Edition rules engine: an interpretation of Krynn grounded in Dragonlance Adventures and built for our table.</p>
      <div className="reference-hub-grid">
        {dragonlanceIa.map((item) => (
          <Link className="guide-card" key={item.path} to={`${basePath}/${item.path}`}>
            <h4>{item.label}</h4>
            <p>{dragonlanceHubCopy(item.path)}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

function dragonlanceHubCopy(path) {
  const copy = {
    "what-is-dragonlance": "An introduction to Dragolance, our interpretation of Krynn.",
    "world-of-krynn": "A player introduction to Krynn, the Balance, and the choices that shape the setting.",
    races: "Krynn-specific peoples. Humans remain in the Player's Guide.",
    classes: "Only Knights of Solamnia, Wizards of High Sorcery, and Tinkers.",
    gods: "Player-facing deity reference organized by Good, Neutral, and Evil.",
  };
  return copy[path] || "Open this section.";
}

function PlaceholderReferencePage({ title }) {
  return (
    <>
      <p className="eyebrow">Placeholder Content</p>
      <h1>{title}</h1>
      <div className="source-pending-box">
        <strong>REPLACE THIS NARRATIVE</strong>
        <p>This page is intentionally placeholder-only. Final prose will be rewritten by the DRG team from the campaign source, without adding mechanics or copying unavailable source text.</p>
      </div>
    </>
  );
}

function DragolanceIntroPage() {
  return (
    <section className="dragolance-intro-page">
      <p className="eyebrow">{dragolanceIntroContent.eyebrow}</p>
      <h1>{dragolanceIntroContent.title}</h1>
      {dragolanceIntroContent.body.map((entry, index) => <DragolanceIntroBlock key={`${entry.type}-${index}`} entry={entry} />)}
    </section>
  );
}

function DragolanceIntroBlock({ entry }) {
  if (entry.type === "credo") return <div className="dragolance-credo">{entry.text}</div>;
  if (entry.type === "signature") return <p className="dragolance-signature">{entry.text}</p>;
  return <p>{entry.text}</p>;
}

function DragonlanceWorldPage({ basePath }) {
  return (
    <>
      <p className="eyebrow">Player Introduction</p>
      <h1>The World of Krynn</h1>

      <section className="rulebook-section">
        <h2>The Birth of Krynn</h2>
        <p>Before kingdoms rose, before dragons flew across the skies, and before the first mortal drew breath, only the eternal powers existed. From beyond the mortal world came the three great principles that would shape all existence: Good, Evil, and Neutrality.</p>
        <p>The forging of creation began when Chaos was restrained and order emerged from the void. The stars were kindled, the heavens were formed, and the spirits of future life awakened. Yet these spirits possessed neither bodies nor purpose. The gods debated what role they should play in the new creation.</p>
        <p>The Gods of Good wished to nurture these spirits through compassion, justice, and wisdom. The Gods of Evil desired obedient servants who would strengthen their dominion. The Gods of Neutrality believed every soul should possess the freedom to choose its own path.</p>
        <p>Rather than allow one philosophy to triumph over the others, the High God established Balance. The gods would share the world of Krynn, each influencing creation according to their divine nature, while every mortal would retain the freedom to determine their own destiny.</p>
        <p>Thus the world of Krynn was born-a place where destiny is never predetermined, where every choice carries meaning, and where the struggle between Good, Evil, and Neutrality shapes history itself.</p>
      </section>

      <section className="rulebook-section">
        <h2>The Balance</h2>
        <p>The universe of Krynn is founded upon a delicate Balance between the three divine alignments: Good, Evil, and Neutrality. None exist in isolation. Each represents a fundamental truth about existence, and together they create the order that governs the world.</p>
        <p>Unlike many fantasy settings where alignment serves only as a character label, alignment in Dragonlance is woven into the fabric of creation itself. The gods actively guide the world according to their philosophies, while mortals continually influence the Balance through the choices they make.</p>
        <p>Every adventure set on Krynn exists within this ongoing struggle. Kingdoms rise and fall, heroes emerge, and legends are written because ordinary people choose what they believe is worth fighting for.</p>
      </section>

      <section className="rulebook-section">
        <h2>The Peoples of Krynn</h2>
        <p>When the first spirits entered the mortal world, they became the peoples of Krynn. Each race reflects different aspects of creation and contributes its own culture, traditions, and outlook to the world.</p>
        <p>Humans remain the most adaptable of all peoples, capable of embracing any path and earning the attention of every pantheon. Elves embody grace, tradition, and ancient wisdom. Dwarves value honor, craftsmanship, and endurance. Kender view the world with fearless curiosity, while gnomes pursue knowledge through invention and endless experimentation. The mysterious Irda preserve ancient magic, and the proud minotaurs build societies founded upon honor and personal achievement.</p>
        <p>Many of these peoples differ significantly from their counterparts found in other fantasy worlds. Their histories, cultures, and even their game mechanics are unique to Dragonlance.</p>
        <p className="rulebook-link-intro">Learn more:</p>
        <nav className="reference-link-row" aria-label="Krynn people references">
          <Link to={`${basePath}/races`}>Races of Krynn</Link>
          <Link to={`${basePath}/classes`}>Classes</Link>
          <Link to={`${basePath}/gods`}>Gods</Link>
        </nav>
      </section>

      <section className="rulebook-section">
        <h2>The Law of Consequence</h2>
        <p>One of the defining themes of Dragonlance is that actions have consequences.</p>
        <p>The philosophies of the three alignments shape every decision made by both mortals and the gods.</p>
        <h3>The Law of Redemption</h3>
        <p>The powers of Good believe that justice, compassion, sacrifice, and truth ultimately strengthen both individuals and the world. Even those who have fallen may find redemption through courage and selfless action.</p>
        <h3>The Law of Dominion</h3>
        <p>The powers of Evil believe strength is the highest virtue. Power belongs to those capable of claiming and holding it, while weakness naturally yields to the strong.</p>
        <h3>The Doctrine of Balance</h3>
        <p>The Gods of Neutrality preserve the Balance itself. Neither Good nor Evil should achieve absolute victory, for without opposition neither philosophy can truly exist.</p>
        <h3>The Law of Consequence</h3>
        <p>Above all stands the final law established by the High God:</p>
        <p>Every choice matters.</p>
        <p>Acts of courage inspire hope.</p>
        <p>Acts of cruelty spread suffering.</p>
        <p>Justice may not come immediately, but eventually every decision echoes throughout Krynn.</p>
        <p>For this reason, Dragonlance has always been a world where heroes can change history-not because they are destined to, but because they choose to.</p>
      </section>

      <section className="rulebook-callout">
        <h2>Our Campaign Philosophy</h2>
        <p>At our table we embrace one of the central themes of Dragonlance:</p>
        <p>Good should triumph over Evil.</p>
        <p>That does not mean every battle is won, every hero survives, or every story ends happily. It means courage, sacrifice, honor, and hope remain worth fighting for, even when victory seems impossible.</p>
        <p>Heroes may fail.</p>
        <p>Heroes may fall.</p>
        <p>But evil is never celebrated simply because it is powerful.</p>
      </section>

      <section className="rulebook-section">
        <h2>Beyond This Page</h2>
        <p>If you're new to Dragonlance, these references will help you prepare your character.</p>
        <div className="reference-hub-grid">
          <Link className="guide-card" to={`${basePath}/races`}>
            <h4>Races of Krynn</h4>
            <p>The unique peoples of the world and their game mechanics.</p>
          </Link>
          <Link className="guide-card" to={`${basePath}/classes`}>
            <h4>Classes</h4>
            <p>The Knights of Solamnia, Wizards of High Sorcery, Tinker Gnomes, and how Dragonlance expands upon First Edition.</p>
          </Link>
          <Link className="guide-card" to={`${basePath}/gods`}>
            <h4>Gods</h4>
            <p>The deities of Good, Neutrality, and Evil, along with the role faith and divine magic play in Krynn.</p>
          </Link>
        </div>
      </section>

      <section className="rulebook-quote-panel">
        <h2>A Note from Chance</h2>
        <p>Dragonlance is the setting that first made fantasy feel real to me.</p>
        <p>As a kid, I read every Dragonlance novel I could find, and then I read them all again. Krynn became more than a place on a map-it became a world I dreamed about exploring. The heroes inspired me, the dragons captured my imagination, and the stories taught me that courage, friendship, sacrifice, and hope matter most when the world seems darkest.</p>
        <p>Today, my goal isn't simply to replay the adventures of Tanis, Raistlin, or Sturm. Those stories have already been told.</p>
        <p>Instead, I want to gather around a table with new adventurers and create legends of our own. Every campaign is a chance for new heroes to shape the future of Krynn, one choice at a time.</p>
        <p>If, for just a few hours each week, our table can bring this incredible world to life once again, then we've accomplished something truly special.</p>
        <p className="rulebook-signature">- Chance Russo</p>
      </section>
    </>
  );
}

function DragonlanceRaceOverview({ path, basePath }) {
  const page = raceOverviewPages[path];
  return (
    <>
      <p className="eyebrow">{page.status}</p>
      <h1>{page.title}</h1>
      <p className="portal-copy">{page.summary}</p>
      {page.notice ? <div className="source-pending-box"><strong>Reference Note</strong><p>{page.notice}</p></div> : null}
      {page.links?.length ? (
        <nav className="reference-link-row" aria-label={`${page.title} related rules`}>
          {page.links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
      ) : null}
      <div className="reference-hub-grid">
        {(page.cards || []).map((card) => (
          <Link className="guide-card" key={card.path} to={`${basePath}/${card.path}`}>
            <h4>{card.label}</h4>
            <p>{card.copy}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

function DragonlanceSectionLanding({ title, page, basePath }) {
  return (
    <>
      <p className="eyebrow">Section</p>
      <h1>{title}</h1>
      <p className="portal-copy">Choose a page from this section. Standard First Edition material is linked rather than duplicated.</p>
      <div className="reference-hub-grid">
        {(page.children || []).map((child) => (
          <Link className="guide-card" key={child.path} to={`${basePath}/${child.path}`}>
            <h4>{child.label}</h4>
            <p>{child.children?.length ? "Open this group." : "Open this reference page."}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

function DragonlanceRacePage({ path, title }) {
  const record = raceRecords[path];
  const presentation = racePresentation[path] || {};
  if (!record) return <SourcePendingPage title={title} />;
  const detailRows = raceDetailRows(record);
  return (
    <>
      <p className="eyebrow">{presentation.parent || "Race of Krynn"}</p>
      <h1>{title}</h1>
      <div className="race-source-grid">
        <div><strong>Canonical Source</strong><span>Dragonlance Adventures</span></div>
        <div><strong>Source Pages</strong><span>{presentation.sourcePages || sourcePageLabel(record)}</span></div>
        <div><strong>Review Status</strong><span>{titleCase(record.review?.status || "source pending")}</span></div>
        <div><strong>First Edition Base</strong><span>{osricBaseRaceLink(record, presentation)}</span></div>
      </div>
      <SourceStatus record={record} />
      {presentation.notice ? <div className="guide-banner">{presentation.notice}</div> : null}
      <h2>Player Summary</h2>
      <p className="portal-copy">{presentation.summary || record.description || "Source-verified race presentation is in progress."}</p>
      <h2>Game Statistics</h2>
      {detailRows.length ? (
        <dl className="guide-details reference-details">
          {detailRows.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
        </dl>
      ) : <SourcePendingInline page={sourcePageLabel(record)} />}
      {record.racial_abilities?.length ? (
        <>
          <h2>Special Abilities</h2>
          <ul className="guide-list">{record.racial_abilities.map((ability) => <li key={ability}>{ability}</li>)}</ul>
        </>
      ) : null}
      {record.level_limits?.length ? (
        <>
          <h2>Class Access and Level Limits</h2>
          <DragonlanceReferenceTable
            columns={["Class", "Maximum Level", "Source Status"]}
            rows={record.level_limits.map((entry) => [entry.class_name, entry.maximum_level, entry.source_status])}
          />
        </>
      ) : null}
      {record.needs_review_fields?.length ? (
        <div className="source-pending-box">
          <strong>Source Verification Required</strong>
          <p>{record.needs_review_fields.map((field) => titleCase(field)).join(", ")}. Source page: {sourcePageLabel(record)}.</p>
        </div>
      ) : null}
      <h2>Playing This Race</h2>
      <p className="portal-copy">{presentation.playing || "Use the verified game statistics above. Add no extra mechanical benefits unless the source or DM explicitly provides them."}</p>
      <RulesRelationships record={record} presentation={presentation} />
    </>
  );
}

function DragonlancePresentationOnlyRacePage({ path, basePath }) {
  const page = presentationOnlyRacePages[path];
  return (
    <>
      <p className="eyebrow">{page.status}</p>
      <h1>{page.title}</h1>
      <div className="race-source-grid">
        <div><strong>Canonical Source</strong><span>Dragonlance Adventures</span></div>
        <div><strong>Source Pages</strong><span>{page.sourcePages}</span></div>
        <div><strong>Review Status</strong><span>Presentation Only</span></div>
        <div><strong>Player Selectable</strong><span>No separate race record</span></div>
      </div>
      <p className="portal-copy">{page.summary}</p>
      <div className="source-pending-box"><strong>Rules Relationship</strong><p>{page.notice}</p></div>
      {page.links?.length ? (
        <div className="reference-hub-grid">
          {page.links.map((link) => (
            <Link className="guide-card" key={link.path} to={`${basePath}/${link.path}`}>
              <h4>{link.label}</h4>
              <p>Open the underlying selectable race.</p>
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}

function SourcePendingInline({ page }) {
  return <div className="source-pending-box compact-source-box"><strong>Source Verification Required</strong><p>Mechanics for this field remain unresolved from {page}.</p></div>;
}

function DragonlanceClassPage({ reference }) {
  if (!reference) return <SourcePendingPage title="Class System" />;
  return (
    <>
      <p className="eyebrow">Class System</p>
      <h1>{reference.title}</h1>
      {reference.notice ? <div className="guide-banner">{reference.notice}</div> : null}
      <p className="portal-copy">{reference.sourceStatus}</p>
      {reference.moonNote ? <div className="source-pending-box"><strong>Moon Tracking Chart</strong><p>{reference.moonNote}</p></div> : null}
      <h2>Player Reference</h2>
      <ul className="guide-list">{reference.sections.map((section) => <li key={section}>{section}</li>)}</ul>
      {reference.links?.length ? <ReferenceLinks links={reference.links} /> : null}
      {reference.moons?.length ? <MoonSummary moons={reference.moons} /> : null}
      {reference.progressions?.map((progression) => <ProgressionTable key={progression.id} progression={progression} />)}
      {reference.spellTables?.map((table) => <SpellSlotTable key={table.id} table={table} />)}
    </>
  );
}

function DragonlanceGodReferencePage({ reference, basePath }) {
  return (
    <>
      <p className="eyebrow">Gods of Krynn</p>
      <h1>{reference.title}</h1>
      <p className="portal-copy">{reference.sourceStatus}</p>
      <ul className="guide-list">{reference.sections.map((section) => <li key={section}>{section}</li>)}</ul>
      {reference.links?.length ? <ReferenceLinks links={reference.links} /> : null}
      {reference.records?.map((record) => <SourceStatus key={record.id} record={record} />)}
      {reference.progressions?.map((progression) => <ProgressionTable key={progression.id} progression={progression} />)}
      {reference.spellTables?.map((table) => <SpellSlotTable key={table.id} table={table} />)}
      {reference === godsReference.gods ? <DragonlanceGodsLanding basePath={basePath} /> : null}
    </>
  );
}

function ReferenceLinks({ links }) {
  return (
    <nav className="reference-link-row" aria-label="Related rule links">
      {links.map((link) => link.path ? <Link key={link.label} to={`${dragonlanceBasePath()}/${link.path}`}>{link.label}</Link> : <a key={link.href || link.label} href={link.href}>{link.label}</a>)}
    </nav>
  );
}

function MoonSummary({ moons }) {
  return (
    <section className="reference-table-section">
      <h2>Moons</h2>
      <DragonlanceReferenceTable
        columns={["Moon", "Affects", "Cycle", "Review Status"]}
        rows={moons.map((moon) => [
          moon.display_name || moon.name,
          formatRulesRefs(moon.affects),
          moon.cycle_days ? `${moon.cycle_days} days` : "Source Verification Required",
          moon.review?.status || "source_pending",
        ])}
      />
    </section>
  );
}

function DragonlanceGodsLanding({ basePath }) {
  return (
    <>
      <div className="reference-hub-grid">
        {Object.keys(deityGroups).map((group) => <Link className="guide-card" key={group} to={`${basePath}/gods/${group}`}><h4>Gods of {titleCase(group)}</h4><p>{deityGroups[group].join(", ")}</p></Link>)}
      </div>
    </>
  );
}

function DragonlanceGodGroup({ groupKey, basePath }) {
  const names = deityGroups[groupKey] || [];
  return (
    <>
      <p className="eyebrow">Gods of Krynn</p>
      <h1>{titleCase(groupKey)}</h1>
      <div className="reference-hub-grid">
        {names.map((name) => <Link className="guide-card" key={name} to={`${basePath}/gods/${groupKey}/${slugify(name)}`}><h4>{name}</h4><p>{deityRecord(name).alignment}</p></Link>)}
      </div>
    </>
  );
}

function DragonlanceDeityPage({ deityPage }) {
  const record = deityRecord(deityPage.name);
  return (
    <>
      <p className="eyebrow">Deity of Krynn</p>
      <h1>{deityPage.name}</h1>
      <SourceStatus record={record} />
      <p className="portal-copy">{record.description}</p>
      <dl className="guide-details reference-details">
        <div><dt>Alignment</dt><dd>{record.alignment || "Source verification required"}</dd></div>
        <div><dt>Pantheon Group</dt><dd>{titleCase(deityPage.groupKey || "")}</dd></div>
        <div><dt>Spheres</dt><dd>{formatRecordList(record.domains_or_spheres)}</dd></div>
        <div><dt>Worshippers</dt><dd>Source verification required</dd></div>
        <div><dt>Symbol</dt><dd>{record.holy_symbol || "Source verification required"}</dd></div>
        <div><dt>Relationships</dt><dd>{formatRulesRefs(record.cleric_extensions)}</dd></div>
        <div><dt>Clerical Information</dt><dd>{formatRecordList(record.allowed_cleric_alignments)}</dd></div>
      </dl>
      <ReferenceLinks links={[{ label: "Holy Orders", path: "gods/holy-orders" }, { label: "First Edition Cleric", href: "/1e/classes/cleric/" }]} />
    </>
  );
}

function dragonlanceDeityPage(path) {
  const match = path.match(/^gods\/(good|neutrality|evil)\/([^/]+)$/);
  if (!match) return null;
  const name = (deityGroups[match[1]] || []).find((entry) => slugify(entry) === match[2]);
  return name ? { label: name, name, path, groupKey: match[1] } : null;
}

function SourcePendingPage({ title, copy }) {
  return (
    <>
      <p className="eyebrow">Source Verification Required</p>
      <h1>{title}</h1>
      <div className="source-pending-box">
        <strong>Mechanics withheld until verified</strong>
        <p>{copy || "This page is present in the player reference tree, but exact Dragonlance Adventures mechanics have not yet been extracted into structured player-facing content."}</p>
      </div>
    </>
  );
}

function SourceStatus({ record }) {
  const status = record?.review?.status || "source_pending";
  return <div className="source-pending-box compact-source-box"><strong>Source Status: {status}</strong><p>{(record?.review?.notes || [])[0] || "Dragonlance Adventures is the canonical authority. This page does not invent missing mechanics."}</p></div>;
}

function ProgressionTable({ progression }) {
  return (
    <section className="reference-table-section">
      <h2>{progression.display_name || progression.name}</h2>
      <DragonlanceReferenceTable
        columns={["Level", "XP", "Hit Dice", "Title"]}
        rows={(progression.levels || []).map((level) => [level.level, level.xp_threshold, level.hit_dice, level.title || "-"])}
      />
    </section>
  );
}

function SpellSlotTable({ table }) {
  const maxSpellLevel = Math.max(7, ...((table.levels || table.rows || []).flatMap((row) => Object.keys(row.slots || {}).map((key) => Number(key)).filter(Boolean))));
  const spellLevels = Array.from({ length: maxSpellLevel }, (_, index) => String(index + 1));
  const rows = (table.rows || table.levels || []).map((row) => {
    const slots = Array.isArray(row.slots)
      ? row.slots
      : spellLevels.map((level) => row.slots?.[level] ?? 0);
    return [row.level, ...slots];
  });
  if (!rows.length) return null;
  return (
    <section className="reference-table-section">
      <h2>{table.display_name || table.name}</h2>
      <DragonlanceReferenceTable columns={["Level", ...spellLevels]} rows={rows} />
      {table.review?.status !== "verified" ? <SourceStatus record={table} /> : null}
    </section>
  );
}

function DragonlanceReferenceTable({ columns, rows }) {
  return (
    <div className="reference-table-wrap">
      <table className="reference-table">
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column, cellIndex) => <td key={column}>{formatCell(row[cellIndex])}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function DragonlanceReaderNav({ previousNext, page, basePath }) {
  const section = page?.path?.split("/")[0] || "";
  return (
    <nav className="reader-footer-nav" aria-label="Reader navigation">
      {previousNext.previous ? <Link to={`${basePath}/${previousNext.previous.path}`}>Previous</Link> : <span />}
      {section ? <Link to={`${basePath}/${section}`}>Back to Section</Link> : <Link to={basePath}>Back to Hub</Link>}
      <a href="#top">Top</a>
      {previousNext.next ? <Link to={`${basePath}/${previousNext.next.path}`}>Next</Link> : <span />}
    </nav>
  );
}

function dragonlancePreviousNext(path) {
  const index = dragonlanceFlatPages.findIndex((page) => page.path === path);
  return {
    previous: index > 0 ? dragonlanceFlatPages[index - 1] : null,
    next: index >= 0 && index < dragonlanceFlatPages.length - 1 ? dragonlanceFlatPages[index + 1] : null,
  };
}

function raceDetailRows(record) {
  const rows = [];
  addDetailRow(rows, "Ability Adjustments", record.ability_adjustments, formatRecordMap);
  addDetailRow(rows, "Ability Minimums", record.ability_minimums, formatRecordMap);
  addDetailRow(rows, "Ability Maximums", record.ability_maximums, formatRecordMap);
  addDetailRow(rows, "Movement", record.movement, (value) => `${value} ft`);
  addDetailRow(rows, "Size", record.size, titleCase);
  addDetailRow(rows, "Vision", record.vision, formatRecordList);
  addDetailRow(rows, "Languages", record.languages, formatRulesRefs);
  addDetailRow(rows, "Class Access", record.class_access, formatRulesRefs);
  addDetailRow(rows, "Saving Throw Adjustments", record.saving_throw_modifiers, formatRecordList);
  addDetailRow(rows, "Combat Modifiers", record.combat_modifiers, formatRecordList);
  addDetailRow(rows, "Restrictions", record.restrictions, formatRecordList);
  return rows;
}

function addDetailRow(rows, label, value, formatter) {
  if (!hasDisplayValue(value)) return;
  rows.push({ label, value: formatter(value) });
}

function hasDisplayValue(value) {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function sourcePageLabel(record) {
  const page = record?.source_ref?.page;
  const section = record?.source_ref?.section;
  if (page && section) return `page ${page}, ${section}`;
  if (page) return `page ${page}`;
  return "Source Verification Required";
}

function osricBaseRaceLink(record, presentation = {}) {
  const base = record.base_osric_race_ref?.split(".").pop() || presentation.osricBase?.toLowerCase().replace(/\s+/g, "-");
  if (!base) return "None";
  const label = presentation.osricBase || titleCase(base);
  return <a href={`/1e/races/${base}/`}>First Edition {label}</a>;
}

function RulesRelationships({ record, presentation }) {
  const links = [
    ...(presentation.relationships || []),
  ];
  if (record.base_osric_race_ref) {
    const base = record.base_osric_race_ref.split(".").pop();
    links.unshift({ label: `First Edition ${titleCase(base)}`, href: `/1e/races/${base}/` });
  }
  const languageText = record.languages?.length ? formatRulesRefs(record.languages) : null;
  const classText = record.class_access?.length ? formatRulesRefs(record.class_access) : null;
  return (
    <>
      <h2>Rules Relationships</h2>
      <div className="source-pending-box compact-source-box">
        {links.length ? <p>{links.map((link, index) => <span key={`${link.href}-${link.label}`}>{index > 0 ? " | " : ""}<a href={link.href}>{link.label}</a></span>)}</p> : <p>No First Edition base race is recorded for this Krynn race.</p>}
        {languageText ? <p>Languages: {languageText}</p> : null}
        {classText ? <p>Class records: {classText}</p> : null}
      </div>
    </>
  );
}

function formatRecordMap(value = {}) {
  const entries = Object.entries(value || {});
  return entries.length
    ? entries.map(([key, item]) => {
      const amount = item == null ? "Source Verification Required" : `${Number(item) > 0 ? "+" : ""}${item}`;
      return `${titleCase(key)} ${amount}`;
    }).join(", ")
    : "None";
}

function formatRecordList(value = []) {
  return value?.length ? value.join(", ") : "Source verification required";
}

function formatRulesRefs(value = []) {
  if (!value?.length) return "Source verification required";
  return value.map((entry) => String(entry).replace(/^osric\./, "First Edition: ").replace(/^dragolance\./, "Dragolance: ").replace(/\./g, " ")).join(", ");
}

function formatCell(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value == null || value === "") return "-";
  return String(value);
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function PlayerHero({ eyebrow, title, copy }) {
  if (isClassicHost() || isLocalDragoHost()) return <Header eyebrow={eyebrow} title={title} copy={copy} className="player-hero" />;
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
        copy="Manage Dragolance player accounts, campaign access, and credentials."
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
            <a className="table-link" href={`/1e/characters/${character.id}/?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`} target="_blank" rel="noreferrer">Open Sheet</a>
            <a className="table-link" href={`/1e/characters/${character.id}/edit/?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`}>Edit</a>
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

function RulesSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSource = searchParams.get("source") || "all";
  const selectedType = searchParams.get("type") || "all";
  const search = searchParams.get("q") || "";
  const selectedRecordId = searchParams.get("record") || "";
  const { data: catalog, error, loading } = useLoad(() => api("/1e/reference/catalog"), []);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);

  const sources = catalog?.sources || [];
  const allItems = [...(catalog?.rules_pages || []), ...(catalog?.records || [])];
  const typeOptions = makeTypeOptions(catalog || {});
  const filteredItems = filterReferenceItems(allItems, {
    source: selectedSource,
    type: selectedType,
    query: search,
  });

  useEffect(() => {
    if (!selectedRecordId) {
      setDetail(null);
      setDetailError("");
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    api(`/1e/reference/records/${encodeURIComponent(selectedRecordId)}`)
      .then((payload) => {
        if (!cancelled) setDetail(payload);
      })
      .catch((err) => {
        if (!cancelled) setDetailError(err.message);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRecordId]);

  function updateFilters(updates) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
    });
    if ("source" in updates || "type" in updates || "q" in updates) next.delete("record");
    setSearchParams(next);
  }

  function selectRecord(recordId) {
    const next = new URLSearchParams(searchParams);
    next.set("record", recordId);
    setSearchParams(next);
  }

  return (
    <section>
      <Header
        eyebrow="DM Reference"
        title="Rules & Settings"
        copy="Browse the installed First Edition rules pages and canonical source-library records from one read-only desk."
        action={<a className="secondary-button" href="/rules" target="_blank" rel="noreferrer">Open in New Tab</a>}
      />
      <PageState loading={loading} error={error} />
      {!loading && !error ? (
        <div className="rules-browser">
          <Panel className="rules-sidebar">
            <label>Source Library
              <select value={selectedSource} onChange={(event) => updateFilters({ source: event.target.value })}>
                <option value="all">All Sources</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>{recordTitle(source)}</option>
                ))}
              </select>
            </label>
            <label>Search
              <input value={search} onChange={(event) => updateFilters({ q: event.target.value })} placeholder="Search rules, IDs, records..." />
            </label>
            <nav className="rules-type-list" aria-label="Reference categories">
              <button className={selectedType === "all" ? "active" : ""} onClick={() => updateFilters({ type: "all" })}>All Reference</button>
              {typeOptions.map((type) => (
                <button key={type} className={selectedType === type ? "active" : ""} onClick={() => updateFilters({ type })}>
                  {typeLabel(type)}
                </button>
              ))}
            </nav>
          </Panel>

          <Panel className="rules-results">
            <div className="rules-panel-heading">
              <div>
                <p className="eyebrow">Results</p>
                <h2>{selectedType === "all" ? "All Reference" : typeLabel(selectedType)}</h2>
              </div>
              <span className="status-pill">{filteredItems.length} records</span>
            </div>
            {filteredItems.length ? (
              <div className="reference-list">
                {filteredItems.map((item) => <ReferenceListItem key={item.id} item={item} sources={sources} active={item.id === selectedRecordId} onSelect={selectRecord} />)}
              </div>
            ) : (
              <p className="muted">No records match the selected source, category, and search.</p>
            )}
          </Panel>

          <Panel className="rules-detail">
            {selectedRecordId ? (
              <>
                <PageState loading={detailLoading} error={detailError} />
                {detail?.record ? <ReferenceDetail payload={detail} sources={sources} onSelect={selectRecord} /> : null}
              </>
            ) : (
              <div className="empty-reference">
                <p className="eyebrow">Detail</p>
                <h2>Select a canonical record.</h2>
                <p className="muted">Rules pages open in the protected Player's Guide. Canonical records render here with relationships and internal review metadata.</p>
              </div>
            )}
          </Panel>
        </div>
      ) : null}
    </section>
  );
}

function ReferenceListItem({ item, sources, active, onSelect }) {
  const isRulesPage = item.type === "rules_page";
  const detailPath = `/rules?source=${encodeURIComponent(item.source_library_id || "all")}&type=${encodeURIComponent(item.type)}&record=${encodeURIComponent(item.id)}`;
  const body = (
    <>
      <div>
        <strong>{recordTitle(item)}</strong>
        <p>{recordSummary(item)}</p>
      </div>
      <div className="reference-meta">
        <span>{typeLabel(item.type)}</span>
        <span>{sourceLabel(item.source_library_id, sources)}</span>
        {reviewStatus(item) ? <span>{reviewStatus(item)}</span> : null}
      </div>
    </>
  );
  if (isRulesPage) {
    return <a className="reference-row" href={item.route}>{body}</a>;
  }
  return <Link className={`reference-row ${active ? "active" : ""}`} to={detailPath} onClick={() => onSelect(item.id)}>{body}</Link>;
}

function ReferenceDetail({ payload, sources, onSelect }) {
  const { record, references } = payload;
  const hiddenKeys = new Set(["id", "type", "name", "display_name", "source_library_id", "review", "visibility", "tags", "version", "deprecated", "replaces"]);
  const contentEntries = Object.entries(record).filter(([key, value]) => !hiddenKeys.has(key) && hasReferenceValue(value));
  return (
    <article className="reference-detail-view">
      <div className="detail-title-row">
        <div>
          <p className="eyebrow">{typeLabel(record.type)}</p>
          <h2>{recordTitle(record)}</h2>
        </div>
        {reviewStatus(record) ? <span className="status-pill">{reviewStatus(record)}</span> : null}
      </div>
      <dl className="reference-facts">
        <div><dt>Canonical ID</dt><dd>{record.id}</dd></div>
        <div><dt>Source</dt><dd>{sourceLabel(record.source_library_id, sources)}</dd></div>
        {record.version ? <div><dt>Version</dt><dd>{record.version}</dd></div> : null}
        {record.deprecated ? <div><dt>Deprecated</dt><dd>Yes</dd></div> : null}
      </dl>
      {contentEntries.map(([key, value]) => (
        <section className="reference-section" key={key}>
          <h3>{titleize(key)}</h3>
          <ReferenceValue value={value} onSelect={onSelect} />
        </section>
      ))}
      {references?.length ? (
        <section className="reference-section">
          <h3>Canonical Relationships</h3>
          <div className="relationship-list">
            {references.map((reference) => (
              reference.resolved ? (
                <button className="relationship-chip" key={reference.id} type="button" onClick={() => onSelect(reference.id)}>
                  {safeDisplayText(reference.display_name || reference.id)}<small>{safeDisplayText(reference.type)}</small>
                </button>
              ) : (
                <span className="relationship-chip unresolved" key={reference.id}>{safeDisplayText(reference.id)}<small>unresolved</small></span>
              )
            ))}
          </div>
        </section>
      ) : null}
      <details className="raw-record">
        <summary>Raw canonical record</summary>
        <pre>{JSON.stringify(record, null, 2)}</pre>
      </details>
    </article>
  );
}

function ReferenceValue({ value, onSelect }) {
  if (!hasReferenceValue(value)) return null;
  if (Array.isArray(value)) {
    if (value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
      return <ReferenceTable rows={value} onSelect={onSelect} />;
    }
    return <ul className="reference-list-values">{value.map((item, index) => <li key={index}><ReferenceValue value={item} onSelect={onSelect} /></li>)}</ul>;
  }
  if (value && typeof value === "object") {
    return (
      <dl className="reference-object">
        {Object.entries(value).filter(([, nested]) => hasReferenceValue(nested)).map(([key, nested]) => (
          <div key={key}>
            <dt>{titleize(key)}</dt>
            <dd><ReferenceValue value={nested} onSelect={onSelect} /></dd>
          </div>
        ))}
      </dl>
    );
  }
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (isCanonicalId(value)) return <button className="inline-reference" type="button" onClick={() => onSelect(value)}>{value}</button>;
  return <span>{safeDisplayText(value)}</span>;
}

function ReferenceTable({ rows, onSelect }) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row).filter((key) => hasReferenceValue(row[key]))))];
  return (
    <div className="table-wrap compact-table">
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{titleize(column)}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => <td key={column}><ReferenceValue value={row[column]} onSelect={onSelect} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function hasReferenceValue(value) {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.some(hasReferenceValue);
  if (typeof value === "object") return Object.values(value).some(hasReferenceValue);
  return true;
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
  const location = useLocation();

  useEffect(() => {
    document.title = isClassicHost()
      ? "Drago Table — Player"
      : location.pathname.startsWith("/portal")
        ? "Drago Table — Player"
        : "Drago Table — Dungeon Master";
  }, [location.pathname]);

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
            <Route path="/campaigns/:id/maps/:mapId" element={<PlayerMapPage />} />
            <Route path="/characters" element={<PlayerCharactersPage />} />
            <Route path="/characters/new" element={<PlayerCreateCharacterPage />} />
            <Route path="/dragonlance/*" element={<DragonlanceGuidePage />} />
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
          <Route path="/portal/campaigns/:id/maps/:mapId" element={<PlayerMapPage />} />
          <Route path="/portal/characters" element={<PlayerCharactersPage />} />
          <Route path="/portal/characters/new" element={<PlayerCreateCharacterPage />} />
          <Route path="/portal/campaigns/:id/characters/new" element={<PlayerCreateCharacterPage />} />
          <Route path="/portal/dragonlance/*" element={<DragonlanceGuidePage />} />
        </Route>
        <Route element={<Protected><Shell /></Protected>}>
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/table" element={<DragoTableIndexPage />} />
          <Route path="/campaigns/:id" element={<CampaignWorkspace />} />
          <Route path="/campaigns/:id/table" element={<DragoTablePage />} />
          <Route path="/campaigns/:id/players" element={<CampaignWorkspace initialTab="players" />} />
          <Route path="/campaigns/:id/characters" element={<CampaignWorkspace initialTab="characters" />} />
          <Route path="/campaigns/:id/notes" element={<CampaignWorkspace initialTab="session-notes" />} />
          <Route path="/rules" element={<RulesBrowserBoundary><RulesSettingsPage /></RulesBrowserBoundary>} />
          <Route path="/monsters" element={<MonstersPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/1e/characters" element={<PlayerVaultToolPage />} />
          <Route path="/1e/characters/new" element={<PlayerVaultToolPage />} />
          <Route path="/1e/characters/:id" element={<PlayerVaultToolPage />} />
          <Route path="/1e/characters/:id/edit" element={<PlayerVaultToolPage />} />
          <Route path="/sessions" element={<Navigate to="/campaigns" replace />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/settings" element={<PlaceholderPage eyebrow="Portal" title="Settings" copy="Portal preferences and account controls will live here." />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
