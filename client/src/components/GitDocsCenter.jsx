import { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PanelHeader from './ui/PanelHeader';
import EmptyState from './ui/EmptyState';
import { getGitCommandDocs } from '../data/gitCommandIndex';

export default function GitDocsCenter() {
  const { t, i18n } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const docs = useMemo(() => getGitCommandDocs(i18n.language === 'zh' ? 'zh' : 'en'), [i18n.language]);

  const filteredDocs = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return docs;

    return docs
      .map((section) => ({
        ...section,
        commands: section.commands.filter((command) =>
          command.name.toLowerCase().includes(normalized) ||
          command.description.toLowerCase().includes(normalized),
        ),
      }))
      .filter((section) => section.commands.length > 0);
  }, [docs, keyword]);

  const totalCommands = useMemo(
    () => docs.reduce((sum, section) => sum + section.commands.length, 0),
    [docs],
  );

  return (
    <div className="module-surface docs-shell">
      <PanelHeader
        title={t('docs.title')}
        icon={<BookOpen size={18} />}
        meta={t('docs.commandCount', { count: totalCommands })}
      />

      <div className="docs-hero">
        <p className="panel-hint">{t('docs.description')}</p>
        <div className="docs-search-row">
          <Search size={16} className="docs-search-icon" />
          <input
            className="input-text docs-search-input"
            placeholder={t('docs.searchPlaceholder')}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
      </div>

      <div className="docs-sections">
        {filteredDocs.length === 0 ? (
          <EmptyState>{t('docs.noMatch')}</EmptyState>
        ) : (
          filteredDocs.map((section) => (
            <details key={section.key} className="docs-section" open>
              <summary className="docs-section-summary">
                <span>{section.title}</span>
                <span className="docs-section-count">{section.commands.length}</span>
              </summary>

              <div className="docs-command-grid">
                {section.commands.map((command) => (
                  <article key={command.name} className="docs-command-card">
                    <div className="docs-command-head">
                      <code className="docs-command-name">git {command.name}</code>
                    </div>
                    <p className="docs-command-description">{command.description}</p>
                    <div className="docs-command-subtitle">{t('docs.examples')}</div>
                    <div className="docs-command-examples">
                      {command.examples.map((example) => (
                        <code key={example} className="docs-example-code">{example}</code>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
