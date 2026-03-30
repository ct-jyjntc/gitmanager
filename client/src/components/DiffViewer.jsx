import { useEffect, useState } from 'react';
import { FileDiff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PanelHeader from './ui/PanelHeader';
import EmptyState from './ui/EmptyState';

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
      let color = '#ccc';
      if (line.startsWith('+')) {
        bg = 'rgba(76, 175, 80, 0.12)';
        color = '#81c784';
      } else if (line.startsWith('-')) {
        bg = 'rgba(244, 67, 54, 0.12)';
        color = '#e57373';
      } else if (line.startsWith('@@')) {
        color = 'var(--accent)';
      }

      return (
        <div key={idx} style={{ background: bg, color, padding: '2px 8px', whiteSpace: 'pre-wrap', minHeight: '20px', display: 'flex' }}>
          <span style={{ width: '40px', display: 'inline-block', opacity: 0.45, userSelect: 'none', borderRight: '1px solid var(--border-color)', marginRight: '14px', textAlign: 'right', paddingRight: '8px' }}>
            {idx + 1}
          </span>
          <span style={{ fontFamily: 'Consolas, monospace' }}>{line}</span>
        </div>
      );
    });
  };

  return (
    <div className="module-surface" style={{ padding: 0, gap: 0 }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)' }}>
        <PanelHeader
          title={file ? `Diff: ${file.name}` : t('diff.title')}
          icon={<FileDiff size={18} color="var(--blue)" />}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.36)', fontFamily: 'monospace', fontSize: '12px', paddingTop: '8px' }}>
        {!file ? (
          <EmptyState className="diff-empty">
            <FileDiff size={42} opacity={0.2} style={{ marginBottom: '14px' }} />
            {t('diff.noFile')}
          </EmptyState>
        ) : loading ? (
          <div style={{ padding: '16px', color: 'gray' }}>{t('diff.loading')}</div>
        ) : (
          renderDiffLines()
        )}
      </div>
    </div>
  );
}
