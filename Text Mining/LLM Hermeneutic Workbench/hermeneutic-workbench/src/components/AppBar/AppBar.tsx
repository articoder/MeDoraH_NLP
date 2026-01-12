/**
 * AppBar Component - Two-Tier Navigation Design (Refined)
 * Brand Row + Action Row layout with expandable search
 */
import { useState, useRef, useEffect } from 'react';
import { useDataStore } from '../../stores/useDataStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useUIStore } from '../../stores/useUIStore';
import { open } from '@tauri-apps/plugin-dialog';
import './AppBar.css';

export function AppBar() {
    const { loadJsonFile, isLoading, loadedFilePath } = useDataStore();
    const { searchTerm, setSearchTerm, hasActiveFilters, clearAllFilters } = useFilterStore();
    const { openNetworkModal } = useUIStore();

    // Search expansion state
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleOpenFile = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'JSON',
                    extensions: ['json']
                }]
            });

            if (selected) {
                await loadJsonFile(selected as string);
            }
        } catch (err) {
            console.error('Failed to open file:', err);
        }
    };

    const handleBackToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearchClick = () => {
        setIsSearchExpanded(true);
    };

    const handleSearchBlur = () => {
        // Only collapse if search is empty
        if (!searchTerm) {
            setIsSearchExpanded(false);
        }
    };

    // Focus input when expanded
    useEffect(() => {
        if (isSearchExpanded && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchExpanded]);

    return (
        <header className="app-bar">
            {/* Brand Row - Top tier with title and layer indicator */}
            <div className="app-bar-brand-row">
                <div className="app-bar-brand-text">
                    <h1 className="app-bar-title">LLM Hermeneutic Workbench</h1>
                    <span className="layer-indicator">Claim Layer</span>
                </div>
                {loadedFilePath && (
                    <span className="file-indicator">
                        {/* File indicator moved to Open button */}
                    </span>
                )}
            </div>

            {/* Action Row - Bottom tier with navigation and actions */}
            <div className="app-bar-action-row">
                {/* Action Buttons Group - Left side */}
                <div className="action-buttons-group">
                    <button
                        className="app-bar-btn app-bar-btn-secondary"
                        onClick={handleOpenFile}
                        disabled={isLoading}
                        title={loadedFilePath ? loadedFilePath.split('/').pop() : 'Open JSON File'}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {isLoading ? 'Loading...' : (loadedFilePath ? 'Opened' : 'Open')}
                    </button>

                    <button
                        className="app-bar-btn app-bar-btn-primary"
                        id="visualise-btn"
                        onClick={openNetworkModal}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <circle cx="6" cy="6" r="2" />
                            <circle cx="18" cy="6" r="2" />
                            <circle cx="6" cy="18" r="2" />
                            <circle cx="18" cy="18" r="2" />
                            <line x1="9" y1="9" x2="7.5" y2="7.5" />
                            <line x1="15" y1="9" x2="16.5" y2="7.5" />
                            <line x1="9" y1="15" x2="7.5" y2="16.5" />
                            <line x1="15" y1="15" x2="16.5" y2="16.5" />
                        </svg>
                        Visualise
                    </button>

                    {hasActiveFilters() && (
                        <button
                            className="app-bar-btn app-bar-btn-ghost"
                            id="clear-all-filters-btn"
                            onClick={clearAllFilters}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Main Navigation - Pill style, right aligned */}
                <nav className={`main-nav ${isSearchExpanded ? 'search-expanded' : ''}`} id="main-nav">
                    {/* View Layers with Dropdown */}
                    <div className="nav-item has-dropdown" id="nav-view-layers">
                        <span>View Layers</span>
                        <svg className="dropdown-arrow" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <div className="nav-dropdown">
                            <div className="nav-dropdown-item" data-layer="discourse">
                                <span className="dropdown-dot"></span>
                                Discourse Layer
                            </div>
                            <div className="nav-dropdown-item" data-layer="narrative">
                                <span className="dropdown-dot"></span>
                                Narrative Layer
                            </div>
                            <div className="nav-dropdown-item active" data-layer="claim">
                                <span className="dropdown-dot active"></span>
                                Claim Layer
                            </div>
                            <div className="nav-dropdown-item" data-layer="historical">
                                <span className="dropdown-dot"></span>
                                Historical Reference Layer
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="nav-item" id="nav-statistics">
                        <span>Statistics</span>
                    </div>

                    {/* Models & API */}
                    <div className="nav-item" id="nav-models-api">
                        <span>Models &amp; API</span>
                    </div>

                    {/* Edit Ontology */}
                    <div className="nav-item" id="nav-edit-ontology">
                        <span>Edit Ontology</span>
                    </div>

                    {/* Search - Expandable */}
                    <div className={`nav-search-container ${isSearchExpanded ? 'expanded' : ''}`}>
                        <button
                            className="nav-search-toggle"
                            onClick={handleSearchClick}
                            aria-label="Search"
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                        </button>
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="nav-search-input"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onBlur={handleSearchBlur}
                        />
                    </div>
                </nav>
            </div>

            {/* Back to Top Button */}
            <button
                id="back-to-top-btn"
                onClick={handleBackToTop}
                title="Back to Top"
            >
                ↑ Top
            </button>
        </header>
    );
}
