import { useEffect, useState } from 'react';
import { CopyPlus, GitCommit, RotateCcw, Tag, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PanelHeader from './ui/PanelHeader';
import EmptyState from './ui/EmptyState';
import LoadingState from './ui/LoadingState';

export default function CommitHistory({ api, onMessage, onRefresh, refreshKey }) {
  const { t } = useTranslation();
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);

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
            {commits.map((commit) => (
              <article key={commit.hash} className="commit-row">
                <div className="commit-main">
                  <div className="commit-main-top">
                    <div className="commit-message">{commit.message}</div>
                    <span className="pill-hash">{commit.hash.substring(0, 7)}</span>
                  </div>
                  <div className="commit-meta">
                    <span>{commit.author_name}</span>
                    <span>{new Date(commit.date).toLocaleString()}</span>
                  </div>
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
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
