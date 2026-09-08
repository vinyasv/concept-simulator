import React, { useMemo, useRef, useState } from 'react';
import { ArrowRight, FileUp, Search, X } from 'lucide-react';
import { LIBRARY_DATA } from '../constants';
import { FileData, LibraryItem } from '../types';

interface FreshLibraryProps {
  activeFile: FileData | null;
  isProcessing: boolean;
  mode: 'rail' | 'palette';
  onClose?: () => void;
  onCreateNew?: () => void;
  onFileSelect: (file: FileData) => void;
  onItemSelect: (item: LibraryItem) => void;
}

const makeCatalog = (library: typeof LIBRARY_DATA) => library.flatMap(category =>
  category.subcategories.flatMap(subcategory =>
    subcategory.items.map(item => ({
      item,
      category: category.label,
      subcategory: subcategory.label,
    })),
  ),
);

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];

const FreshLibrary: React.FC<FreshLibraryProps> = ({
  activeFile,
  isProcessing,
  mode,
  onClose,
  onCreateNew,
  onFileSelect,
  onItemSelect,
}) => {
  const [query, setQuery] = useState('');
  const catalog = useMemo(() => makeCatalog(LIBRARY_DATA), []);
  const [activeCategory, setActiveCategory] = useState('All');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => ['All', ...new Set(catalog.map(row => row.category))], [catalog]);
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return catalog.filter(({ item, category, subcategory }) => {
      const matchesCategory = activeCategory === 'All' || category === activeCategory;
      const haystack = `${item.label} ${item.description ?? ''} ${item.keywords ?? ''} ${category} ${subcategory}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [activeCategory, query, catalog]);

  const selectItem = (item: LibraryItem) => {
    onItemSelect(item);
    if (mode === 'palette') onClose?.();
  };

  const handleUpload = (file?: File) => {
    if (!file) return;
    setUploadError('');
    if (!acceptedTypes.includes(file.type)) {
      setUploadError('Choose a PDF, JPG, PNG, WebP, or TXT file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = String(event.target?.result ?? '');
      onFileSelect({ name: file.name, type: file.type, data: dataUrl.split(',')[1] ?? '' });
      if (mode === 'palette') onClose?.();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`fresh-library fresh-library--${mode}`}>
      <div className="fresh-library__topline">
        <div>
          <p className="eyebrow">Concept library</p>
          <h2>{mode === 'palette' ? 'Choose a simulation' : 'Simulations'}</h2>
        </div>
        <div className="fresh-library__actions">
          {onCreateNew && (
            <button className="text-button" onClick={onCreateNew} type="button">
              New simulation
            </button>
          )}
          {onClose && (
            <button className="icon-button" onClick={onClose} aria-label="Close library">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="fresh-library__utility">
        <button className="upload-link" type="button" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
          <FileUp size={14} /> Upload a file
        </button>
        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={event => handleUpload(event.target.files?.[0])}
        />
        {uploadError && <p className="field-error">{uploadError}</p>}
      </div>

      <div className="fresh-library__browse">
        <div className="search-field">
          <Search size={15} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={`Search ${catalog.length} simulations`}
            aria-label="Search simulations"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="category-strip" aria-label="Simulation categories">
          {categories.map(category => (
            <button
              key={category}
              className={activeCategory === category ? 'is-active' : ''}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="catalog-list">
          {results.map(({ item, category, subcategory }, index) => {
            const isActive = activeFile?.name === item.fileData.name;
            const previousResult = results[index - 1];
            const startsSection = !previousResult
              || previousResult.category !== category
              || previousResult.subcategory !== subcategory;
            return (
              <React.Fragment key={`${category}-${subcategory}-${item.id}`}>
                {startsSection && (
                  <div className="catalog-section">
                    <span>{subcategory}</span>
                    <small>{category}</small>
                  </div>
                )}
                <button
                  className={`catalog-row ${isActive ? 'is-active' : ''}`}
                  disabled={isProcessing}
                  onClick={() => selectItem(item)}
                  type="button"
                >
                  <span className="catalog-row__index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="catalog-row__copy">
                    <strong>{item.label}</strong>
                    <small>{item.description ?? category}</small>
                  </span>
                  <ArrowRight className="catalog-row__arrow" size={15} />
                </button>
              </React.Fragment>
            );
          })}
          {results.length === 0 && <p className="empty-list">No simulations match “{query}”.</p>}
        </div>
      </div>
    </div>
  );
};

export default FreshLibrary;
