/**
 * Main Application Entry Point
 * Handles DOM ready events, navigation UI, filtering, and export functionality
 * Depends on: utils.js, filter-engine.js (for FilterTracker), network-viz.js
 * 
 * Note: Export functions that require Jinja2 data injection remain in the template
 */

document.addEventListener('DOMContentLoaded', () => {
    // =====================================================
    // NAVIGATION BAR INTERACTIVITY
    // =====================================================
    const navViewLayers = document.getElementById('nav-view-layers');
    const navSearchBtn = document.getElementById('nav-search-btn');
    const navSearchWrapper = document.getElementById('nav-search-wrapper');
    const navSearchClose = document.getElementById('nav-search-close');
    const navSearchInput = document.getElementById('entity-search-input');
    const navItems = document.querySelectorAll('.nav-item:not(.has-dropdown)');
    const navDropdownItems = document.querySelectorAll('.nav-dropdown-item');

    // View Layers dropdown toggle
    if (navViewLayers) {
        navViewLayers.addEventListener('click', (e) => {
            e.stopPropagation();
            navViewLayers.classList.toggle('open');
        });
    }

    // Dropdown item click handling
    navDropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const layerName = item.getAttribute('data-layer');
            const layerText = item.textContent;
            // Remove active class from all dropdown items
            navDropdownItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');
            // Close the dropdown
            navViewLayers.classList.remove('open');
            // Update layer indicator in title
            const layerIndicator = document.getElementById('layer-indicator');
            if (layerIndicator) {
                layerIndicator.textContent = `| ${layerText}`;
            }
            console.log(`Selected layer: ${layerName}`);
        });
    });

    // Regular nav items click (for future feature implementation)
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const itemId = item.id;
            console.log(`Nav item clicked: ${itemId}`);
            // Future: implement specific features for each nav item
        });
    });

    // Search button click - expand search bar
    if (navSearchBtn) {
        navSearchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (navSearchWrapper) {
                navSearchWrapper.classList.add('expanded');
                navSearchBtn.style.display = 'none';
                setTimeout(() => {
                    navSearchInput.focus();
                }, 300);
            }
        });
    }

    // Close search button
    if (navSearchClose) {
        navSearchClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (navSearchWrapper) {
                navSearchWrapper.classList.remove('expanded');
                navSearchBtn.style.display = 'flex';
                navSearchInput.value = '';
                // Trigger search clear
                navSearchInput.dispatchEvent(new Event('input'));
            }
        });
    }

    // Close dropdown and search when clicking outside
    document.addEventListener('click', (e) => {
        // Close View Layers dropdown
        if (navViewLayers && !navViewLayers.contains(e.target)) {
            navViewLayers.classList.remove('open');
        }
        // Close search if clicking outside and it's empty
        if (navSearchWrapper && navSearchWrapper.classList.contains('expanded')) {
            if (!navSearchWrapper.contains(e.target) && !navSearchBtn.contains(e.target)) {
                if (!navSearchInput.value.trim()) {
                    navSearchWrapper.classList.remove('expanded');
                    navSearchBtn.style.display = 'flex';
                }
            }
        }
    });

    // Close search on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (navViewLayers) {
                navViewLayers.classList.remove('open');
            }
            if (navSearchWrapper && navSearchWrapper.classList.contains('expanded')) {
                navSearchWrapper.classList.remove('expanded');
                navSearchBtn.style.display = 'flex';
            }
        }
    });

    // =====================================================
    // FILTER STATE
    // =====================================================
    let activeTypeFilters = new Set();
    let activePatternFilter = null;
    let activeRelationFilter = null;
    let activeSearchTerm = '';

    const allCards = document.querySelectorAll('.extraction-card');
    const allTurns = document.querySelectorAll('.speaker-turn');
    const allPatternItems = document.querySelectorAll('.patterns-column li, .patterns-list-single li');
    const sidebar = document.getElementById('sidebar');
    const typeFilterContainer = document.getElementById('entity-type-filter-container');
    const patternLists = document.querySelectorAll('.patterns-column ol, .patterns-list-single');
    const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');
    const searchInput = document.getElementById('entity-search-input');

    const filterStatus = document.getElementById('filter-status');
    const searchFilterDisplay = document.getElementById('search-filter-display');
    const searchFilterText = document.getElementById('search-filter-text');
    const typeFilterDisplay = document.getElementById('type-filter-display');
    const typeFilterTags = document.getElementById('type-filter-tags');
    const patternFilterDisplay = document.getElementById('pattern-filter-display');
    const patternFilterText = document.getElementById('pattern-filter-text');
    const relationFilterDisplay = document.getElementById('relation-filter-display');
    const relationFilterTags = document.getElementById('relation-filter-tags');

    // =====================================================
    // BACK TO TOP BUTTON
    // =====================================================
    const backToTopBtn = document.getElementById('back-to-top-btn');
    window.addEventListener('scroll', () => {
        if (window.scrollY > window.innerHeight / 2) {
            backToTopBtn.style.display = 'flex';
        } else {
            backToTopBtn.style.display = 'none';
        }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // =====================================================
    // MASTER UPDATE FUNCTION
    // =====================================================
    const masterUpdate = () => {
        const hasActiveFilters = activeTypeFilters.size > 0 || activePatternFilter || activeRelationFilter || activeSearchTerm;
        filterStatus.style.display = hasActiveFilters ? 'block' : 'none';

        // Update network filter tracker
        if (window.networkComponents && window.networkComponents.filterTracker) {
            window.networkComponents.filterTracker.updateFilters(
                activeTypeFilters,
                activePatternFilter,
                activeRelationFilter,
                activeSearchTerm
            );
        }

        document.querySelectorAll('.filterable-badge').forEach(b => b.classList.toggle('selected', activeTypeFilters.has(b.dataset.entityType)));
        document.querySelectorAll('.filterable-relation').forEach(r => r.classList.toggle('selected', activeRelationFilter === r.dataset.relationForm));

        if (activeSearchTerm) {
            searchFilterDisplay.style.display = 'block';
            searchFilterText.innerHTML = `<code>${activeSearchTerm}</code>`;
        } else {
            searchFilterDisplay.style.display = 'none';
        }

        if (activeTypeFilters.size > 0) {
            typeFilterDisplay.style.display = 'block';
            typeFilterTags.innerHTML = '';
            activeTypeFilters.forEach(type => {
                const originalBadge = typeFilterContainer.querySelector(`.filterable-badge[data-entity-type="${type}"]`);
                if (originalBadge) {
                    const clone = originalBadge.cloneNode(true);
                    clone.style.display = 'inline-block';
                    clone.classList.remove('filterable-badge', 'selected');
                    clone.style.cursor = 'pointer';
                    clone.title = 'Click to remove this filter';
                    clone.innerHTML += ' &times;';
                    clone.addEventListener('click', () => {
                        activeTypeFilters.delete(type);
                        masterUpdate();
                    });
                    typeFilterTags.appendChild(clone);
                }
            });
        } else {
            typeFilterDisplay.style.display = 'none';
        }

        if (activeRelationFilter) {
            relationFilterDisplay.style.display = 'block';
            relationFilterTags.innerHTML = `<code>${activeRelationFilter}</code> <span class="remove-filter" data-filter-type="relation">&times;</span>`;
        } else {
            relationFilterDisplay.style.display = 'none';
        }

        if (activePatternFilter) {
            patternFilterDisplay.style.display = 'block';
            patternFilterText.innerHTML = `<code>${activePatternFilter.s_type} &rarr; <span class="pattern-rel">${activePatternFilter.r_form}</span> &rarr; ${activePatternFilter.o_type}</code>`;
        } else {
            patternFilterDisplay.style.display = 'none';
        }

        // Main Filtering Logic (supports grouped cards with multiple triples)
        allCards.forEach(card => {
            let isVisible = true;

            // Build helper accessors for aggregated datasets (pipe-separated lists)
            const splitList = (s) => (s ? String(s).split('|').filter(Boolean) : []);
            const subjectNames = splitList(card.dataset.subjectNames || card.dataset.subjectName);
            const objectNames = splitList(card.dataset.objectNames || card.dataset.objectName);
            const subjectTypes = new Set(splitList(card.dataset.subjectTypes || card.dataset.subjectType));
            const objectTypes = new Set(splitList(card.dataset.objectTypes || card.dataset.objectType));
            const relationForms = new Set(splitList(card.dataset.relationForms || card.dataset.relationForm));
            const patterns = new Set(splitList(card.dataset.patterns)); // entries like "S::R::O"
            const relationSurfaces = splitList(card.dataset.relationSurfaces || '');
            const evidenceSources = splitList(card.dataset.evidenceSources || '');
            const evidenceText = (card.dataset.evidenceText || '').toLowerCase();

            // Search across names, types, relations, surface forms, and evidence
            if (isVisible && activeSearchTerm) {
                const term = activeSearchTerm;
                const nameMatch =
                    subjectNames.some(n => n.includes(term)) ||
                    objectNames.some(n => n.includes(term));
                const typeMatch =
                    Array.from(subjectTypes).some(t => String(t).toLowerCase().includes(term)) ||
                    Array.from(objectTypes).some(t => String(t).toLowerCase().includes(term));
                const relationMatch =
                    Array.from(relationForms).some(r => String(r).toLowerCase().includes(term));
                const surfaceMatch =
                    relationSurfaces.some(s => String(s).toLowerCase().includes(term));
                const evidenceSourceMatch =
                    evidenceSources.some(s => String(s).toLowerCase().includes(term));
                const evidenceTextMatch = evidenceText.includes(term);

                if (
                    !(
                        nameMatch ||
                        typeMatch ||
                        relationMatch ||
                        surfaceMatch ||
                        evidenceSourceMatch ||
                        evidenceTextMatch
                    )
                ) {
                    isVisible = false;
                }
            }

            // Type filter: any match in either subject/object types
            if (isVisible && activeTypeFilters.size > 0) {
                let match = false;
                for (const t of activeTypeFilters) {
                    if (subjectTypes.has(t) || objectTypes.has(t)) { match = true; break; }
                }
                if (!match) isVisible = false;
            }

            // Relation filter: any relation match
            if (isVisible && activeRelationFilter) {
                if (!relationForms.has(activeRelationFilter)) isVisible = false;
            }

            // Pattern filter: requires exact S::R::O presence
            if (isVisible && activePatternFilter) {
                const key = `${activePatternFilter.s_type}::${activePatternFilter.r_form}::${activePatternFilter.o_type}`;
                if (!patterns.has(key)) isVisible = false;
            }

            card.classList.toggle('hidden-by-filter', !isVisible);
        });

        allTurns.forEach(turn => {
            const hasVisibleCard = turn.querySelector('.extraction-card:not(.hidden-by-filter)');
            turn.classList.toggle('hidden-by-filter', !hasVisibleCard);
        });

        allPatternItems.forEach(item => {
            if (activeTypeFilters.size === 0) { item.classList.remove('hidden-by-filter'); return; }
            const isVisible = activeTypeFilters.has(item.dataset.filterSubject) || activeTypeFilters.has(item.dataset.filterObject);
            item.classList.toggle('hidden-by-filter', !isVisible);
        });

        // Update Global Summary Card Statistics
        const statTotalExtractions = document.getElementById('stat-total-extractions');
        const statSpeakerTurns = document.getElementById('stat-speaker-turns');
        const statUniqueEntities = document.getElementById('stat-unique-entities');
        const statUniqueEntityTypes = document.getElementById('stat-unique-entity-types');
        const statUniqueRelations = document.getElementById('stat-unique-relations');

        if (hasActiveFilters) {
            // Calculate stats from visible cards
            const visibleCards = document.querySelectorAll('.extraction-card:not(.hidden-by-filter)');
            const visibleTurns = document.querySelectorAll('.speaker-turn:not(.hidden-by-filter)');

            // Track unique entities, entity types, and relations
            const uniqueEntities = new Set();
            const uniqueEntityTypes = new Set();
            const uniqueRelations = new Set();
            let totalExtractions = 0;

            visibleCards.forEach(card => {
                // Count triples in this card (each sro-triple div is one extraction)
                const triplesInCard = card.querySelectorAll('.sro-triple').length;
                totalExtractions += triplesInCard || 1;

                // Parse datasets for unique values
                const splitList = (s) => (s ? String(s).split('|').filter(Boolean) : []);

                // Entity names (subjects and objects)
                splitList(card.dataset.subjectNames || card.dataset.subjectName).forEach(n => uniqueEntities.add(n));
                splitList(card.dataset.objectNames || card.dataset.objectName).forEach(n => uniqueEntities.add(n));

                // Entity types
                splitList(card.dataset.subjectTypes || card.dataset.subjectType).forEach(t => uniqueEntityTypes.add(t));
                splitList(card.dataset.objectTypes || card.dataset.objectType).forEach(t => uniqueEntityTypes.add(t));

                // Relations
                splitList(card.dataset.relationForms || card.dataset.relationForm).forEach(r => uniqueRelations.add(r));
            });

            // Update DOM with animation (uses animateNumber from utils.js)
            if (typeof animateNumber === 'function') {
                animateNumber(statTotalExtractions, totalExtractions);
                animateNumber(statSpeakerTurns, visibleTurns.length);
                animateNumber(statUniqueEntities, uniqueEntities.size);
                animateNumber(statUniqueEntityTypes, uniqueEntityTypes.size);
                animateNumber(statUniqueRelations, uniqueRelations.size);
            }
        } else {
            // Restore original values when no filters are active (with animation)
            if (typeof animateNumber === 'function') {
                animateNumber(statTotalExtractions, statTotalExtractions?.dataset.original);
                animateNumber(statSpeakerTurns, statSpeakerTurns?.dataset.original);
                animateNumber(statUniqueEntities, statUniqueEntities?.dataset.original);
                animateNumber(statUniqueEntityTypes, statUniqueEntityTypes?.dataset.original);
                animateNumber(statUniqueRelations, statUniqueRelations?.dataset.original);
            }
        }
    };

    // Export masterUpdate for other modules
    window.masterUpdate = masterUpdate;

    // =====================================================
    // EVENT HANDLERS
    // =====================================================

    if (sidebar) {
        sidebar.addEventListener('click', (event) => {
            const target = event.target;

            const badge = target.closest('.filterable-badge');
            if (badge) {
                const entityType = badge.dataset.entityType;
                activeTypeFilters.has(entityType) ? activeTypeFilters.delete(entityType) : activeTypeFilters.add(entityType);
                masterUpdate();
                return;
            }

            const relation = target.closest('.filterable-relation');
            if (relation) {
                const relationForm = relation.dataset.relationForm;
                activeRelationFilter = activeRelationFilter === relationForm ? null : relationForm;
                masterUpdate();
                return;
            }

            const collapsibleHeader = target.closest('.collapsible-header');
            if (collapsibleHeader) {
                if (!target.closest('button')) {
                    collapsibleHeader.closest('.collapsible')?.classList.toggle('collapsed');
                }
            }

            if (target.matches('.remove-filter')) {
                if (target.dataset.filterType === 'relation') { activeRelationFilter = null; }
                masterUpdate();
            }
        });
    }

    // Also handle clicks in the header filter status bar
    const headerFilterStatus = document.getElementById('filter-status');
    if (headerFilterStatus) {
        headerFilterStatus.addEventListener('click', (event) => {
            const target = event.target;
            if (target.matches('.remove-filter')) {
                if (target.dataset.filterType === 'relation') { activeRelationFilter = null; }
                masterUpdate();
            }
        });
    }

    patternLists.forEach(list => {
        list.addEventListener('click', (event) => {
            const clickedLi = event.target.closest('li');
            if (!clickedLi || !clickedLi.dataset.filterSubject) return;

            const s_type = clickedLi.dataset.filterSubject;
            const r_form = clickedLi.dataset.filterRelation;
            const o_type = clickedLi.dataset.filterObject;
            const isAlreadyActive = activePatternFilter && activePatternFilter.s_type === s_type && activePatternFilter.r_form === r_form && activePatternFilter.o_type === o_type;

            document.querySelectorAll('.active-filter').forEach(el => el.classList.remove('active-filter'));

            if (isAlreadyActive) {
                activePatternFilter = null;
            } else {
                clickedLi.classList.add('active-filter');
                activePatternFilter = { s_type, r_form, o_type };
            }
            masterUpdate();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            activeSearchTerm = searchInput.value.trim().toLowerCase();
            masterUpdate();
        });
    }

    if (clearAllFiltersBtn) {
        clearAllFiltersBtn.addEventListener('click', () => {
            activeTypeFilters.clear();
            activePatternFilter = null;
            activeRelationFilter = null;
            activeSearchTerm = '';
            if (searchInput) searchInput.value = '';
            document.querySelectorAll('.active-filter').forEach(el => el.classList.remove('active-filter'));
            masterUpdate();
        });
    }

    // =====================================================
    // ENTITY TYPE BADGES EXPAND/COLLAPSE
    // =====================================================
    if (typeFilterContainer) {
        const groupSections = typeFilterContainer.querySelectorAll('.entity-type-section');
        const limitPerGroup = 15;
        groupSections.forEach(section => {
            const badges = section.querySelectorAll('.filterable-badge');
            const btn = section.querySelector('.entity-group-toggle');
            if (!btn) return;
            if (badges.length > limitPerGroup) {
                btn.style.display = 'block';
                btn.textContent = `Show All ${badges.length}`;
                for (let i = limitPerGroup; i < badges.length; i++) { badges[i].style.display = 'none'; }
                btn.addEventListener('click', () => {
                    const isExpanded = section.classList.toggle('expanded');
                    for (let i = limitPerGroup; i < badges.length; i++) { badges[i].style.display = isExpanded ? 'inline-block' : 'none'; }
                    btn.textContent = isExpanded ? `Show Less (Top ${limitPerGroup})` : `Show All ${badges.length}`;
                });
            }
        });
    }

    // Generic toggle buttons for lists
    document.querySelectorAll('.toggle-button[data-target]').forEach(button => {
        const list = document.getElementById(button.dataset.target);
        if (!list || list.children.length <= 25) { button.style.display = 'none'; return; }
        for (let i = 25; i < list.children.length; i++) { list.children[i].style.display = 'none'; }
        button.textContent = `Show All ${list.children.length}`;
        button.addEventListener('click', () => {
            const isExpanded = list.classList.toggle('expanded');
            for (let i = 25; i < list.children.length; i++) { list.children[i].style.display = isExpanded ? 'flex' : 'none'; }
            button.textContent = isExpanded ? 'Show Less (Top 25)' : `Show All ${list.children.length}`;
        });
    });

    // =====================================================
    // STRUCTURAL PATTERNS DISPLAY CONTROLS
    // =====================================================
    (function initPatternDisplayControls() {
        const patternsList = document.getElementById('structural-patterns-list');
        const countSelect = document.getElementById('patterns-display-count');
        const sortToggle = document.getElementById('patterns-sort-toggle');

        if (!patternsList) return;

        let isDescending = true; // Default: descending (most frequent first)
        let displayCount = 25; // Default: 25 items

        // Store original items with their data for sorting
        const allItems = Array.from(patternsList.children).map(li => ({
            element: li,
            count: parseInt(li.dataset.count, 10) || 0,
            subject: li.dataset.filterSubject,
            relation: li.dataset.filterRelation,
            object: li.dataset.filterObject
        }));

        function updateDisplay() {
            // Sort items
            const sorted = [...allItems].sort((a, b) => {
                return isDescending ? (b.count - a.count) : (a.count - b.count);
            });

            // Clear and re-append in sorted order
            patternsList.innerHTML = '';
            sorted.forEach((item, index) => {
                const li = item.element;
                // Update the rank number
                const rankSpan = li.querySelector('.rank');
                if (rankSpan) {
                    rankSpan.textContent = (index + 1) + '.';
                }
                // Show/hide based on displayCount
                if (index < displayCount) {
                    li.classList.remove('hidden-by-display');
                } else {
                    li.classList.add('hidden-by-display');
                }
                patternsList.appendChild(li);
            });
        }

        // Initialize display
        updateDisplay();

        // Count select handler
        if (countSelect) {
            countSelect.addEventListener('change', () => {
                displayCount = parseInt(countSelect.value, 10);
                updateDisplay();
            });
        }

        // Sort toggle handler
        if (sortToggle) {
            sortToggle.addEventListener('click', () => {
                isDescending = !isDescending;
                sortToggle.textContent = isDescending ? 'Descending ▼' : 'Ascending ▲';
                updateDisplay();
            });
        }
    })();

    // =====================================================
    // COLLECT FILTERED TRIPLES (for export)
    // =====================================================
    function collectFilteredTriples() {
        const resultTurns = [];

        if (!Array.isArray(window.rawTripleData)) {
            return resultTurns;
        }

        const hasActiveFilters =
            activeTypeFilters.size > 0 ||
            activePatternFilter ||
            activeRelationFilter ||
            activeSearchTerm;

        // No filters -> all triples are visible
        if (!hasActiveFilters) {
            return window.rawTripleData;
        }

        window.rawTripleData.forEach(turn => {
            if (!Array.isArray(turn.extractions) || turn.extractions.length === 0) {
                return;
            }

            // Group by evidence_text (mirrors Jinja groupby)
            const groups = new Map();
            turn.extractions.forEach(extraction => {
                const key = extraction.evidence_text || '';
                if (!groups.has(key)) {
                    groups.set(key, []);
                }
                groups.get(key).push(extraction);
            });

            const filteredExtractions = [];

            groups.forEach(groupList => {
                let isVisible = true;

                const subjectNames = groupList
                    .map(ex => (ex.subject_entity && ex.subject_entity.name ? ex.subject_entity.name.toLowerCase() : ''))
                    .filter(Boolean);
                const objectNames = groupList
                    .map(ex => (ex.object_entity && ex.object_entity.name ? ex.object_entity.name.toLowerCase() : ''))
                    .filter(Boolean);
                const subjectTypes = new Set(
                    groupList
                        .map(ex => ex.subject_entity && ex.subject_entity.entity_type)
                        .filter(Boolean)
                );
                const objectTypes = new Set(
                    groupList
                        .map(ex => ex.object_entity && ex.object_entity.entity_type)
                        .filter(Boolean)
                );
                const relationForms = new Set(
                    groupList
                        .map(ex => ex.relation && ex.relation.semantic_form)
                        .filter(Boolean)
                );
                const relationSurfaces = new Set(
                    groupList
                        .map(ex => ex.relation && ex.relation.surface_form)
                        .filter(Boolean)
                );
                const patterns = new Set(
                    groupList
                        .map(ex => {
                            if (!ex.subject_entity || !ex.object_entity || !ex.relation) return null;
                            return `${ex.subject_entity.entity_type}::${ex.relation.semantic_form}::${ex.object_entity.entity_type}`;
                        })
                        .filter(Boolean)
                );
                const evidenceSources = new Set();
                groupList.forEach(ex => {
                    if (Array.isArray(ex.evidence_sources)) {
                        ex.evidence_sources.forEach(src => {
                            evidenceSources.add(String(src).toLowerCase());
                        });
                    }
                });
                const evidenceText = (groupList[0] && groupList[0].evidence_text
                    ? String(groupList[0].evidence_text).toLowerCase()
                    : '');

                // Search filter
                if (isVisible && activeSearchTerm) {
                    const term = activeSearchTerm;
                    const nameMatch =
                        subjectNames.some(n => n.includes(term)) ||
                        objectNames.some(n => n.includes(term));
                    const typeMatch =
                        Array.from(subjectTypes).some(t => String(t).toLowerCase().includes(term)) ||
                        Array.from(objectTypes).some(t => String(t).toLowerCase().includes(term));
                    const relationMatch =
                        Array.from(relationForms).some(r => String(r).toLowerCase().includes(term));
                    const surfaceMatch =
                        Array.from(relationSurfaces).some(s => String(s).toLowerCase().includes(term));
                    const evidenceSourceMatch =
                        Array.from(evidenceSources).some(s => s.includes(term));
                    const evidenceTextMatch = evidenceText.includes(term);

                    if (
                        !(
                            nameMatch ||
                            typeMatch ||
                            relationMatch ||
                            surfaceMatch ||
                            evidenceSourceMatch ||
                            evidenceTextMatch
                        )
                    ) {
                        isVisible = false;
                    }
                }

                // Type filter
                if (isVisible && activeTypeFilters.size > 0) {
                    let match = false;
                    for (const t of activeTypeFilters) {
                        if (subjectTypes.has(t) || objectTypes.has(t)) {
                            match = true;
                            break;
                        }
                    }
                    if (!match) isVisible = false;
                }

                // Relation filter
                if (isVisible && activeRelationFilter) {
                    if (!relationForms.has(activeRelationFilter)) {
                        isVisible = false;
                    }
                }

                // Pattern filter
                if (isVisible && activePatternFilter) {
                    const key = `${activePatternFilter.s_type}::${activePatternFilter.r_form}::${activePatternFilter.o_type}`;
                    if (!patterns.has(key)) {
                        isVisible = false;
                    }
                }

                if (isVisible) {
                    filteredExtractions.push(...groupList);
                }
            });

            if (filteredExtractions.length > 0) {
                resultTurns.push({
                    ...turn,
                    extractions: filteredExtractions
                });
            }
        });

        return resultTurns;
    }

    // Export to global scope for use by template export functions
    window.collectFilteredTriples = collectFilteredTriples;

    console.log('Main application initialized successfully');
});
