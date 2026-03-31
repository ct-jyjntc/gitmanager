import { useEffect, useMemo, useState } from 'react';
import { FileDiff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PanelHeader from './ui/PanelHeader';
import EmptyState from './ui/EmptyState';
import LoadingState from './ui/LoadingState';

// Maximum number of diff lines rendered at once. Very large diffs are windowed
// to keep the DOM small and the editor responsive.
const MAX_RENDERED_LINES = 4000;

function classifyLine(line) {
  if (line.startsWith('+')) {
    return {
      bg: 'color-mix(in srgb, var(--green) 14%, transparent)',
      color: 'var(--green)',
    };
  }
  if (line.startsWith('-')) {
    return {
      bg: 'color-mix(in srgb, var(--red) 14%, transparent)',
      color: 'var(--red)',
    };
  }
  if (line.startsWith('@@')) {
    return { bg: 'transparent', color: 'var(--accent)' };
  }
  return { bg: 'transparent', color: 'var(--text-muted)' };
}

export default function DiffViewer({ api, file, refreshKey }) {
  const { t } = useTranslation();
  const [diffText, setDiffText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setDiffText('');
      return;
    }

    let active = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.post('/diff', { file: file.name, staged: file.isStaged });
        if (active) setDiffText(data.diff || t('diff.noDiff'));
      } catch {
        if (active) setDiffText(t('diff.noDiff'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // `file` is a new object reference on each selection; `file.name`/`isStaged`
    // are the meaningful deps. `refreshKey` forces a refetch after mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.name, file?.isStaged, refreshKey]);

  const lines = useMemo(() => (diffText ? diffText.split('\n') : []), [diffText]);
  const truncated = lines.length > MAX_RENDERED_LINES;
  const visibleLines = truncated ? lines.slice(0, MAX_RENDERED_LINES) : lines;

  return (
    <div className="module-surface workspace-diff-shell" style={{ padding: 0, gap: 0 }}>
      <div className="workspace-diff-header">
        <PanelHeader
          title={file ? file.name : t('diff.title')}
          icon={<FileDiff size={18} color="var(--blue)" />}
          meta={file ? (file.isStaged ? t('diff.stagedPatch') : t('diff.workingTreePatch')) : undefined}
        />
      </div>

      <div className="workspace-diff-body">
        {!file ? (
          <EmptyState className="diff-empty workspace-diff-empty">
            <FileDiff size={42} opacity={0.2} style={{ marginBottom: '14px' }} />
            {t('diff.noFile')}
          </EmptyState>
        ) : loading ? (
          <LoadingState label={t('diff.loading')} className="workspace-diff-loading" />
        ) : (
          <div className="workspace-diff-codeblock">
            {visibleLines.map((line, idx) => {
              const { bg, color } = classifyLine(line);
              return (
                <div key={idx} className="workspace-diff-line" style={{ background: bg, color }}>
                  <span className="workspace-diff-gutter">{idx + 1}</span>
                  <span className="workspace-diff-code">{line}</span>
                </div>
              );
            })}
            {truncated && (
              <div className="workspace-diff-line" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                <span className="workspace-diff-gutter">…</span>
                <span className="workspace-diff-code">
                  {t('diff.truncated', { shown: MAX_RENDERED_LINES, total: lines.length, defaultValue: `Showing first ${MAX_RENDERED_LINES} of ${lines.length} lines` })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
