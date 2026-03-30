import { useEffect, useState } from 'react';
import { ArrowDownCircle, PackageOpen, Save, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PanelHeader from './ui/PanelHeader';
import EmptyState from './ui/EmptyState';
import FormRow from './ui/FormRow';
import LoadingState from './ui/LoadingState';

export default function StashPanel({ api, onMessage, onRefresh, refreshKey }) {
  const { t } = useTranslation();
  const [stashes, setStashes] = useState(null);
  const [stashMsg, setStashMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const reportError = (error) => {
    onMessage(error.response?.data?.error || error.message, 'error');
  };

  const fetchStash = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/stash');
      setStashes(data.all || []);
    } catch (error) {
      reportError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStash();
  }, [refreshKey]);

  const save = async () => {
    try {
      await api.post('/stash', { action: 'save', message: stashMsg });
      setStashMsg('');
      await fetchStash();
      onRefresh();
      onMessage(t('feedback.stashSaved'), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const pop = async (index) => {
    try {
      await api.post('/stash', { action: 'pop', index });
      await fetchStash();
      onRefresh();
      onMessage(t('feedback.stashPopped'), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const drop = async (index) => {
    if (!window.confirm(t('stash.dropConfirm', { index }))) return;
    try {
      await api.post('/stash', { action: 'drop', index });
      await fetchStash();
      onRefresh();
      onMessage(t('feedback.stashDropped'), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  if (!stashes) {
    return (
      <div className="glass-panel module-surface">
        {loading ? <LoadingState label={t('common.loading')} /> : t('common.noData')}
      </div>
    );
  }

  return (
    <div className="glass-panel module-surface">
      <PanelHeader title={t('stash.title')} icon={<PackageOpen size={18} />} meta={t('stash.entryCount', { count: stashes.length })} />

      <FormRow>
        <input
          className="input-text"
          placeholder={t('stash.save')}
          value={stashMsg}
          onChange={(event) => setStashMsg(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && save()}
        />
        <button className="btn btn-primary" onClick={save}><Save size={16} /> {t('stash.btnSave')}</button>
      </FormRow>

      <div className="scroll-stack">
        {stashes.map((stash, index) => (
          <div key={stash.hash || index} className="subpanel">
            <div className="panel-toolbar" style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent)' }}>{t('stash.entryLabel', { index })}</span>
              <span className="muted-copy">{stash.date}</span>
            </div>
            <div style={{ fontSize: '12px', marginBottom: '10px' }}>{stash.message}</div>
            <div className="action-row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" style={{ padding: '4px 10px' }} onClick={() => pop(index)}>
                <ArrowDownCircle size={14} /> {t('stash.apply')}
              </button>
              <button className="btn btn-ghost" style={{ color: 'var(--red)', padding: '4px 10px' }} onClick={() => drop(index)}>
                <Trash2 size={14} /> {t('stash.drop')}
              </button>
            </div>
          </div>
        ))}
        {stashes.length === 0 && <EmptyState>{t('stash.empty')}</EmptyState>}
      </div>
    </div>
  );
}
