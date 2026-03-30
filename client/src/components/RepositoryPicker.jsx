import { useState } from 'react';
import {
  CloudDownload,
  CloudUpload,
  GitFork,
  RadioReceiver,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RepositoryPicker({ api, onMessage, onRefresh }) {
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [repoForm, setRepoForm] = useState({ path: '', url: '' });

  const reportError = (error) => {
    onMessage(error.response?.data?.error || error.message, 'error');
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

  const createRepository = async () => {
    try {
      if (!repoForm.path.trim()) return;

      await api.post('/repository', {
        action: 'clone',
        path: repoForm.path.trim(),
        url: repoForm.url.trim(),
      });
      setRepoForm({ path: '', url: '' });
      onRefresh();
      onMessage(t('feedback.cloneDone'), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div style={{ marginTop: '4px' }}>
      <div className="repo-builder">
        <div className="repo-mode-label">
          <GitFork size={14} />
          <span>{t('app.cloneRepo')}</span>
        </div>
        <input
          className="input-text"
          placeholder={t('app.repoTargetPath')}
          value={repoForm.path}
          onChange={(event) => setRepoForm((value) => ({ ...value, path: event.target.value }))}
        />
        <input
          className="input-text"
          placeholder={t('app.repoCloneUrl')}
          value={repoForm.url}
          onChange={(event) => setRepoForm((value) => ({ ...value, url: event.target.value }))}
        />
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={createRepository}>
          {t('app.cloneRepo')}
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
