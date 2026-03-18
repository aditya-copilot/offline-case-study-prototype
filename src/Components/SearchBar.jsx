import { useState, useRef, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import './SearchBar.css';

export function SearchBar({ 
  placeholder = 'Search...', 
  onSearch, 
  suggestions = [],
  showFilters = false,
  filters = {},
  onFilterChange,
  filterOptions = {}
}) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (onSearch && debouncedQuery.trim()) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    if (onSearch) {
      onSearch(suggestion);
    }
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  };

  const filteredSuggestions = suggestions.filter(s => 
    (s || '').toLowerCase().includes(query.toLowerCase()) && 
    (s || '').toLowerCase() !== query.toLowerCase()
  ).slice(0, 5);

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className={`search-input-wrapper ${isFocused ? 'focused' : ''}`}>
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsFocused(false);
                setShowSuggestions(false);
              }, 200);
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            className="search-input"
          />

          {query && (
            <button 
              type="button" 
              onClick={clearSearch}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}

          {showFilters && (
            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`filter-toggle-btn ${showFilterPanel ? 'active' : ''}`}
              aria-label="Toggle filters"
              aria-expanded={showFilterPanel}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {Object.values(filters).some(Boolean) && (
                <span className="filter-badge" />
              )}
            </button>
          )}

          <button type="submit" className="search-submit-btn" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul className="search-suggestions" role="listbox">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={index}
                role="option"
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-item"
              >
                <svg className="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        )}
      </form>

      {showFilters && showFilterPanel && (
        <div className="filter-panel">
          {Object.entries(filterOptions).map(([key, options]) => (
            <div key={key} className="filter-group">
              <label className="filter-label">{options.label}</label>
              <div className="filter-options">
                {options.values.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onFilterChange?.(key, value)}
                    className={`filter-chip ${filters[key] === value ? 'active' : ''}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {Object.values(filters).some(Boolean) && (
            <button
              type="button"
              onClick={() => onFilterChange?.('clear', null)}
              className="clear-filters-btn"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
