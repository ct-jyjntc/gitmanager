import { useEffect, useState } from 'react';
import { CopyPlus, GitCommit, RotateCcw, Tag, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PanelHeader from './ui/PanelHeader';
import EmptyState from './ui/EmptyState';

export default function CommitHistory({ api, onMessage, onRefresh, refreshKey }) {
  const { t } = useTranslation();
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredHash, setHoveredHash] = useState(null);

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
    <div className="module-surface" style={{ padding: 0 }}>
      <PanelHeader
        title={t('log.title')}
        icon={<GitCommit size={18} />}
        meta={loading ? t('common.loading') : `${commits.length} commits`}
        className="history-panel-header"
      />

      {loading ? (
        <p className="muted-copy">{t('log.loading')}</p>
      ) : commits.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <div className="history-timeline">
          {commits.map((commit, index) => (
            <div
              key={commit.hash}
              className={`history-item ${hoveredHash === commit.hash ? 'history-item-active' : ''}`}
              onMouseEnter={() => setHoveredHash(commit.hash)}
              onMouseLeave={() => setHoveredHash(null)}
            >
              <div className="history-rail">
                <div className="history-node">
                  {commit.author_name ? commit.author_name.charAt(0).toUpperCase() : '?'}
                </div>
                {index !== commits.length - 1 && <div className="history-line" />}
              </div>

              <article className="history-card">
                <div className="history-top">
                  <div className="history-meta">
                    <span className="history-author">{commit.author_name}</span>
                    <span className="history-date">{new Date(commit.date).toLocaleString()}</span>
                  </div>
                  <span className="pill-hash">{commit.hash.substring(0, 7)}</span>
                </div>

                <div className="history-message">{commit.message}</div>

                <div className="history-actions">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
