import { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle,
  Eraser,
  FileCode2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PanelHeader from './ui/PanelHeader';
import EmptyState from './ui/EmptyState';
import LoadingState from './ui/LoadingState';

const mergeFiles = (status) => {
  const renamedFiles = (status.renamed || []).map((item) => item.to);
  return {
    unstaged: [...(status.modified || []), ...(status.not_added || []), ...(status.deleted || []), ...renamedFiles],
    staged: status.staged || [],
    conflicted: status.conflicted || [],
  };
};

function MetricTile({ label, value, tone = 'default' }) {
  return (
    <div className={`workspace-metric-card tone-${tone}`}>
      <span className="workspace-metric-label">{label}</span>
      <strong className="workspace-metric-value">{value}</strong>
    </div>
  );
}

function FileListGroup({
  title,
  count,
  action,
  actionLabel,
  files,
  empty,
  renderActions,
  onSelect,
  tone = 'default',
}) {
  return (
    <section className={`workspace-group tone-${tone}`}>
      <div className="workspace-group-head">
        <div>
          <div className="subpanel-title" style={{ marginBottom: 2 }}>{title}</div>
          <div className="muted-copy">{count}</div>
        </div>
        {action ? (
          <button className="btn btn-ghost workspace-quiet-btn" onClick={action}>
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="workspace-file-stack">
        {files.length === 0 ? (
          <EmptyState>{empty}</EmptyState>
        ) : (
          files.map((file) => (
            <div key={file.name} className="workspace-file-row" onClick={() => onSelect(file.payload)}>
              <div className="workspace-file-main">
                <span className="workspace-file-icon">
                  <FileCode2 size={14} />
                </span>
                <span className="workspace-file-name">{file.name}</span>
              </div>
              <div className="action-row">{renderActions(file.name)}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function GitStatusPanel({ api, onFileSelect, onMessage, onRefresh }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [amendCommit, setAmendCommit] = useState(false);
  const [activeSection, setActiveSection] = useState('unstaged');

  const reportError = (error) => {
    onMessage(error.response?.data?.error || error.message, 'error');
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/status');
      setStatus(data);
    } catch (error) {
      reportError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const syncAfterChange = async (messageKey) => {
    await fetchStatus();
    onRefresh();
    if (messageKey) onMessage(t(messageKey), 'success');
  };

  const handleStage = async (file) => {
    try {
      await api.post('/stage', { files: [file] });
      await syncAfterChange();
    } catch (error) {
      reportError(error);
    }
  };

  const handleUnstage = async (file) => {
    try {
      await api.post('/unstage', { files: [file] });
      await syncAfterChange();
    } catch (error) {
      reportError(error);
    }
  };

  const restoreFile = async (file, staged = false) => {
    const key = staged ? 'status.restoreStagedConfirm' : 'status.restoreConfirm';
    if (!window.confirm(t(key, { file }))) return;
    try {
      await api.post('/restore', { files: [file], staged });
      await syncAfterChange(staged ? 'feedback.restoreStagedDone' : 'feedback.restoreDone');
    } catch (error) {
      reportError(error);
    }
  };

  const stageAll = async () => {
    try {
      await api.post('/stage', { files: ['.'] });
      await syncAfterChange('feedback.stageAllDone');
    } catch (error) {
      reportError(error);
    }
  };

  const unstageAll = async () => {
    if (!status?.staged?.length) return;
    try {
      await api.post('/unstage', { files: status.staged });
      await syncAfterChange('feedback.unstageAllDone');
    } catch (error) {
      reportError(error);
    }
  };

  const restoreAll = async () => {
    if (!status) return;
    const targets = [...(status.modified || []), ...(status.deleted || []), ...(status.renamed || []).map((item) => item.to)];
    if (!targets.length || !window.confirm(t('status.restoreAllConfirm'))) return;
    try {
      await api.post('/restore', { files: targets, staged: false });
      await syncAfterChange('feedback.restoreAllDone');
    } catch (error) {
      reportError(error);
    }
  };

  const cleanUntracked = async () => {
    if (!status?.not_added?.length || !window.confirm(t('status.cleanUntrackedConfirm'))) return;
    try {
      await api.post('/clean', { forceDirectories: true });
      await syncAfterChange('feedback.cleanDone');
    } catch (error) {
      reportError(error);
    }
  };

  const commit = async () => {
    if (!commitMsg.trim()) return;
    try {
      await api.post('/commit', { message: commitMsg, amend: amendCommit });
      setCommitMsg('');
      setAmendCommit(false);
      onFileSelect(null);
      await syncAfterChange(amendCommit ? 'feedback.amendDone' : 'feedback.commitDone');
    } catch (error) {
      reportError(error);
    }
  };

  if (!status) {
    return (
      <div className="glass-panel module-surface">
        {loading ? <LoadingState label={t('common.loading')} /> : t('common.noData')}
      </div>
    );
  }

  const groups = mergeFiles(status);
  const isWorkspaceClean =
    groups.unstaged.length === 0 &&
    groups.staged.length === 0 &&
    groups.conflicted.length === 0;
  const unstagedFiles = groups.unstaged.map((file) => ({
    name: file,
    payload: { name: file, isStaged: false },
    isUntracked: (status.not_added || []).includes(file),
  }));
  const stagedFiles = groups.staged.map((file) => ({
    name: file,
    payload: { name: file, isStaged: true },
  }));
  const sections = [
    {
      key: 'unstaged',
      title: t('status.unstaged'),
      count: groups.unstaged.length,
    },
    {
      key: 'staged',
      title: t('status.staged'),
      count: groups.staged.length,
    },
    {
      key: 'conflicted',
      title: t('status.conflicted'),
      count: groups.conflicted.length,
    },
  ];

  return (
    <div className="glass-panel module-surface workspace-zb-panel">
      <PanelHeader
        title={t('status.title')}
        icon={<Activity size={18} />}
        actions={(
          <button className="btn btn-ghost workspace-refresh-btn" onClick={fetchStatus}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        )}
      />

      <div className="workspace-controls-bar">
        <button className="workspace-chip-btn" onClick={restoreAll} disabled={!((status.modified || []).length || (status.deleted || []).length || (status.renamed || []).length)}>
          <RotateCcw size={14} />
          {t('status.restoreAll')}
        </button>
        <button className="workspace-chip-btn" onClick={cleanUntracked} disabled={!(status.not_added || []).length}>
          <Trash2 size={14} />
          {t('status.cleanUntracked')}
        </button>
      </div>

      <div className="workspace-metrics-grid">
        <MetricTile label={t('status.unstaged')} value={groups.unstaged.length} tone="muted" />
        <MetricTile label={t('status.staged')} value={groups.staged.length} tone="accent" />
        <MetricTile label={t('status.conflicted')} value={groups.conflicted.length} tone="danger" />
        <MetricTile label={t('summary.status')} value={isWorkspaceClean ? t('summary.clean') : t('summary.dirty')} tone="soft" />
      </div>

      <section className="workspace-switcher-shell">
        <div className="workspace-controls-bar workspace-section-tabs">
          {sections.map((section) => (
            <button
              key={section.key}
              className={`workspace-chip-btn workspace-section-tab ${activeSection === section.key ? 'workspace-section-tab-active' : ''}`}
              onClick={() => setActiveSection(section.key)}
            >
              <span>{section.title}</span>
              <span className="workspace-tab-count">{section.count}</span>
            </button>
          ))}
        </div>

        {activeSection === 'unstaged' && (
          <FileListGroup
            title={t('status.unstaged')}
            count={`${groups.unstaged.length} files`}
            action={stageAll}
            actionLabel={t('status.stageAll')}
            files={unstagedFiles}
            empty={t('status.clean')}
            onSelect={onFileSelect}
            renderActions={(fileName) => {
              const isUntracked = (status.not_added || []).includes(fileName);
              return (
                <>
                  <button className="btn btn-ghost workspace-icon-btn" onClick={(event) => { event.stopPropagation(); handleStage(fileName); }}>
                    <Plus size={14} />
                  </button>
                  {!isUntracked && (
                    <button className="btn btn-ghost workspace-icon-btn restore" onClick={(event) => { event.stopPropagation(); restoreFile(fileName, false); }}>
                      <RotateCcw size={14} />
                    </button>
                  )}
                  {isUntracked && (
                    <button className="btn btn-ghost workspace-icon-btn danger" onClick={(event) => { event.stopPropagation(); cleanUntracked(); }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              );
            }}
          />
        )}

        {activeSection === 'staged' && (
          <FileListGroup
            title={t('status.staged')}
            count={`${groups.staged.length} files`}
            action={unstageAll}
            actionLabel={t('status.unstageAll')}
            files={stagedFiles}
            empty={t('status.noStaged')}
            onSelect={onFileSelect}
            tone="accent"
            renderActions={(fileName) => (
              <>
                <button className="btn btn-ghost workspace-icon-btn restore" onClick={(event) => { event.stopPropagation(); handleUnstage(fileName); }}>
                  <Minus size={14} />
                </button>
                <button className="btn btn-ghost workspace-icon-btn danger" onClick={(event) => { event.stopPropagation(); restoreFile(fileName, true); }}>
                  <Eraser size={14} />
                </button>
              </>
            )}
          />
        )}

        {activeSection === 'conflicted' && (
          <section className="workspace-conflicts-card">
            <div className="workspace-group-head">
              <div>
                <div className="subpanel-title" style={{ marginBottom: 2 }}>{t('status.conflicted')}</div>
                <div className="muted-copy">{`${groups.conflicted.length} files`}</div>
              </div>
            </div>
            <div className="workspace-file-stack">
              {groups.conflicted.length === 0 ? (
                <EmptyState>{t('common.noData')}</EmptyState>
              ) : (
                groups.conflicted.map((file) => (
                  <div key={`conflicted-${file}`} className="workspace-file-row" onClick={() => onFileSelect({ name: file, isStaged: false })}>
                    <div className="workspace-file-main">
                      <span className="workspace-file-icon danger">
                        <FileCode2 size={14} />
                      </span>
                      <span className="workspace-file-name">{file}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </section>

      <section className="workspace-commit-shell">
        <div className="workspace-commit-head">
          <div>
            <div className="subpanel-title" style={{ marginBottom: 2 }}>{t('status.commitBtn')}</div>
            <div className="muted-copy">{groups.staged.length ? t('status.readyFiles', { count: groups.staged.length }) : t('status.noStaged')}</div>
          </div>
        </div>

        <input
          className="input-text"
          placeholder={t('status.commitMsg')}
          value={commitMsg}
          onChange={(event) => setCommitMsg(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && commit()}
        />

        <label className="toggle-row workspace-toggle-row">
          <input type="checkbox" checked={amendCommit} onChange={(event) => setAmendCommit(event.target.checked)} />
          <span>{t('status.amend')}</span>
        </label>

        <button className="btn btn-primary workspace-commit-btn" disabled={!commitMsg.trim() || groups.staged.length === 0} onClick={commit}>
          <CheckCircle size={16} /> {t('status.commitBtn')}
        </button>
      </section>
    </div>
  );
}
