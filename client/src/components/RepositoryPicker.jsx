import { useState } from 'react';
import {
  CloudDownload,
  CloudUpload,
  FolderGit2,
  FolderPlus,
  GitFork,
  RadioReceiver,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RepositoryPicker({ currentPath, onChange, api, onMessage, onRefresh }) {
  const { t } = useTranslation();
  const [inputVal, setInputVal] = useState('');
  const [editing, setEditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [repoMode, setRepoMode] = useState('init');
  const [repoForm, setRepoForm] = useState({ path: '', url: '' });

  const reportError = (error) => {
    onMessage(error.response?.data?.error || error.message, 'error');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!inputVal || inputVal === currentPath) {
      setEditing(false);
      return;
    }

    try {
      await onChange(inputVal);
    } catch (error) {
      reportError(error);
    } finally {
      setEditing(false);
    }
  };

  const doSyncAction = async (action, label) => {
    try {
      setSyncing(true);
      await api.post(`/${action}`);
      onRefresh();
      onMessage(t(label), 'success');
    } catch (error) {
      reportError(error);
    } finally {
      setSyncing(false);
    }
  };

  const pickFolder = async () => {
    try {
      const { data } = await api.get('/pick-folder');
      if (data.success && data.path && data.path !== currentPath) {
        await onChange(data.path);
      }
    } catch (error) {
      reportError(error);
    }
  };

  const createRepository = async () => {
    try {
      if (!repoForm.path.trim()) return;

      await api.post('/repository', {
        action: repoMode,
        path: repoForm.path.trim(),
        url: repoForm.url.trim(),
      });
      setRepoForm({ path: '', url: '' });
      onRefresh();
      onMessage(t(repoMode === 'clone' ? 'feedback.cloneDone' : 'feedback.initDone'), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ fontSize: '11px', color: 'var(--border-hover)', textTransform: 'uppercase' }}>
          {t('app.trackRepo')}
        </label>
        <button className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={pickFolder}>
          {t('app.pickFolder')}
        </button>
      </div>

      {!editing ? (
        <div
          onClick={() => {
            setEditing(true);
            setInputVal(currentPath);
          }}
          className="list-item"
          style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', wordBreak: 'break-all', fontSize: '12px', border: '1px solid var(--border-color)' }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <FolderGit2 size={16} color="var(--accent)" />
            <span style={{ color: '#fff' }}>{currentPath || t('app.noRepo')}</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            autoFocus
            className="input-text"
            value={inputVal}
            onChange={(event) => setInputVal(event.target.value)}
            onBlur={handleSubmit}
            placeholder={t('app.pathPlaceholder')}
          />
        </form>
      )}

      <div className="repo-builder">
        <div className="repo-mode-switch">
          <button className={`btn ${repoMode === 'init' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1, padding: '6px 10px' }} onClick={() => setRepoMode('init')}>
            <FolderPlus size={14} /> {t('app.initRepo')}
          </button>
          <button className={`btn ${repoMode === 'clone' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1, padding: '6px 10px' }} onClick={() => setRepoMode('clone')}>
            <GitFork size={14} /> {t('app.cloneRepo')}
          </button>
        </div>
        <input
          className="input-text"
          placeholder={t('app.repoTargetPath')}
          value={repoForm.path}
          onChange={(event) => setRepoForm((value) => ({ ...value, path: event.target.value }))}
        />
        {repoMode === 'clone' && (
          <input
            className="input-text"
            placeholder={t('app.repoCloneUrl')}
            value={repoForm.url}
            onChange={(event) => setRepoForm((value) => ({ ...value, url: event.target.value }))}
          />
        )}
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={createRepository}>
          {repoMode === 'clone' ? t('app.cloneRepo') : t('app.initRepo')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button className="btn btn-ghost" disabled={syncing} style={{ flex: 1, padding: '6px' }} title={t('branch.fetch')} onClick={() => doSyncAction('fetch', 'feedback.fetchDone')}>
          <RadioReceiver size={14} color="var(--blue)" />
        </button>
        <button className="btn btn-ghost" disabled={syncing} style={{ flex: 1, padding: '6px' }} title={t('branch.pull')} onClick={() => doSyncAction('pull', 'feedback.pullDone')}>
          <CloudDownload size={14} color="var(--green)" />
        </button>
        <button className="btn btn-ghost" disabled={syncing} style={{ flex: 1, padding: '6px' }} title={t('branch.push')} onClick={() => doSyncAction('push', 'feedback.pushDone')}>
          <CloudUpload size={14} color="var(--accent)" />
        </button>
      </div>
    </div>
  );
}
