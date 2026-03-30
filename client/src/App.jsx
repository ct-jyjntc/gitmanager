import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Cpu,
  GitBranch,
  Globe,
  LayoutDashboard,
  MoonStar,
  Network,
  PackageOpen,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  SunMedium,
  Tags,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RepositoryPicker from './components/RepositoryPicker';
import GitStatusPanel from './components/GitStatusPanel';
import CommitHistory from './components/CommitHistory';
import DiffViewer from './components/DiffViewer';
import BranchManager from './components/BranchManager';
import StashPanel from './components/StashPanel';
import GeekToolbox from './components/GeekToolbox';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001/api/git',
});

const tabs = [
  { id: 'status', icon: Activity, titleKey: 'nav.workspace', subtitleKey: 'nav.workspaceSubtitle' },
  { id: 'branches', icon: Network, titleKey: 'nav.branches', subtitleKey: 'nav.branchesSubtitle' },
  { id: 'log', icon: GitBranch, titleKey: 'nav.log', subtitleKey: 'nav.logSubtitle' },
  { id: 'stash', icon: PackageOpen, titleKey: 'nav.stash', subtitleKey: 'nav.stashSubtitle' },
  { id: 'geek', icon: Cpu, titleKey: 'nav.geek', subtitleKey: 'nav.geekSubtitle' },
];

function App() {
  const { t, i18n } = useTranslation();
  const [repoSummary, setRepoSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('status');
  const [selectedFile, setSelectedFile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('gitmanager-theme') || 'dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('gitmanager-sidebar-collapsed') === 'true');
  const [isMobile, setIsMobile] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsOpen, setEventsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('gitmanager-theme', theme);
  }, [theme]);

  useEffect(() => {
    const checkMobile = () => {
      const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      setIsMobile(mobileUserAgent || window.innerWidth < 900);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem('gitmanager-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingSummary(true);
        const { data } = await api.get('/summary');
        setRepoSummary(data);
      } catch (error) {
        showMessage(error.response?.data?.error || error.message, 'error');
      } finally {
        setLoadingSummary(false);
      }
    };

    run();
  }, [refreshKey]);

  const refreshAll = () => setRefreshKey((value) => value + 1);

  const addEvent = (text, type = 'info') => {
    if (!text) return;

    const nextEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      type,
      time: new Date().toLocaleTimeString(),
    };

    setEvents((current) => [nextEvent, ...current].slice(0, 30));
  };

  const showMessage = (text, type = 'info') => {
    if (!text) return;
    addEvent(text, type);
    const logMethod = type === 'error' ? 'error' : 'log';
    console[logMethod](text);
  };

  const handlePathChange = async (newPath) => {
    await api.post('/path', { path: newPath });
    setSelectedFile(null);
    refreshAll();
    showMessage(t('feedback.repoChanged'), 'success');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const toggleTheme = () => {
    setTheme((value) => (value === 'dark' ? 'light' : 'dark'));
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((value) => !value);
  };

  const toggleEvents = () => {
    setEventsOpen((value) => !value);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabMeta.icon;

  if (isMobile) {
    return (
      <div className="desktop-only-screen">
        <div className="desktop-only-card glass-panel">
          <LayoutDashboard size={28} color="var(--accent)" />
          <h1>{t('app.title')}</h1>
          <p>{t('app.desktopOnly')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <header className="glass-panel native-toolbar desktop-titlebar">
        <div className="toolbar-left no-drag">
          <div className="toolbar-brand">
            <LayoutDashboard size={18} color="var(--accent)" />
            <span>{t('app.title')}</span>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-page">
            <ActiveIcon size={18} />
            <span>{t(activeTabMeta.titleKey)}</span>
          </div>
        </div>

        <div className="toolbar-right no-drag">
          <button
            className="btn btn-ghost topbar-tool-btn"
            title={sidebarCollapsed ? t('layout.expandSidebar') : t('layout.collapseSidebar')}
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <button className="btn btn-ghost topbar-tool-btn" title={t('layout.toggleTheme')} onClick={toggleTheme}>
            {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
          </button>
          <button className="btn btn-ghost topbar-tool-btn topbar-lang-btn" title={t('app.toggleLanguage')} onClick={toggleLanguage}>
            <Globe size={16} />
            {i18n.language.toUpperCase()}
          </button>
            <button className="btn btn-ghost event-center-trigger" onClick={toggleEvents} aria-label={t('events.title')}>
              <span className="event-count-badge">{events.length}</span>
            </button>
          <span className="toolbar-chip">{repoSummary?.path || t('app.noRepo')}</span>
          {repoSummary?.remotes?.length > 0 && (
            <span className="toolbar-chip">
              <Tags size={14} />
              {t('summary.remoteCount', { count: repoSummary.remotes.length })}
            </span>
          )}
        </div>
      </header>

      {eventsOpen && (
        <section className="glass-panel shell-card event-center-panel">
          <div className="panel-toolbar">
            <h3 className="subpanel-title" style={{ marginBottom: 0 }}>{t('events.title')}</h3>
            <div className="action-row">
              {events.length > 0 && (
                <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={clearEvents}>
                  {t('events.clear')}
                </button>
              )}
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={toggleEvents}>
                ×
              </button>
            </div>
          </div>

          <div className="event-center-list">
            {events.length === 0 ? (
              <div className="empty-state">{t('events.empty')}</div>
            ) : (
              events.map((event) => (
                <div key={event.id} className={`event-row event-${event.type}`}>
                  <span className="event-icon">
                    {event.type === 'error' ? <CircleAlert size={14} /> : <CheckCircle2 size={14} />}
                  </span>
                  <div className="event-copy">
                    <div className="event-text">{event.text}</div>
                    <div className="event-time">{event.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <div className={`layout-container zashboard-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <aside className={`sidebar-column ${sidebarCollapsed ? 'sidebar-column-collapsed' : ''}`}>
          {!sidebarCollapsed && (
            <section className="glass-panel shell-card repo-card">
              <div className="card-head">
                <span className="card-kicker">{t('layout.repository')}</span>
                <div className="repo-pill-row">
                  <div className="repo-pill">
                    <GitBranch size={14} color="var(--green)" />
                    <span>{repoSummary?.branch || 'HEAD'}</span>
                  </div>
                  <button className="btn btn-ghost repo-refresh" onClick={refreshAll} disabled={loadingSummary}>
                    <RefreshCw size={14} className={loadingSummary ? 'spin' : ''} />
                  </button>
                </div>
              </div>

              <RepositoryPicker
                api={api}
                currentPath={repoSummary?.path || ''}
                onChange={handlePathChange}
                onMessage={showMessage}
                onRefresh={refreshAll}
              />

              {repoSummary && (
                <div className="summary-grid">
                  <div className="summary-card summary-card-branch">
                    <span className="summary-label">{t('summary.branch')}</span>
                    <span className="summary-value">{repoSummary.branch || '-'}</span>
                  </div>
                  <div className="summary-card">
                    <span className="summary-label">{t('summary.sync')}</span>
                    <span className="summary-value">+{repoSummary.ahead ?? 0} / -{repoSummary.behind ?? 0}</span>
                  </div>
                  <div className="summary-card">
                    <span className="summary-label">{t('summary.status')}</span>
                    <span className="summary-value">{repoSummary.isClean ? t('summary.clean') : t('summary.dirty')}</span>
                  </div>
                  <div className="summary-card">
                    <span className="summary-label">{t('summary.tags')}</span>
                    <span className="summary-value">{repoSummary.tagCount ?? 0}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="glass-panel shell-card nav-card">
            <div className="card-head">
              <span className="card-kicker">{t('layout.modules')}</span>
            </div>
            <nav className="sidebar-nav card-grid-nav">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    className={`nav-tile ${isActive ? 'nav-tile-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    title={t(tab.titleKey)}
                  >
                    <span className="nav-icon-wrap">
                      <Icon size={16} />
                    </span>
                    {!sidebarCollapsed && (
                      <span className="nav-copy">
                        <strong>{t(tab.titleKey)}</strong>
                        <small>{t(tab.subtitleKey)}</small>
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </section>
        </aside>

        <main className="main-content">
          <section className="content-shell">
            {activeTab === 'status' && (
              <div className="workspace-stage-layout">
                <div className="workspace-stage-column module-card">
                  <GitStatusPanel
                    api={api}
                    key={`status-${refreshKey}`}
                    onFileSelect={setSelectedFile}
                    onMessage={showMessage}
                    onRefresh={refreshAll}
                  />
                </div>
                <div className="workspace-diff-column glass-panel module-card">
                  <DiffViewer api={api} file={selectedFile} refreshKey={refreshKey} />
                </div>
              </div>
            )}

            {activeTab === 'branches' && (
              <div className="module-card" style={{ flex: 1 }}>
                <BranchManager
                  api={api}
                  currentBranch={repoSummary?.branch}
                  onMessage={showMessage}
                  onRefresh={refreshAll}
                  refreshKey={refreshKey}
                />
              </div>
            )}

            {activeTab === 'log' && (
              <div className="glass-panel page-panel module-card">
                <CommitHistory api={api} onMessage={showMessage} onRefresh={refreshAll} refreshKey={refreshKey} />
              </div>
            )}

            {activeTab === 'stash' && (
              <div className="module-card" style={{ flex: 1 }}>
                <StashPanel api={api} onMessage={showMessage} onRefresh={refreshAll} refreshKey={refreshKey} />
              </div>
            )}

            {activeTab === 'geek' && (
              <div className="module-card" style={{ flex: 1, minWidth: 0 }}>
                <GeekToolbox
                  api={api}
                  onMessage={showMessage}
                  onRefresh={refreshAll}
                  branch={repoSummary?.branch}
                  remoteCount={repoSummary?.remotes?.length ?? 0}
                  refreshKey={refreshKey}
                />
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
