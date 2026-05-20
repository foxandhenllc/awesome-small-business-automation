import { useEffect, useMemo, useState } from 'react';
import {
  categories,
  costs,
  personas,
  resources,
  setups,
  type AutomationResource,
  type CostLevel,
  type Persona,
  type ResourceCategory,
  type SetupLevel,
} from './data/resources';
import {
  buildStackPlan,
  createShortlistMarkdown,
  filterResources,
  parseSavedShortlist,
  type ResourceFilters,
} from './lib/stack';
import './styles.css';

const shortlistStorageKey = 'foxhen-automation-shortlist-v1';

function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ResourceCategory | 'All'>('All');
  const [cost, setCost] = useState<CostLevel | 'All'>('All');
  const [setup, setSetup] = useState<SetupLevel | 'All'>('All');
  const [persona, setPersona] = useState<Persona | 'All'>('All');
  const [shortlistIds, setShortlistIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    return parseSavedShortlist(
      window.localStorage.getItem(shortlistStorageKey),
      new Set(resources.map((resource) => resource.id))
    );
  });
  const [copyStatus, setCopyStatus] = useState('Ready to copy');

  useEffect(() => {
    window.localStorage.setItem(shortlistStorageKey, JSON.stringify(shortlistIds));
  }, [shortlistIds]);

  const filters: ResourceFilters = { query, category, cost, setup, persona };
  const visibleResources = useMemo(() => filterResources(resources, filters), [filters]);
  const shortlist = useMemo(
    () =>
      shortlistIds
        .map((id) => resources.find((resource) => resource.id === id))
        .filter((resource): resource is AutomationResource => Boolean(resource)),
    [shortlistIds]
  );
  const stackPlan = useMemo(() => buildStackPlan(shortlist), [shortlist]);
  const markdown = useMemo(() => createShortlistMarkdown(shortlist), [shortlist]);

  const toggleResource = (resourceId: string) => {
    setShortlistIds((current) =>
      current.includes(resourceId)
        ? current.filter((id) => id !== resourceId)
        : [...current, resourceId]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('All');
    setCost('All');
    setSetup('All');
    setPersona('All');
  };

  const copyShortlist = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyStatus('Copied Markdown shortlist');
    } catch {
      setCopyStatus('Copy failed; use export instead');
    }
  };

  const exportJson = () => {
    const payload = JSON.stringify({ generatedAt: new Date().toISOString(), shortlist }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'small-business-automation-shortlist.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <section className="hero">
        <div className="hero__copy">
          <h1>Build a lean automation stack from public-safe tools.</h1>
          <p>
            Search the Fox & Hen resource shelf, filter by workflow fit, and save a browser-local
            shortlist you can copy into a client brief or export for handoff.
          </p>
        </div>
        <div className="hero__stats" aria-label="Directory stats">
          <span>
            <strong>{resources.length}</strong> curated resources
          </span>
          <span>
            <strong>{categories.length}</strong> workflow categories
          </span>
          <span>
            <strong>{shortlist.length}</strong> saved locally
          </span>
        </div>
      </section>

      <section className="workspace" aria-label="Automation stack builder">
        <div className="directory-panel">
          <div className="toolbar">
            <label className="search-field">
              <span>Search resources</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try intake, dashboard, booking, QA..."
              />
            </label>
            <button className="ghost-button" type="button" onClick={clearFilters}>
              Reset filters
            </button>
          </div>

          <div className="filters" aria-label="Resource filters">
            <SelectFilter label="Category" value={category} values={categories} onChange={setCategory} />
            <SelectFilter label="Cost" value={cost} values={costs} onChange={setCost} />
            <SelectFilter label="Setup" value={setup} values={setups} onChange={setSetup} />
            <SelectFilter label="Best for" value={persona} values={personas} onChange={setPersona} />
          </div>

          <div className="result-summary">
            Showing {visibleResources.length} of {resources.length} resources
          </div>

          <div className="resource-grid">
            {visibleResources.map((resource) => {
              const isSelected = shortlistIds.includes(resource.id);

              return (
                <article className="resource-card" key={resource.id}>
                  <div className="resource-card__topline">
                    <span>{resource.category}</span>
                    <span>{resource.cost}</span>
                  </div>
                  <h2>
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      {resource.name}
                    </a>
                  </h2>
                  <p>{resource.summary}</p>
                  <dl>
                    <div>
                      <dt>Setup</dt>
                      <dd>{resource.setup}</dd>
                    </div>
                    <div>
                      <dt>Stack role</dt>
                      <dd>{resource.bestStackRole}</dd>
                    </div>
                  </dl>
                  <div className="tag-row">
                    {resource.tags.slice(0, 4).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <button
                    className={isSelected ? 'primary-button primary-button--selected' : 'primary-button'}
                    type="button"
                    onClick={() => toggleResource(resource.id)}
                  >
                    {isSelected ? 'Remove from stack' : 'Add to stack'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="shortlist-panel" aria-label="Saved shortlist">
          <div className="shortlist-panel__header">
            <div>
              <p>Saved shortlist</p>
              <h2>{shortlist.length} resources</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => setShortlistIds([])}>
              Clear
            </button>
          </div>

          <div className="coverage">
            <h3>Stack coverage</h3>
            <div className="coverage__chips">
              {stackPlan.coveredCategories.length === 0 ? (
                <span>No categories selected</span>
              ) : (
                stackPlan.coveredCategories.map((coveredCategory) => (
                  <span key={coveredCategory}>{coveredCategory}</span>
                ))
              )}
            </div>
          </div>

          <div className="shortlist-items">
            {shortlist.length === 0 ? (
              <p className="empty-state">
                Add tools from the directory to save them in localStorage and prepare an export.
              </p>
            ) : (
              shortlist.map((resource) => (
                <div className="shortlist-item" key={resource.id}>
                  <strong>{resource.name}</strong>
                  <span>{resource.category}</span>
                  <button type="button" onClick={() => toggleResource(resource.id)}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="next-steps">
            <h3>Next steps</h3>
            <ol>
              {stackPlan.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="export-actions">
            <button className="primary-button" type="button" onClick={copyShortlist}>
              Copy Markdown
            </button>
            <button className="ghost-button" type="button" onClick={exportJson}>
              Export JSON
            </button>
          </div>
          <p className="copy-status" role="status">
            {copyStatus}
          </p>
        </aside>
      </section>
    </main>
  );
}

interface SelectFilterProps<T extends string> {
  label: string;
  value: T | 'All';
  values: T[];
  onChange: (value: T | 'All') => void;
}

function SelectFilter<T extends string>({ label, value, values, onChange }: SelectFilterProps<T>) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T | 'All')}>
        <option value="All">All</option>
        {values.map((filterValue) => (
          <option value={filterValue} key={filterValue}>
            {filterValue}
          </option>
        ))}
      </select>
    </label>
  );
}

export default App;
