import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Activity,
  Cpu,
  GitBranch,
  Globe,
  LayoutDashboard,
  Network,
  PackageOpen,
  RefreshCw,
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

const api = axios.create({ baseURL: 'http://localhost:3001/api/git' });

const tabs = [
  { id: 'status', icon: Activity, titleKey: 'nav.workspace', subtitle: 'Stage, restore, diff' },
  { id: 'branches', icon: Network, titleKey: 'nav.branches', subtitle: 'Local and remote refs' },
  { id: 'log', icon: GitBranch, titleKey: 'nav.log', subtitle: 'Commits and history ops' },
  { id: 'stash', icon: PackageOpen, titleKey: 'nav.stash', subtitle: 'Shelved work' },
  { id: 'geek', icon: Cpu, titleKey: 'nav.geek', subtitle: 'Full git console' },
];

function App() {
  const { t, i18n } = useTranslation();
  const [repoSummary, setRepoSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('status');
  const [selectedFile, setSelectedFile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingSummary(true);
        const { data } = await api.get('/summary');
        setRepoSummary(data);
      } catch (error) {
        setMessage({ text: error.response?.data?.error || error.message, type: 'error' });
      } finally {
        setLoadingSummary(false);
      }
    };

    run();
  }, [refreshKey]);

  const refreshAll = () => setRefreshKey((value) => value + 1);

  const showMessage = (text, type = 'info') => {
    if (!text) return;
    setMessage({ text, type });
  };

  const clearMessage = () => setMessage(null);

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

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabMeta.icon;

  return (
    <div className="layout-container">
      <aside className="sidebar-column">
        <section className="glass-panel shell-card brand-card">
          <div className="brand-row">
            <div className="brand-block">
              <div className="brand-kicker">Repository Control</div>
              <h1 className="brand-title">
                <LayoutDashboard size={18} color="var(--accent)" />
                {t('app.title')}
              </h1>
            </div>
            <button className="btn btn-ghost sidebar-lang" title={t('app.toggleLanguage')} onClick={toggleLanguage}>
              <Globe size={16} /> {i18n.language.toUpperCase()}
            </button>
          </div>
        </section>

        <section className="glass-panel shell-card repo-card">
          <div className="card-head">
            <span className="card-kicker">Repository</span>
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

        <section className="glass-panel shell-card nav-card">
          <div className="card-head">
            <span className="card-kicker">Modules</span>
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
                >
                  <span className="nav-icon-wrap">
                    <Icon size={16} />
                  </span>
                  <span className="nav-copy">
                    <strong>{t(tab.titleKey)}</strong>
                    <small>{tab.subtitle}</small>
                  </span>
                </button>
              );
            })}
          </nav>
        </section>
      </aside>

      <main className="main-content">
        <header className="glass-panel shell-card page-top card-row">
          <div className="page-title-block">
            <span className="page-kicker">Workspace View</span>
            <h2 className="page-title">
              <ActiveIcon size={18} />
              {t(activeTabMeta.titleKey)}
            </h2>
          </div>

          <div className="page-meta">
            <span className="page-meta-chip">{repoSummary?.path || t('app.noRepo')}</span>
            {repoSummary?.remotes?.length > 0 && (
              <span className="page-meta-chip">
                <Tags size={14} />
                {t('summary.remoteCount', { count: repoSummary.remotes.length })}
              </span>
            )}
          </div>
        </header>

        {message && (
          <div className={`glass-panel shell-card message-banner message-${message.type}`}>
            <span>{message.text}</span>
            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={clearMessage}>
              x
            </button>
          </div>
        )}

        <section className="content-shell">
          {activeTab === 'status' && (
            <div className="workspace-grid stack-on-mobile">
              <div className="workspace-side module-card">
                <GitStatusPanel
                  api={api}
                  key={`status-${refreshKey}`}
                  onFileSelect={setSelectedFile}
                  onMessage={showMessage}
                  onRefresh={refreshAll}
                />
              </div>
              <div className="workspace-main glass-panel module-card">
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
  );
}

export default App;
