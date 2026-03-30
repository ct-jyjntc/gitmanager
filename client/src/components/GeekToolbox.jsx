import { useEffect, useState } from 'react';
import {
  ChevronDown,
  Globe2,
  History,
  Navigation,
  ShieldAlert,
  Tags,
  TerminalSquare,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

function Section({ title, icon, count, defaultOpen = false, children }) {
  return (
    <details className="geek-section" open={defaultOpen}>
      <summary className="geek-section-summary">
        <div className="geek-section-title">
          {icon}
          <span>{title}</span>
        </div>
        <div className="geek-section-meta">
          {typeof count === 'number' && <span className="geek-count-chip">{count}</span>}
          <ChevronDown size={15} className="geek-chevron" />
        </div>
      </summary>
      <div className="geek-section-body">{children}</div>
    </details>
  );
}

export default function GeekToolbox({ api, onMessage, onRefresh, branch, remoteCount, refreshKey }) {
  const { t } = useTranslation();
  const [reflog, setReflog] = useState('');
  const [rebaseTarget, setRebaseTarget] = useState('');
  const [blameFile, setBlameFile] = useState('');
  const [blameText, setBlameText] = useState('');
  const [tags, setTags] = useState([]);
  const [remotes, setRemotes] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newTagCommit, setNewTagCommit] = useState('HEAD');
  const [remoteForm, setRemoteForm] = useState({ name: '', url: '' });
  const [resetForm, setResetForm] = useState({ mode: '--mixed', commit: 'HEAD' });
  const [commandInput, setCommandInput] = useState('');
  const [commandOutput, setCommandOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const reportError = (error) => {
    onMessage(error.response?.data?.error || error.message, 'error');
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [{ data: tagData }, { data: remoteData }] = await Promise.all([
        api.get('/tags'),
        api.get('/remotes'),
      ]);
      setTags(tagData.all || []);
      setRemotes(remoteData.all || []);
    } catch (error) {
      reportError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [refreshKey]);

  const loadReflog = async () => {
    try {
      const { data } = await api.get('/reflog');
      setReflog(data.reflog);
    } catch (error) {
      reportError(error);
    }
  };

  const loadBlame = async () => {
    if (!blameFile.trim()) return;
    try {
      const { data } = await api.post('/blame', { file: blameFile });
      setBlameText(data.blame);
    } catch (error) {
      reportError(error);
    }
  };

  const doRebase = async () => {
    if (!rebaseTarget.trim()) return;
    if (!window.confirm(t('geek.rebaseWarn'))) return;
    try {
      await api.post('/rebase', { branch: rebaseTarget.trim() });
      onRefresh();
      onMessage(t('feedback.rebaseDone'), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const doReset = async () => {
    if (!window.confirm(t('geek.resetWarn', { mode: resetForm.mode, commit: resetForm.commit || 'HEAD' }))) return;
    try {
      await api.post('/reset', {
        mode: resetForm.mode,
        commit: resetForm.commit.trim() || 'HEAD',
      });
      onRefresh();
      onMessage(t('feedback.resetDone'), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const createTag = async () => {
    if (!newTag.trim()) return;
    try {
      await api.post('/tag', {
        action: 'create',
        name: newTag.trim(),
        commit: newTagCommit.trim() || 'HEAD',
      });
      setNewTag('');
      setNewTagCommit('HEAD');
      await loadDashboardData();
      onRefresh();
      onMessage(t('feedback.tagDone'), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const deleteTag = async (name) => {
    if (!window.confirm(t('geek.deleteTagConfirm', { tag: name }))) return;
    try {
      await api.post('/tag', { action: 'delete', name });
      await loadDashboardData();
      onRefresh();
      onMessage(t('feedback.tagDeleted', { tag: name }), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const saveRemote = async () => {
    if (!remoteForm.name.trim() || !remoteForm.url.trim()) return;
    try {
      await api.post('/remote', {
        action: 'add',
        name: remoteForm.name.trim(),
        url: remoteForm.url.trim(),
      });
      setRemoteForm({ name: '', url: '' });
      await loadDashboardData();
      onRefresh();
      onMessage(t('feedback.remoteAdded'), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const updateRemoteUrl = async (name, url) => {
    const nextUrl = window.prompt(t('geek.remoteUrlPrompt', { name }), url || '');
    if (!nextUrl?.trim()) return;
    try {
      await api.post('/remote', {
        action: 'set-url',
        name,
        url: nextUrl.trim(),
      });
      await loadDashboardData();
      onRefresh();
      onMessage(t('feedback.remoteUpdated', { name }), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const removeRemote = async (name) => {
    if (!window.confirm(t('geek.deleteRemoteConfirm', { name }))) return;
    try {
      await api.post('/remote', { action: 'remove', name });
      await loadDashboardData();
      onRefresh();
      onMessage(t('feedback.remoteRemoved', { name }), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  const runCommand = async () => {
    const args = commandInput.split(/\s+/).map((item) => item.trim()).filter(Boolean);
    if (args.length === 0) return;
    try {
      const { data } = await api.post('/run', { args });
      setCommandOutput(data.output || '(no output)');
      onRefresh();
      onMessage(t('feedback.commandDone'), 'success');
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div className="glass-panel geek-shell page-scroll-shell">
      <div className="geek-hero compact-hero">
        <div className="geek-hero-copy">
          <h2 className="section-title geek-title">
            <TerminalSquare size={18} /> {t('geek.title')}
          </h2>
          <p className="panel-hint geek-intro">{t('geek.fullCoverage')}</p>
        </div>
        <div className="geek-stats compact-stats">
          <div className="geek-stat-card">
            <span className="summary-label">{t('summary.branch')}</span>
            <strong>{branch || 'HEAD'}</strong>
          </div>
          <div className="geek-stat-card">
            <span className="summary-label">Remotes</span>
            <strong>{remoteCount}</strong>
          </div>
          <div className="geek-stat-card">
            <span className="summary-label">State</span>
            <strong>{loading ? t('common.loading') : 'Ready'}</strong>
          </div>
        </div>
      </div>

      <div className="geek-stack">
        <Section title={t('geek.historyOps')} icon={<ShieldAlert size={16} />} defaultOpen>
          <div className="geek-history-grid">
            <div className="control-row geek-control-row compact-controls">
              <select className="input-text" value={resetForm.mode} onChange={(event) => setResetForm((value) => ({ ...value, mode: event.target.value }))}>
                <option value="--soft">git reset --soft</option>
                <option value="--mixed">git reset --mixed</option>
                <option value="--hard">git reset --hard</option>
              </select>
              <input className="input-text" value={resetForm.commit} onChange={(event) => setResetForm((value) => ({ ...value, commit: event.target.value }))} placeholder={t('geek.resetPlaceholder')} />
              <button className="btn geek-action-btn geek-danger-btn" onClick={doReset}>{t('geek.resetAction')}</button>
            </div>
            <div className="control-row geek-control-row compact-controls">
              <input className="input-text" placeholder={t('geek.rebasePlaceholder')} value={rebaseTarget} onChange={(event) => setRebaseTarget(event.target.value)} />
              <button className="btn geek-action-btn geek-danger-btn" onClick={doRebase}>{t('geek.rebaseAction')}</button>
            </div>
          </div>
        </Section>

        <div className="geek-two-col">
          <Section title={t('geek.reflogTitle')} icon={<History size={16} />} defaultOpen>
            <div className="geek-inline-header">
              <p className="panel-hint">{t('geek.reflogDesc')}</p>
              <button className="btn geek-ghost-accent" onClick={loadReflog}>{t('geek.loadReflog')}</button>
            </div>
            {reflog ? <pre className="console-output geek-output compact-output">{reflog}</pre> : <div className="empty-console">No reflog loaded</div>}
          </Section>

          <Section title={t('geek.blameTitle')} icon={<Navigation size={16} />} defaultOpen>
            <div className="control-row geek-control-row compact-controls">
              <input className="input-text" placeholder={t('geek.blamePlaceholder')} value={blameFile} onChange={(event) => setBlameFile(event.target.value)} />
              <button className="btn geek-action-btn geek-cool-btn" onClick={loadBlame}>{t('geek.blameAction')}</button>
            </div>
            {blameText ? <pre className="console-output geek-output compact-output">{blameText}</pre> : <div className="empty-console">No blame output</div>}
          </Section>
        </div>

        <div className="geek-two-col">
          <Section title={t('geek.tagsTitle')} icon={<Tags size={16} />} count={tags.length} defaultOpen>
            <div className="control-row geek-control-row compact-controls">
              <input className="input-text" placeholder={t('geek.tagNamePlaceholder')} value={newTag} onChange={(event) => setNewTag(event.target.value)} />
              <input className="input-text" placeholder={t('geek.tagCommitPlaceholder')} value={newTagCommit} onChange={(event) => setNewTagCommit(event.target.value)} />
              <button className="btn geek-action-btn" onClick={createTag}>{t('geek.tagCreate')}</button>
            </div>
            <div className="tag-grid geek-chip-grid tag-scroll-zone">
              {tags.length === 0 && <span className="panel-hint">{t('geek.noTags')}</span>}
              {tags.map((tag) => (
                <div key={tag} className="inline-card geek-chip-card">
                  <span className="badge badge-added">{tag}</span>
                  <button className="btn btn-ghost geek-mini-btn" onClick={() => deleteTag(tag)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t('geek.remotesTitle')} icon={<Globe2 size={16} />} count={remotes.length} defaultOpen>
            <div className="control-row geek-control-row compact-controls">
              <input className="input-text" placeholder={t('geek.remoteNamePlaceholder')} value={remoteForm.name} onChange={(event) => setRemoteForm((value) => ({ ...value, name: event.target.value }))} />
              <input className="input-text" placeholder={t('geek.remoteUrlPlaceholder')} value={remoteForm.url} onChange={(event) => setRemoteForm((value) => ({ ...value, url: event.target.value }))} />
              <button className="btn geek-action-btn" onClick={saveRemote}>{t('geek.remoteAdd')}</button>
            </div>
            <div className="remote-list geek-remote-list remote-scroll-zone">
              {remotes.length === 0 && <span className="panel-hint">{t('geek.noRemotes')}</span>}
              {remotes.map((remote) => (
                <div key={remote.name} className="geek-remote-card">
                  <div className="geek-remote-head">
                    <strong>{remote.name}</strong>
                    <div className="geek-inline-actions">
                      <button className="btn btn-ghost geek-mini-text-btn" onClick={() => updateRemoteUrl(remote.name, remote.refs?.fetch)}>
                        {t('geek.remoteEdit')}
                      </button>
                      <button className="btn btn-ghost geek-mini-text-btn geek-danger-text" onClick={() => removeRemote(remote.name)}>
                        {t('geek.remoteRemove')}
                      </button>
                    </div>
                  </div>
                  <span className="remote-url">{remote.refs?.fetch || '-'}</span>
                  {remote.refs?.push && remote.refs.push !== remote.refs.fetch && (
                    <span className="remote-url">push: {remote.refs.push}</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title={t('geek.commandTitle')} icon={<TerminalSquare size={16} />} defaultOpen>
          <div className="control-row geek-control-row compact-controls">
            <input className="input-text geek-command-input" placeholder={t('geek.commandPlaceholder')} value={commandInput} onChange={(event) => setCommandInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runCommand()} />
            <button className="btn geek-action-btn" onClick={runCommand}>{t('geek.commandRun')}</button>
          </div>
          {commandOutput ? <pre className="console-output geek-output geek-command-output">{commandOutput}</pre> : <div className="empty-console">No command output</div>}
        </Section>
      </div>
    </div>
  );
}
