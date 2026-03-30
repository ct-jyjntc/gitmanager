import { useEffect, useState } from 'react';
import { GitMerge, Network, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PanelHeader from './ui/PanelHeader';
import EmptyState from './ui/EmptyState';
import FormRow from './ui/FormRow';

export default function BranchManager({ api, currentBranch, onMessage, onRefresh, refreshKey }) {
  const { t } = useTranslation();
  const [branches, setBranches] = useState({ all: [], current: '' });
  const [loading, setLoading] = useState(false);
  const [newBranch, setNewBranch] = useState('');

  const reportError = (error) => {
    onMessage(error.response?.data?.error || error.message, 'error');
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/branches');
      setBranches(data);
    } catch (error) {
      reportError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [currentBranch, refreshKey]);

  const checkout = async (name) => {
    try {
      await api.post('/checkout', { target: name });
      await fetchBranches();
      onRefresh();
      onMessage(t('feedback.checkoutDone', { branch: name }), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const create = async () => {
    if (!newBranch.trim()) return;
    try {
      await api.post('/branch', { action: 'create', name: newBranch });
      setNewBranch('');
      await fetchBranches();
      onRefresh();
      onMessage(t('feedback.branchCreated', { branch: newBranch }), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const removeBranch = async (name) => {
    if (!window.confirm(t('branch.deleteConfirm', { branch: name }))) return;
    try {
      await api.post('/branch', { action: 'delete', name });
      await fetchBranches();
      onRefresh();
      onMessage(t('feedback.branchDeleted', { branch: name }), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const merge = async (name) => {
    if (!window.confirm(t('branch.mergeConfirm', { branch: name }))) return;
    try {
      await api.post('/branch', { action: 'merge', name });
      await fetchBranches();
      onRefresh();
      onMessage(t('feedback.mergeDone', { branch: name }), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const localBranches = branches.all.filter((branch) => !branch.startsWith('remotes/'));
  const remoteBranches = branches.all.filter((branch) => branch.startsWith('remotes/'));

  return (
    <div className="glass-panel module-surface">
      <PanelHeader
        title={t('branch.title')}
        icon={<Network size={18} />}
        meta={loading ? t('common.loading') : t('branch.countSummary', { local: localBranches.length, remote: remoteBranches.length })}
      />

      <FormRow>
        <input
          className="input-text"
          placeholder={t('branch.createPlaceholder')}
          value={newBranch}
          onChange={(event) => setNewBranch(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && create()}
        />
        <button className="btn btn-primary" onClick={create}><Plus size={16} /> {t('branch.create')}</button>
      </FormRow>

      <div className="panel-grid-two" style={{ flex: 1 }}>
        <section className="subpanel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="subpanel-title">{t('branch.local')}</div>
          <div className="scroll-stack">
            {localBranches.map((branch) => (
              <div key={branch} className={`list-item ${branches.current === branch ? 'selected' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: branches.current === branch ? 'var(--green)' : 'gray' }} />
                  <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{branch}</span>
                  {branches.current === branch && <span className="badge badge-added">HEAD</span>}
                </div>
                {branches.current !== branch && (
                  <div className="action-row">
                    <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => checkout(branch)}>
                      {t('branch.checkout')}
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '4px' }} onClick={() => merge(branch)}>
                      <GitMerge size={14} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '4px', color: 'var(--red)' }} onClick={() => removeBranch(branch)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {localBranches.length === 0 && <EmptyState>{t('common.noData')}</EmptyState>}
          </div>
        </section>

        <section className="subpanel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="subpanel-title">{t('branch.remote')}</div>
          <div className="scroll-stack">
            {remoteBranches.length === 0 && <EmptyState>{t('branch.noRemote')}</EmptyState>}
            {remoteBranches.map((branch) => (
              <div key={branch} className="list-item">
                <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{branch}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
