import { useState } from 'react';
import {
  CloudDownload,
  CloudUpload,
  RadioReceiver,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RepositoryPicker({ api, onMessage, onRefresh }) {
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);

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

  return (
    <div style={{ marginTop: '4px' }}>
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
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
