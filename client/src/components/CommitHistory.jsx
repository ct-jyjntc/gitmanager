import { useEffect, useState } from 'react';
import { ChevronDown, CopyPlus, GitCommit, RotateCcw, Tag, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PanelHeader from './ui/PanelHeader';
import EmptyState from './ui/EmptyState';
import LoadingState from './ui/LoadingState';

export default function CommitHistory({ api, onMessage, onRefresh, refreshKey }) {
  const { t } = useTranslation();
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCommit, setExpandedCommit] = useState(null);
  const [commitFiles, setCommitFiles] = useState({});
  const [commitDiffs, setCommitDiffs] = useState({});
  const [loadingFiles, setLoadingFiles] = useState({});
  const [loadingDiffs, setLoadingDiffs] = useState({});
  const [activeFileDiff, setActiveFileDiff] = useState({});

  useEffect(() => {
    fetchLog();
  }, [refreshKey]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/log');
      setCommits(data.all || []);
    } catch (error) {
      onMessage(error.response?.data?.error || error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action, commit) => {
    const warnKey = `log.warn_${action}`;
    const confirmMsg = t(warnKey);
    if (confirmMsg !== warnKey && !window.confirm(confirmMsg)) return;

    try {
      if (action === 'reset') await api.post('/reset', { mode: '--hard', commit });
      if (action === 'revert') await api.post('/revert', { commit });
      if (action === 'cherryPick') await api.post('/cherry-pick', { commit });
      if (action === 'tag') {
        const name = window.prompt(t('log.tagPrompt'));
        if (!name) return;
        await api.post('/tag', { name, commit });
      }

      onRefresh();
      fetchLog();
      onMessage(t(`feedback.${action}Done`), 'success');
    } catch (error) {
      onMessage(error.response?.data?.error || error.message, 'error');
    }
  };

  const toggleCommit = async (commit) => {
    const nextExpanded = expandedCommit === commit.hash ? null : commit.hash;
    setExpandedCommit(nextExpanded);

    if (!nextExpanded || commitFiles[commit.hash]) return;

    try {
      setLoadingFiles((current) => ({ ...current, [commit.hash]: true }));
      const { data } = await api.get('/commit-files', { params: { commit: commit.hash } });
      setCommitFiles((current) => ({ ...current, [commit.hash]: data.files || [] }));
    } catch (error) {
      onMessage(error.response?.data?.error || error.message, 'error');
    } finally {
      setLoadingFiles((current) => ({ ...current, [commit.hash]: false }));
    }
  };

  const loadCommitDiff = async (commitHash, filePath = '') => {
    const cacheKey = `${commitHash}:${filePath}`;
    if (commitDiffs[cacheKey]) {
      setActiveFileDiff((current) => ({ ...current, [commitHash]: filePath }));
      return;
    }

    try {
      setLoadingDiffs((current) => ({ ...current, [cacheKey]: true }));
      const { data } = await api.get('/commit-diff', {
        params: {
          commit: commitHash,
          file: filePath || undefined,
        },
      });
      setCommitDiffs((current) => ({ ...current, [cacheKey]: data.diff || '' }));
      setActiveFileDiff((current) => ({ ...current, [commitHash]: filePath }));
    } catch (error) {
      onMessage(error.response?.data?.error || error.message, 'error');
    } finally {
      setLoadingDiffs((current) => ({ ...current, [cacheKey]: false }));
    }
  };

  const checkoutFile = async (commitHash, filePath) => {
    if (!window.confirm(t('log.checkoutFileConfirm', { file: filePath }))) return;

    try {
      await api.post('/checkout-file', { commit: commitHash, file: filePath });
      onRefresh();
      onMessage(t('feedback.fileCheckedOut', { file: filePath }), 'success');
    } catch (error) {
      onMessage(error.response?.data?.error || error.message, 'error');
    }
  };

  return (
    <div className="module-surface commit-surface">
      <PanelHeader
        title={t('log.title')}
        icon={<GitCommit size={18} />}
        meta={loading ? t('common.loading') : t('log.commitCount', { count: commits.length })}
        className="history-panel-header"
      />

      {loading ? (
        <LoadingState label={t('log.loading')} />
      ) : commits.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <div className="commit-table-shell">
          <div className="commit-table-head">
            <span>{t('log.title')}</span>
            <span>{t('log.itemCount', { count: commits.length })}</span>
          </div>

          <div className="commit-list">
            {commits.map((commit) => {
              const files = commitFiles[commit.hash] || [];
              const isExpanded = expandedCommit === commit.hash;
              const activeFile = activeFileDiff[commit.hash] ?? '';
              const diffKey = `${commit.hash}:${activeFile}`;
              const diffText = commitDiffs[diffKey];

              return (
                <article key={commit.hash} className={`commit-row commit-row-detailed ${isExpanded ? 'commit-row-expanded' : ''}`}>
                  <div className="commit-main">
                    <div className="commit-main-top">
                      <div className="commit-message">{commit.message}</div>
                      <div className="action-row">
                        <span className="pill-hash">{commit.hash.substring(0, 7)}</span>
                        <button className="btn btn-ghost history-action toggle" onClick={() => toggleCommit(commit)}>
                          <ChevronDown size={14} className={isExpanded ? 'history-chevron-open' : ''} />
                          {t('log.details')}
                        </button>
                      </div>
                    </div>
                    <div className="commit-meta">
                      <span>{commit.author_name}</span>
                      <span>{new Date(commit.date).toLocaleString()}</span>
                    </div>

                    <div className="commit-actions">
                      <button className="btn btn-ghost history-action danger" onClick={() => executeAction('reset', commit.hash)}>
                        <RotateCcw size={14} />
                        {t('log.reset')}
                      </button>
                      <button className="btn btn-ghost history-action warning" onClick={() => executeAction('revert', commit.hash)}>
                        <Undo2 size={14} />
                        {t('log.revert')}
                      </button>
                      <button className="btn btn-ghost history-action success" onClick={() => executeAction('cherryPick', commit.hash)}>
                        <CopyPlus size={14} />
                        {t('log.cherryPick')}
                      </button>
                      <button className="btn btn-ghost history-action info" onClick={() => executeAction('tag', commit.hash)}>
                        <Tag size={14} />
                        {t('log.tag')}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="commit-expand-area">
                        <section className="commit-files-panel">
                          <div className="subpanel-title">{t('log.changedFiles')}</div>
                          {loadingFiles[commit.hash] ? (
                            <LoadingState compact label={t('common.loading')} />
                          ) : files.length === 0 ? (
                            <EmptyState>{t('common.noData')}</EmptyState>
                          ) : (
                            <div className="commit-file-list">
                              {files.map((file) => (
                                <div key={`${commit.hash}-${file.path}`} className={`commit-file-row ${activeFile === file.path ? 'selected' : ''}`}>
                                  <div className="commit-file-main">
                                    <span className="commit-file-status">{file.status}</span>
                                    <span className="commit-file-path">{file.path}</span>
                                  </div>
                                  <div className="action-row">
                                    <button className="btn btn-ghost history-action" onClick={() => loadCommitDiff(commit.hash, file.path)}>
                                      {t('log.viewDiff')}
                                    </button>
                                    <button className="btn btn-ghost history-action" onClick={() => checkoutFile(commit.hash, file.path)}>
                                      {t('log.checkoutFile')}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>

                        <section className="commit-diff-panel">
                          <div className="subpanel-title">
                            {activeFile ? t('log.fileDiffTitle', { file: activeFile }) : t('log.commitDiff')}
                          </div>
                          {!diffText && !loadingDiffs[diffKey] && (
                            <div className="action-row" style={{ marginBottom: '10px' }}>
                              <button className="btn btn-ghost history-action" onClick={() => loadCommitDiff(commit.hash)}>
                                {t('log.viewCommitDiff')}
                              </button>
                            </div>
                          )}
                          {loadingDiffs[diffKey] ? (
                            <LoadingState compact label={t('common.loading')} />
                          ) : diffText ? (
                            <pre className="console-output commit-diff-output">{diffText}</pre>
                          ) : (
                            <EmptyState>{t('log.noDetailsLoaded')}</EmptyState>
                          )}
                        </section>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
