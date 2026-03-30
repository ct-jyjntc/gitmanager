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
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PanelHeader from './ui/PanelHeader';
import EmptyState from './ui/EmptyState';

const mergeFiles = (status) => {
  const renamedFiles = (status.renamed || []).map((item) => item.to);
  return {
    unstaged: [...(status.modified || []), ...(status.not_added || []), ...(status.deleted || []), ...renamedFiles],
    staged: status.staged || [],
    conflicted: status.conflicted || [],
  };
};

export default function GitStatusPanel({ api, onFileSelect, onMessage, onRefresh }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [amendCommit, setAmendCommit] = useState(false);

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
    return <div className="glass-panel module-surface">{loading ? t('common.loading') : t('common.noData')}</div>;
  }

  const groups = mergeFiles(status);

  return (
    <div className="glass-panel module-surface">
      <PanelHeader
        title={t('status.title')}
        icon={<Activity size={18} />}
        actions={(
          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={fetchStatus}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        )}
      />

      <div className="control-row" style={{ marginBottom: 0 }}>
        <button className="btn btn-ghost" onClick={restoreAll} disabled={!((status.modified || []).length || (status.deleted || []).length || (status.renamed || []).length)}>
          <RotateCcw size={14} /> {t('status.restoreAll')}
        </button>
        <button className="btn btn-ghost" onClick={cleanUntracked} disabled={!(status.not_added || []).length}>
          <Trash2 size={14} /> {t('status.cleanUntracked')}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{t('status.unstaged')} ({groups.unstaged.length})</span>
            <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={stageAll}>
              <Plus size={12} /> {t('status.stageAll')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {groups.unstaged.map((file) => {
              const isUntracked = (status.not_added || []).includes(file);
              return (
                <div key={`unstaged-${file}`} className="list-item" onClick={() => onFileSelect({ name: file, isStaged: false })}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: 0 }}>
                    <FileCode2 size={14} color="gray" />
                    <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px' }} onClick={(event) => { event.stopPropagation(); handleStage(file); }}>
                      <Plus size={14} />
                    </button>
                    {!isUntracked && (
                      <button className="btn btn-ghost" style={{ padding: '4px', color: 'var(--orange)' }} onClick={(event) => { event.stopPropagation(); restoreFile(file, false); }}>
                        <RotateCcw size={14} />
                      </button>
                    )}
                    {isUntracked && (
                      <button className="btn btn-ghost" style={{ padding: '4px', color: 'var(--red)' }} onClick={(event) => { event.stopPropagation(); cleanUntracked(); }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {groups.unstaged.length === 0 && (
              <EmptyState>{t('status.clean')}</EmptyState>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{t('status.staged')} ({groups.staged.length})</span>
            <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={unstageAll} disabled={!groups.staged.length}>
              <Minus size={12} /> {t('status.unstageAll')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {groups.staged.map((file) => (
              <div key={`staged-${file}`} className="list-item" onClick={() => onFileSelect({ name: file, isStaged: true })}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <FileCode2 size={14} color="var(--accent)" />
                  <span style={{ fontSize: '13px', color: 'var(--accent)' }}>{file}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-ghost" style={{ padding: '4px', color: 'var(--orange)' }} onClick={(event) => { event.stopPropagation(); handleUnstage(file); }}>
                    <Minus size={14} />
                  </button>
                  <button className="btn btn-ghost" style={{ padding: '4px', color: 'var(--red)' }} onClick={(event) => { event.stopPropagation(); restoreFile(file, true); }}>
                    <Eraser size={14} />
                  </button>
                </div>
              </div>
            ))}
            {groups.staged.length === 0 && (
              <EmptyState>{t('status.noStaged')}</EmptyState>
            )}
          </div>
        </div>

        {groups.conflicted.length > 0 && (
          <div>
            <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: 'var(--red)' }}>
              {t('status.conflicted')} ({groups.conflicted.length})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {groups.conflicted.map((file) => (
                <div key={`conflicted-${file}`} className="list-item" onClick={() => onFileSelect({ name: file, isStaged: false })}>
                  <span style={{ fontSize: '13px', color: 'var(--red)' }}>{file}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <input
          className="input-text"
          placeholder={t('status.commitMsg')}
          value={commitMsg}
          onChange={(event) => setCommitMsg(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && commit()}
          style={{ marginBottom: '12px' }}
        />
        <label className="toggle-row" style={{ marginBottom: '12px' }}>
          <input type="checkbox" checked={amendCommit} onChange={(event) => setAmendCommit(event.target.checked)} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} /> {t('status.amend')}
          </span>
        </label>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={!commitMsg.trim() || groups.staged.length === 0} onClick={commit}>
          <CheckCircle size={16} /> {t('status.commitBtn')}
        </button>
      </div>
    </div>
  );
}
