import { useEffect, useState } from 'react';
import { FileDiff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PanelHeader from './ui/PanelHeader';
import EmptyState from './ui/EmptyState';
import LoadingState from './ui/LoadingState';

export default function DiffViewer({ api, file, refreshKey }) {
  const { t } = useTranslation();
  const [diffText, setDiffText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setDiffText('');
      return;
    }
    fetchDiff();
  }, [file, refreshKey]);

  const fetchDiff = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/diff', { file: file.name, staged: file.isStaged });
      setDiffText(data.diff || t('diff.noDiff'));
    } catch {
      setDiffText(t('diff.noDiff'));
    } finally {
      setLoading(false);
    }
  };

  const renderDiffLines = () => {
    const lines = diffText.split('\n');
    return lines.map((line, idx) => {
      let bg = 'transparent';
      let color = 'var(--text-muted)';
      if (line.startsWith('+')) {
        bg = 'color-mix(in srgb, var(--green) 14%, transparent)';
        color = 'var(--green)';
      } else if (line.startsWith('-')) {
        bg = 'color-mix(in srgb, var(--red) 14%, transparent)';
        color = 'var(--red)';
      } else if (line.startsWith('@@')) {
        color = 'var(--accent)';
      }

      return (
        <div key={idx} className="workspace-diff-line" style={{ background: bg, color }}>
          <span className="workspace-diff-gutter">{idx + 1}</span>
          <span className="workspace-diff-code">{line}</span>
        </div>
      );
    });
  };

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
          <div className="workspace-diff-codeblock">{renderDiffLines()}</div>
        )}
      </div>
    </div>
  );
}
