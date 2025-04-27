// Ensure this file (app.js) is loaded AFTER apkg.js in the HTML

document.addEventListener('DOMContentLoaded', function() {
    console.log("Fuzzy-Anki UI Initializing...");

    // --- Global Variables ---
    let allFields = new Set();        // Store all unique field names from loaded decks
    let currentDeckFieldMap = {}; // Maps table index to its field names
    let originalTabulate = null;    // To store the original apkg.js tabulate function
    let originalAnkiBinaryToTable = null; // To store the original apkg.js function
    let originalAnkiSQLToRevlogTable = null; // To store the original apkg.js function
    let SQL = window.SQL; // Reference SQL object if initialized by sql-wasm.js in apkg.js

    // --- Initialization ---
    initUIComponents();      // Set up basic UI interactions (time, tabs, inputs)
    wrapCoreApkgFunctions(); // Wrap functions from apkg.js to add enhancements
    setupMutationObserver(); // Observe #anki and #reviews for added content

    // --- UI Component Setup ---
    function initUIComponents() {
        // Update time display
        updateTimeDisplay();
        setInterval(updateTimeDisplay, 30000); // Update every 30 seconds

        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const activeTab = document.querySelector('.tab-content.active');
                const targetTabId = `${btn.dataset.tab}-tab`;
                const targetTab = document.getElementById(targetTabId);

                if (activeTab && activeTab.id !== targetTabId) {
                    // Animate out current tab
                    activeTab.style.animation = 'fadeOut 0.15s ease forwards';
                    setTimeout(() => {
                        activeTab.classList.remove('active');
                        activeTab.style.animation = ''; // Reset animation

                        // Activate new tab
                        tabBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');

                        if (targetTab) {
                            targetTab.classList.add('active');
                            targetTab.style.animation = 'fadeIn 0.2s ease forwards';
                        } else {
                             console.error(`Target tab content not found: #${targetTabId}`);
                        }

                    }, 150);
                } else if (!activeTab && targetTab) {
                     // Initial tab selection or if no tab was active
                     tabBtns.forEach(b => b.classList.remove('active'));
                     btn.classList.add('active');
                     targetTab.classList.add('active');
                     targetTab.style.animation = 'fadeIn 0.2s ease forwards';
                }
            });
        });

        // File input handling
        setupFileInput('ankiFile', 'ankiFileName');
        setupFileInput('sqliteFile', 'sqliteFileName');

        // Number input controls
        const numberInputs = document.querySelectorAll('.number-input-wrapper');
        numberInputs.forEach(wrapper => {
            const input = wrapper.querySelector('input[type="number"]');
            const upBtn = wrapper.querySelector('.number-up');
            const downBtn = wrapper.querySelector('.number-down');
            if (input && upBtn && downBtn) {
                upBtn.addEventListener('click', () => { input.stepUp(); animateButtonPress(upBtn); });
                downBtn.addEventListener('click', () => { input.stepDown(); animateButtonPress(downBtn); });
            }
        });

        // URL Import button
        const urlSubmitBtn = document.getElementById('ankiURLSubmit');
        if (urlSubmitBtn) {
            urlSubmitBtn.addEventListener('click', handleUrlImport);
        }

        // Search controls setup (event listeners)
        const searchInput = document.getElementById('card-search');
        const clearSearchBtn = document.getElementById('clear-search');
        const searchBtn = document.getElementById('search-button');

        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearchWithFeedback();
                }
            });
            // Show clear button when typing
            searchInput.addEventListener('input', function() {
                 if (clearSearchBtn) {
                    clearSearchBtn.style.display = this.value.length > 0 ? 'flex' : 'none';
                 }
            });
        }
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none'; // Initially hidden
            clearSearchBtn.addEventListener('click', function() {
                if (searchInput) searchInput.value = '';
                clearSearch();
                this.style.display = 'none';
                animateButtonPress(this);
            });
        }
        if (searchBtn) {
            searchBtn.addEventListener('click', performSearchWithFeedback);
        }

        // User info setup
        const username = 'yiheinchai'; // Or get dynamically if needed
        const userInitials = username.split(/\s+/).map(word => word ? word[0].toUpperCase() : '').join('');
        const avatarElement = document.querySelector('.avatar span');
        if (avatarElement) avatarElement.textContent = userInitials;
        const usernameElement = document.querySelector('.username');
        if (usernameElement) usernameElement.textContent = username;

        // Initialize dynamic styles (like toast notifications)
        initDynamicStyles();

        console.log("UI components initialized.");
    }

    // --- Core Function Wrapping ---
    function wrapCoreApkgFunctions() {
        // Wrap tabulate from apkg.js
        if (typeof window.tabulate === 'function' && !originalTabulate) {
            originalTabulate = window.tabulate;
            window.tabulate = function(datatable, columns, containerString) {
                console.log(`Wrapped tabulate called for container: ${containerString}`);
                // Clear previous content if needed (check containerString)
                const containerElement = d3.select(containerString);
                if (containerElement && !containerElement.empty()) {
                    // Only clear specific containers like #anki or #reviews, not dynamically generated ones
                    if (containerString === '#anki' || containerString === '#reviews') {
                         console.log(`Clearing container: ${containerString}`);
                         containerElement.html(''); // Clear previous results in main areas
                         // Reset search/field state if clearing main containers
                         if (containerString === '#anki') {
                             allFields.clear();
                             currentDeckFieldMap = {};
                         }
                    }
                } else {
                    console.warn(`Container ${containerString} not found or empty for tabulate.`);
                }

                // Call the original function to create the table
                const table = originalTabulate(datatable, columns, containerString);

                // --- Enhancements after table creation ---
                if (table && !table.empty() && table.node()) {
                     // Check if table element actually exists
                     const tableElement = table.node();
                     enhanceTable(tableElement); // Enhance the newly created table
                     collectFieldNamesFromTable(tableElement); // Collect fields from this table
                     updateSearchFields(); // Update dropdown
                     setupSearchInterface(); // Ensure search is visible
                } else {
                    console.warn("Original tabulate did not return a valid table object or node.");
                }
                return table; // Return the original result
            };
            console.log("window.tabulate wrapped.");
        } else if (originalTabulate) {
            console.log("window.tabulate already wrapped.");
        } else {
            console.error("window.tabulate function not found from apkg.js. Table enhancements will not work.");
        }

        // Wrap ankiBinaryToTable from apkg.js
        if (typeof window.ankiBinaryToTable === 'function' && !originalAnkiBinaryToTable) {
            originalAnkiBinaryToTable = window.ankiBinaryToTable;
            window.ankiBinaryToTable = function(ankiArray, options) {
                showLoading('Processing Anki Deck...');
                // Use setTimeout to allow the loading indicator to render before heavy processing
                setTimeout(() => {
                    try {
                        // Reset relevant state before loading new deck
                        d3.select("#anki").html(''); // Clear previous deck display
                        allFields.clear();
                        currentDeckFieldMap = {};
                        resetSearchUI();

                        console.log("Calling original ankiBinaryToTable...");
                        originalAnkiBinaryToTable(ankiArray, options);
                        // Success/failure is inferred by whether `tabulate` added content
                        // We add a small delay for DOM updates.
                        setTimeout(() => {
                            hideLoading();
                            if (document.querySelector('#anki table')) {
                                showToast('Deck loaded successfully!', 'success');
                            } else {
                                showToast('Deck processed, but no cards found or an error occurred.', 'warning');
                            }
                        }, 300); // Adjust delay if needed
                    } catch (error) {
                        console.error("Error during ankiBinaryToTable processing:", error);
                        hideLoading();
                        showToast(`Error loading deck: ${error.message || error}`, 'error');
                        d3.select("#anki").html('<p class="error-message">Failed to load deck. See console for details.</p>');
                    }
                }, 50); // Short delay for UI update
            };
            console.log("window.ankiBinaryToTable wrapped.");
        } else if (originalAnkiBinaryToTable) {
             console.log("window.ankiBinaryToTable already wrapped.");
        } else {
            console.error("window.ankiBinaryToTable function not found from apkg.js.");
        }

        // Wrap ankiSQLToRevlogTable from apkg.js
        if (typeof window.ankiSQLToRevlogTable === 'function' && !originalAnkiSQLToRevlogTable) {
            originalAnkiSQLToRevlogTable = window.ankiSQLToRevlogTable;
            window.ankiSQLToRevlogTable = function(array, options) {
                showLoading('Analyzing Review Data...');
                 setTimeout(() => {
                    try {
                         d3.select("#reviews").html(''); // Clear previous review display
                         console.log("Calling original ankiSQLToRevlogTable...");
                         originalAnkiSQLToRevlogTable(array, options);
                         // Assumes original function calls tabulate or adds charts
                         setTimeout(() => {
                             hideLoading();
                             if (document.querySelector('#reviews table') || document.querySelector('#reviews div[id^="chart"]')) {
                                 showToast('Review data analyzed successfully!', 'success');
                             } else {
                                 showToast('Review data processed, but no results displayed or an error occurred.', 'warning');
                             }
                         }, 300);
                    } catch (error) {
                         console.error("Error during ankiSQLToRevlogTable processing:", error);
                         hideLoading();
                         showToast(`Error analyzing reviews: ${error.message || error}`, 'error');
                         d3.select("#reviews").html('<p class="error-message">Failed to analyze reviews. See console for details.</p>');
                    }
                }, 50);
            };
             console.log("window.ankiSQLToRevlogTable wrapped.");
        } else if (originalAnkiSQLToRevlogTable) {
             console.log("window.ankiSQLToRevlogTable already wrapped.");
        } else {
            console.error("window.ankiSQLToRevlogTable function not found from apkg.js.");
        }

        // --- Setup File Input Listeners (using wrapped functions) ---
        const ankiFileInput = document.getElementById('ankiFile');
        const sqliteFileInput = document.getElementById('sqliteFile');

        if (ankiFileInput) {
            ankiFileInput.addEventListener('change', handleFileInput( (data, opts) => window.ankiBinaryToTable(data, opts) ));
        }
        if (sqliteFileInput) {
            sqliteFileInput.addEventListener('change', handleFileInput( (data, opts) => window.ankiSQLToRevlogTable(data, opts) ));
        }
    }

    // --- Input Handlers ---
    function handleFileInput(processingFunction) {
        return function(event) { // Return the actual event handler function
            event.stopPropagation();
            event.preventDefault();
            const file = event.target.files[0];
            if (!file) {
                console.warn("No file selected.");
                return;
            }
            console.log(`File selected: ${file.name}`);

            // Update file name display immediately
            const fileNameSpanId = event.target.id === 'ankiFile' ? 'ankiFileName' : 'sqliteFileName';
            const fileNameSpan = document.getElementById(fileNameSpanId);
            if (fileNameSpan) fileNameSpan.textContent = file.name;


            const reader = new FileReader();
            reader.onload = function(e) {
                console.log("File read successfully.");
                let options = {};
                if (event.target.id === 'ankiFile') {
                    options.loadImage = document.getElementById('showImage')?.checked || false;
                     console.log("Anki file options:", options);
                } else if (event.target.id === 'sqliteFile') {
                    options.limit = parseInt(document.getElementById('sqliteLimit')?.value) || 150;
                    options.recent = document.getElementById('sqliteRecent')?.checked || true;
                     console.log("SQLite file options:", options);
                }
                // Call the appropriate wrapped processing function
                processingFunction(e.target.result, options);
            };
            reader.onerror = function(e) {
                 console.error("Error reading file:", e);
                 showToast(`Error reading file: ${file.name}`, 'error');
                 hideLoading();
            };
            reader.readAsArrayBuffer(file);
        }
    }

    function handleUrlImport() {
        const urlInput = document.getElementById('ankiURL');
        const url = urlInput?.value?.trim();
        if (!url) {
            showToast('Please enter a valid AnkiWeb URL.', 'warning');
            return;
        }
         console.log(`Importing from URL: ${url}`);
        if (typeof window.ankiURLToTable === 'function') {
            const options = {
                loadImage: document.getElementById('showImage')?.checked || false
            };
            showLoading('Downloading and Processing Deck...');
             setTimeout(() => {
                try {
                     // Reset state before loading new deck
                     d3.select("#anki").html(''); // Clear previous deck display
                     allFields.clear();
                     currentDeckFieldMap = {};
                     resetSearchUI();

                     // Using CORS proxy is often necessary for browser fetching
                     window.ankiURLToTable(url, options, true);
                     // relies on ankiURLToTable eventually calling ankiBinaryToTable (which is wrapped)
                     // success/failure handled in the wrapped ankiBinaryToTable
                     if (urlInput) urlInput.value = ''; // Clear input after submission
                } catch (error) {
                     console.error("Error initiating URL import:", error);
                     hideLoading();
                     showToast(`Error starting URL import: ${error.message || error}`, 'error');
                }
            }, 50);
        } else {
            console.error("window.ankiURLToTable function not found from apkg.js.");
            showToast('URL import functionality is not available.', 'error');
        }
    }


    // --- Mutation Observer ---
    function setupMutationObserver() {
        const observer = new MutationObserver(mutations => {
            let chartsFound = false;
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Check if it's an element
                            // Check if the added node is a chart container or contains chart containers
                            if (node.matches && node.matches('[id^="chart"], [id^="histogram"], [id^="scatter"]')) {
                                enhanceChart(node);
                                chartsFound = true;
                            } else if (node.querySelectorAll) {
                                const chartsInNode = node.querySelectorAll('[id^="chart"], [id^="histogram"], [id^="scatter"]');
                                chartsInNode.forEach(enhanceChart);
                                if (chartsInNode.length > 0) chartsFound = true;
                            }
                            // Table enhancement is now done via the wrapped tabulate function
                        }
                    });
                }
            });
            if (chartsFound) {
                 console.log("Charts detected and enhanced via MutationObserver.");
            }
        });

        const ankiEl = document.getElementById('anki');
        const reviewsEl = document.getElementById('reviews');
        const observerConfig = { childList: true, subtree: true };

        if (ankiEl) observer.observe(ankiEl, observerConfig);
        if (reviewsEl) observer.observe(reviewsEl, observerConfig);
        console.log("MutationObserver setup complete.");
    }

    // --- Search Functionality ---
    function setupSearchInterface() {
        const searchInterface = document.getElementById('search-interface');
        const ankiContainer = document.getElementById('anki');
        // Show search only if there's content in #anki and it's currently hidden
        if (ankiContainer && ankiContainer.querySelector('table') && searchInterface && searchInterface.style.display === 'none') {
            console.log("Setting up search interface.");
            searchInterface.style.opacity = '0';
            searchInterface.style.transform = 'translateY(10px)';
            searchInterface.style.display = 'block'; // Make it visible first

            setTimeout(() => {
                searchInterface.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                searchInterface.style.opacity = '1';
                searchInterface.style.transform = 'translateY(0)';
                // Focus after animation
                // setTimeout(() => document.getElementById('card-search')?.focus(), 150);
            }, 10); // Short delay to ensure display:block is applied
        } else if (searchInterface && searchInterface.style.display !== 'none') {
             // Already visible, do nothing or maybe just update fields
             updateSearchFields();
        } else {
             console.log("Search interface not shown: No table content found or interface already visible.");
        }
    }

    function resetSearchUI() {
         const searchInterface = document.getElementById('search-interface');
         if (searchInterface) {
             searchInterface.style.display = 'none';
             document.getElementById('card-search').value = '';
             document.getElementById('results-count').textContent = '0';
             document.getElementById('search-time').textContent = '0';
             // Optionally reset toggles/selects
             // document.getElementById('case-sensitive').checked = false;
             // document.getElementById('regex-search').checked = false;
             // document.getElementById('search-fields').value = 'all';
             const clearBtn = document.getElementById('clear-search');
             if(clearBtn) clearBtn.style.display = 'none';
         }
         // Clear highlights from any potentially remaining tables (e.g., in #reviews)
         document.querySelectorAll('table').forEach(clearHighlights);
    }

    function collectFieldNamesFromTable(tableElement) {
        if (!tableElement) return;
        const headerCells = tableElement.querySelectorAll('th');
        const tableIndex = Array.from(document.querySelectorAll('#anki table')).indexOf(tableElement); // Use #anki scope

        if (tableIndex === -1) {
            console.warn("Could not determine index for table:", tableElement);
            return; // Don't process tables outside the main #anki container for field mapping
        }

        const fieldNames = Array.from(headerCells).map(cell => cell.textContent.trim().replace(/[\u25B2\u25BC\u2195\s]+$/,'')); // Remove sort icons/spaces
        currentDeckFieldMap[tableIndex] = fieldNames;
        fieldNames.forEach(field => allFields.add(field));
        console.log(`Collected fields for table index ${tableIndex}:`, fieldNames);
        console.log("All unique fields so far:", Array.from(allFields));
    }


    function updateSearchFields() {
        const searchFieldsSelect = document.getElementById('search-fields');
        if (!searchFieldsSelect) return;

        const currentSelection = searchFieldsSelect.value;
        // Clear existing options except "All fields"
        while (searchFieldsSelect.options.length > 1) {
            searchFieldsSelect.remove(1);
        }

        // Sort fields alphabetically for consistency
        const sortedFields = Array.from(allFields).sort((a, b) => a.localeCompare(b));

        // Add sorted unique fields from all decks
        sortedFields.forEach(field => {
            if (field) { // Ensure field name is not empty
                const option = document.createElement('option');
                option.value = field;
                option.textContent = field;
                searchFieldsSelect.appendChild(option);
            }
        });

        // Try to restore previous selection
        if (Array.from(searchFieldsSelect.options).some(opt => opt.value === currentSelection)) {
            searchFieldsSelect.value = currentSelection;
        } else {
            searchFieldsSelect.value = 'all'; // Default back to 'all' if previous selection is gone
        }
         console.log("Search fields dropdown updated.");
    }

    function performSearchWithFeedback() {
         const searchBtn = document.getElementById('search-button');
         if (searchBtn) {
             // Add visual feedback
             searchBtn.classList.add('searching'); // Simple visual cue (needs CSS)
             searchBtn.disabled = true;
             const originalText = searchBtn.textContent;
             searchBtn.textContent = 'Searching...';
         }

         // Use setTimeout to allow UI update before blocking search
         setTimeout(() => {
             performSearch();
             if (searchBtn) {
                 searchBtn.classList.remove('searching');
                 searchBtn.disabled = false;
                 searchBtn.textContent = originalText;
             }
         }, 10);
    }

    function performSearch() {
        const startTime = performance.now();
        const searchInput = document.getElementById('card-search');
        const searchValue = searchInput?.value?.trim() || '';
        const resultsCountEl = document.getElementById('results-count');
        const searchTimeEl = document.getElementById('search-time');

        // Clear previous highlights across all tables first
        document.querySelectorAll('#anki table').forEach(clearHighlights); // Target only #anki tables

        if (!searchValue) {
            clearSearch(); // Clears filter state and resets stats
            return;
        }

        const caseSensitive = document.getElementById('case-sensitive')?.checked || false;
        const useRegex = document.getElementById('regex-search')?.checked || false;
        const searchField = document.getElementById('search-fields')?.value || 'all';

        let searchPattern;
        if (useRegex) {
            try {
                searchPattern = new RegExp(searchValue, caseSensitive ? 'g' : 'gi');
            } catch (e) {
                showToast(`Invalid regular expression: ${e.message}`, 'error');
                console.error("Regex error:", e);
                return;
            }
        } else {
            // Escape special characters for literal search if not using regex
             const escapedValue = searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             searchPattern = new RegExp(escapedValue, caseSensitive ? 'g' : 'gi');
        }

        const tables = document.querySelectorAll('#anki table'); // Target only tables in #anki
        let totalMatchCount = 0;

        tables.forEach((table, tableIndex) => {
            const fieldIndices = getSearchFieldIndices(table, searchField, tableIndex);
            if (!fieldIndices) return; // Skip if indices couldn't be found for this table

            const rows = table.querySelectorAll('tbody tr');
            let tableMatchCount = 0;

            rows.forEach(row => {
                let rowMatches = false;
                const cells = row.querySelectorAll('td');

                fieldIndices.forEach(index => {
                    if (index >= cells.length) return; // Index out of bounds for this row
                    const cell = cells[index];
                    const cellText = cell.textContent || '';
                    searchPattern.lastIndex = 0; // Reset regex state for each cell test

                    if (searchPattern.test(cellText)) {
                        rowMatches = true;
                        // Highlight only the matching parts within this specific cell
                        highlightMatches(cell, searchPattern);
                    }
                });

                // Show/hide row based on match status
                if (rowMatches) {
                    if (row.classList.contains('filtered')) {
                         // Animate row appearing
                         row.style.display = ''; // Reset display if set to none
                         row.style.animation = 'fadeInTableRow 0.3s ease forwards';
                         row.classList.remove('filtered');
                         // Remove animation style after it finishes
                         setTimeout(() => { row.style.animation = ''; }, 300);
                    }
                    tableMatchCount++;
                } else {
                    if (!row.classList.contains('filtered')) {
                         // Animate row disappearing
                         row.style.animation = 'fadeOutTableRow 0.3s ease forwards';
                         row.classList.add('filtered');
                         // Set display to none after animation for performance
                         setTimeout(() => {
                             // Check if it's still filtered before hiding
                             if (row.classList.contains('filtered')) {
                                 row.style.display = 'none';
                                 row.style.animation = ''; // Reset animation
                             }
                         }, 300);
                    } else {
                         // Ensure already filtered rows are hidden
                         row.style.display = 'none';
                    }
                }
            });
             totalMatchCount += tableMatchCount;
        });

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        // Update stats
        if (resultsCountEl) animateCounter(resultsCountEl, parseInt(resultsCountEl.textContent || '0'), totalMatchCount, 300);
        if (searchTimeEl) searchTimeEl.textContent = duration;

        console.log(`Search completed in ${duration}ms. Found ${totalMatchCount} matches for "${searchValue}".`);
        // Optional: Toast notification about results
        // showToast(`Found ${totalMatchCount} matching card(s) in ${duration}ms.`, 'info');
    }

    function clearHighlights(table) {
        if (!table) return;
        const highlightedSpans = table.querySelectorAll('span.search-highlight');
        highlightedSpans.forEach(span => {
             // Replace the span with its text content
             if (span.parentNode) {
                 span.parentNode.replaceChild(document.createTextNode(span.textContent || ''), span);
                 // Normalize adjacent text nodes (optional but good practice)
                 span.parentNode.normalize();
             }
        });
    }

    function highlightMatches(cell, pattern) {
         const cellHtml = cell.innerHTML; // Get current HTML to preserve structure
         const textContent = cell.textContent || ''; // Get text for searching
         let newHtml = '';
         let lastIndex = 0;
         let match;
         pattern.lastIndex = 0; // Reset regex

         while ((match = pattern.exec(textContent)) !== null) {
             // Add text before the match (need to be careful with HTML entities)
             // This simple approach assumes basic text content or replaces existing HTML.
             // A more robust solution would parse the DOM nodes within the cell.
             newHtml += escapeHtml(textContent.substring(lastIndex, match.index));
             // Add the highlighted match
             newHtml += `<span class="search-highlight">${escapeHtml(match[0])}</span>`;
             lastIndex = pattern.lastIndex;

             // Prevent infinite loops with zero-width matches
             if (match.index === pattern.lastIndex) {
                 pattern.lastIndex++;
             }
         }
         // Add the remaining text
         newHtml += escapeHtml(textContent.substring(lastIndex));

         // Only update if highlights were added to avoid unnecessary redraws
         if (lastIndex > 0) {
             cell.innerHTML = newHtml;
         }
    }

    function escapeHtml(text) {
        // Ensure input is a string, return empty string otherwise
        if (typeof text !== 'string') {
            return '';
        }
        const map = {
            '&': '&', // Must be first
            '<': '<',
            '>': '>',
            '"': '"',
            "'": "'" // Use HTML entity for single quote (safer than ')
        };
        // Use a single regex pass for better performance
        return text.replace(/[&<>"']/g, m => map[m]);
    }


    function clearSearch() {
        console.log("Clearing search results and highlights.");
        document.querySelectorAll('#anki table').forEach(table => { // Target only #anki tables
             clearHighlights(table);
             const rows = table.querySelectorAll('tbody tr');
             rows.forEach(row => {
                 if (row.classList.contains('filtered')) {
                     row.style.display = ''; // Reset display
                     row.style.animation = 'fadeInTableRow 0.3s ease forwards';
                     row.classList.remove('filtered');
                     setTimeout(() => { row.style.animation = ''; }, 300);
                 }
             });
        });

        // Reset stats
        const resultsCountEl = document.getElementById('results-count');
        const searchTimeEl = document.getElementById('search-time');
        if (resultsCountEl) animateCounter(resultsCountEl, parseInt(resultsCountEl.textContent || '0'), 0, 200);
        if (searchTimeEl) searchTimeEl.textContent = '0';
    }

    function getSearchFieldIndices(table, fieldName, tableIndex) {
        const fieldsForThisTable = currentDeckFieldMap[tableIndex];
        if (!fieldsForThisTable) {
             console.warn(`No field map found for table index ${tableIndex}. Cannot determine search indices.`);
             // Fallback: search all columns if map is missing
             const headerCells = table.querySelectorAll('th');
             return Array.from(headerCells).map((_, index) => index);
        }

        if (fieldName === 'all') {
            return fieldsForThisTable.map((_, index) => index); // Return all indices for this table
        } else {
            const indices = [];
            fieldsForThisTable.forEach((name, index) => {
                if (name === fieldName) {
                    indices.push(index);
                }
            });
            if (indices.length === 0) {
                 console.warn(`Field "${fieldName}" not found in table index ${tableIndex}.`);
                 // Optionally return empty array or search all as fallback?
                 // return [];
            }
            return indices;
        }
    }

    // --- Table/Chart Enhancements ---
    function enhanceTable(tableElement) {
        if (!tableElement || tableElement.classList.contains('enhanced')) return;
        tableElement.classList.add('enhanced');
        console.log("Enhancing table:", tableElement);

        // Add responsive wrapper if not already present
        if (!tableElement.parentElement || !tableElement.parentElement.classList.contains('table-responsive')) {
             const wrapper = document.createElement('div');
             wrapper.className = 'table-responsive';
             tableElement.parentNode.insertBefore(wrapper, tableElement);
             wrapper.appendChild(tableElement);
             console.log("Added responsive wrapper.");
        }

        // Add sorting capability
        const headerCells = tableElement.querySelectorAll('th');
        headerCells.forEach((cell, index) => {
             // Clear existing icons first if any
             const existingIcon = cell.querySelector('.sort-icon');
             if (existingIcon) existingIcon.remove();

             cell.style.cursor = 'pointer'; // Indicate clickable
             cell.addEventListener('click', () => sortTable(tableElement, index));
             const sortIcon = document.createElement('span');
             sortIcon.className = 'material-symbols-rounded sort-icon';
             sortIcon.textContent = 'unfold_more'; // Default icon
             cell.appendChild(sortIcon);
        });

        // Add export/copy controls (only if table has significant rows)
        const controlsContainer = tableElement.parentNode.parentNode.querySelector('.table-controls');
         if (!controlsContainer && tableElement.querySelectorAll('tbody tr').length >= 5) { // Check if controls exist, add if >= 5 rows
             const controls = document.createElement('div');
             controls.className = 'table-controls';
             controls.innerHTML = `
                 <button class="btn-export">Export CSV</button>
                 <button class="btn-copy">Copy Table</button>
             `;
             // Insert controls before the responsive wrapper
             tableElement.parentNode.parentNode.insertBefore(controls, tableElement.parentNode);

             controls.querySelector('.btn-export').addEventListener('click', () => {
                 exportTableToCSV(tableElement);
                 showToast('Table data exporting as CSV...', 'info');
             });
             controls.querySelector('.btn-copy').addEventListener('click', () => {
                 copyTableToClipboard(tableElement);
             });
              console.log("Added table controls.");
         } else if (controlsContainer) {
             console.log("Table controls already exist.");
         }

        // Add deck info (rows/columns) if not already present
        const infoContainer = tableElement.parentNode.parentNode.querySelector('.deck-info');
         if (!infoContainer) { // Check if info exists
             const deckInfo = document.createElement('div');
             deckInfo.className = 'deck-info';
             const rowCount = tableElement.querySelectorAll('tbody tr').length;
             const colCount = headerCells.length;
             deckInfo.innerHTML = `
                 <span class="deck-info-item">
                     <span class="material-symbols-rounded">table_rows</span>
                     ${rowCount} cards
                 </span>
                 <span class="deck-info-item">
                     <span class="material-symbols-rounded">view_column</span>
                     ${colCount} fields
                 </span>
             `;
              // Insert info before the responsive wrapper
             tableElement.parentNode.parentNode.insertBefore(deckInfo, tableElement.parentNode);
              console.log("Added deck info.");
         } else {
              console.log("Deck info already exists.");
         }

        // Animate table appearance
        tableElement.style.opacity = '0';
        tableElement.style.transform = 'translateY(10px)';
        setTimeout(() => {
             tableElement.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
             tableElement.style.opacity = '1';
             tableElement.style.transform = 'translateY(0)';
        }, 50); // Needs a slight delay
    }

    function enhanceChart(chartContainer) {
         if (!chartContainer || chartContainer.classList.contains('enhanced')) return;
         chartContainer.classList.add('enhanced');
         console.log("Enhancing chart container:", chartContainer.id);

         // Add chart controls if not already present
         if (!chartContainer.parentNode.querySelector('.chart-controls')) {
             const controlsDiv = document.createElement('div');
             controlsDiv.className = 'chart-controls';
             // Note: Chart type switching is complex with C3.js and requires access to the chart instance.
             // Placeholder for export button only for now.
             controlsDiv.innerHTML = `
                 <button class="chart-export" title="Export chart as image (feature coming soon)">
                      <span class="material-symbols-rounded">ios_share</span> Export
                 </button>
             `;

             // Insert controls after the chart container
             chartContainer.parentNode.insertBefore(controlsDiv, chartContainer.nextSibling);

             const exportBtn = controlsDiv.querySelector('.chart-export');
             if (exportBtn) {
                 exportBtn.addEventListener('click', () => {
                     // Placeholder - requires chart instance or library like html2canvas
                     showToast('Chart export feature is not yet implemented.', 'info');
                     // exportChartToImage(chartContainer);
                 });
             }
              console.log("Added chart controls for:", chartContainer.id);
         }

         // Animate chart appearance
         chartContainer.style.opacity = '0';
         chartContainer.style.transform = 'translateY(10px)';
         setTimeout(() => {
             chartContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
             chartContainer.style.opacity = '1';
             chartContainer.style.transform = 'translateY(0)';
         }, 50);
    }

    function sortTable(table, colNum) {
         if (!table) return;
         const tbody = table.querySelector('tbody');
         if (!tbody) return;

         const headerCell = table.querySelectorAll('th')[colNum];
         if (!headerCell) return;

         const currentSortDir = headerCell.getAttribute('data-sort-dir') || 'none';
         const newSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';

         // Reset sort attributes and icons on other headers
         table.querySelectorAll('th').forEach((th, index) => {
             if (index !== colNum) {
                 th.removeAttribute('data-sort-dir');
                 const icon = th.querySelector('.sort-icon');
                 if (icon) icon.textContent = 'unfold_more';
             }
         });

         // Set new sort direction on current header
         headerCell.setAttribute('data-sort-dir', newSortDir);
         const sortIcon = headerCell.querySelector('.sort-icon');
         if (sortIcon) {
             // Animate icon change
             sortIcon.style.transform = 'scale(0)';
             setTimeout(() => {
                 sortIcon.textContent = newSortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
                 sortIcon.style.transform = 'scale(1)';
             }, 150);
         }

         // Get rows to sort (excluding filtered ones if search is active)
         const rowsToSort = Array.from(tbody.querySelectorAll('tr:not(.filtered)'));

         rowsToSort.sort((a, b) => {
             let aValText = a.querySelectorAll('td')[colNum]?.textContent?.trim() || '';
             let bValText = b.querySelectorAll('td')[colNum]?.textContent?.trim() || '';

             // Attempt numeric conversion
             let aValNum = parseFloat(aValText);
             let bValNum = parseFloat(bValText);

             let compareResult;
             if (!isNaN(aValNum) && !isNaN(bValNum)) {
                 compareResult = aValNum - bValNum; // Numeric sort
             } else {
                  // Fallback to locale-aware string comparison
                 compareResult = aValText.localeCompare(bValText, undefined, { numeric: true, sensitivity: 'base' });
             }

             return newSortDir === 'asc' ? compareResult : -compareResult;
         });

         // Re-append sorted rows
         rowsToSort.forEach(row => tbody.appendChild(row));

         console.log(`Table sorted by column ${colNum} (${newSortDir})`);
         showToast(`Sorted by ${headerCell.textContent.replace(/[\u25B2\u25BC\u2195\s]+$/,'').trim()} (${newSortDir === 'asc' ? 'Ascending' : 'Descending'})`, 'info');
    }

    function exportTableToCSV(table) {
         if (!table) return;
         const rows = table.querySelectorAll('tr'); // Include header row
         let csv = [];

         rows.forEach(row => {
              // Skip filtered rows for data export
             if (row.classList.contains('filtered')) return;

             const cells = row.querySelectorAll('td, th');
             const rowData = Array.from(cells).map(cell => {
                 let text = cell.textContent?.trim() || '';
                 // Escape double quotes and wrap if necessary (contains comma, quote, or newline)
                 if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                     text = `"${text.replace(/"/g, '""')}"`;
                 }
                 return text;
             });
             csv.push(rowData.join(','));
         });

         if (csv.length === 0) {
             showToast("No data to export (table might be empty or filtered).", "warning");
             return;
         }

         const csvContent = csv.join('\n');
         const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
         const url = URL.createObjectURL(blob);

         const deckTitleElement = table.closest('.results-container')?.querySelector('h2');
         const baseFilename = deckTitleElement ? deckTitleElement.textContent.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'anki_data';
         const timestamp = new Date().toISOString().slice(0, 10);
         const filename = `${baseFilename}_${timestamp}.csv`;

         const link = document.createElement('a');
         link.setAttribute('href', url);
         link.setAttribute('download', filename);
         link.style.visibility = 'hidden';
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         URL.revokeObjectURL(url); // Clean up blob URL
         console.log(`Exported table data as ${filename}`);
    }

    function copyTableToClipboard(table) {
         if (!table) return;
         const rows = table.querySelectorAll('tr'); // Include header
         let text = '';

         rows.forEach(row => {
             // Skip filtered rows for copy
             if (row.classList.contains('filtered')) return;

             const cells = row.querySelectorAll('td, th');
             const rowData = Array.from(cells).map(cell => cell.textContent?.trim() || '');
             text += rowData.join('\t') + '\n'; // Use tab separator for spreadsheet pasting
         });

         if (!text) {
             showToast("No data to copy (table might be empty or filtered).", "warning");
             return;
         }

         navigator.clipboard.writeText(text).then(() => {
             showToast('Table data copied to clipboard!', 'success');
             // Optional: Visual feedback on the button or table
             const copyBtn = table.parentNode.parentNode.querySelector('.btn-copy');
             if (copyBtn) {
                 const originalText = copyBtn.textContent;
                 copyBtn.textContent = 'Copied!';
                 copyBtn.disabled = true;
                 setTimeout(() => {
                     copyBtn.textContent = originalText;
                     copyBtn.disabled = false;
                 }, 1500);
             }
         }).catch(err => {
             console.error('Failed to copy table to clipboard:', err);
             showToast('Failed to copy table. See console for details.', 'error');
         });
    }

    // --- Helper Functions ---
    function updateTimeDisplay() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        const timeDisplayEl = document.getElementById('current-time');
        if (timeDisplayEl) timeDisplayEl.textContent = formattedTime;
    }

    function setupFileInput(inputId, labelId) {
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId);
        if (input && label) {
             // Reset label on page load or setup
             label.textContent = 'No file chosen';
            input.addEventListener('change', function() {
                 // The actual file handling is done in handleFileInput via wrapped functions
                 // This just updates the label visually.
                 if (this.files && this.files.length > 0) {
                     label.textContent = this.files[0].name;
                 } else {
                     label.textContent = 'No file chosen';
                 }
            });
        }
    }

    function animateButtonPress(button) {
        if (!button) return;
        button.classList.add('pressed'); // Needs CSS for .pressed { transform: scale(0.95); }
        setTimeout(() => button.classList.remove('pressed'), 150);
    }

    function animateCounter(element, start, end, duration) {
        if (!element) return;
        let startTimeStamp = null;
        const step = (timestamp) => {
            if (!startTimeStamp) startTimeStamp = timestamp;
            const progress = Math.min((timestamp - startTimeStamp) / duration, 1);
            // Ease out function: progress * (2 - progress)
            const easedProgress = progress * (2 - progress);
            element.textContent = Math.floor(start + (end - start) * easedProgress);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = end; // Ensure final value is exact
            }
        };
        window.requestAnimationFrame(step);
    }

    // --- Toast Notifications ---
    function showToast(message, type = 'info', duration = 4000) {
         const toastContainer = document.body; // Or a dedicated container
         const existingToast = document.querySelector('.toast-notification');
         if(existingToast) existingToast.remove(); // Remove previous toast immediately

         const toast = document.createElement('div');
         toast.className = `toast-notification toast-${type}`; // Use toast- prefix for class

         let icon = 'info';
         if (type === 'success') icon = 'check_circle';
         else if (type === 'error') icon = 'error';
         else if (type === 'warning') icon = 'warning';

         toast.innerHTML = `
             <span class="material-symbols-rounded toast-icon">${icon}</span>
             <span class="toast-message">${message}</span>
             <button class="toast-close"><span class="material-symbols-rounded">close</span></button>
         `;

         toastContainer.appendChild(toast);

         // Trigger fade in animation
         requestAnimationFrame(() => {
             toast.classList.add('toast-visible');
         });

         const closeBtn = toast.querySelector('.toast-close');
         const dismissToast = () => {
             toast.classList.remove('toast-visible');
             // Remove from DOM after animation
             toast.addEventListener('transitionend', () => {
                 if (toast.parentElement) toast.remove();
             }, { once: true });
         };

         closeBtn.addEventListener('click', dismissToast);

         // Auto-dismiss
         setTimeout(dismissToast, duration);
     }

     function initDynamicStyles() {
         // Inject CSS for toasts, animations etc.
         const style = document.createElement('style');
         style.textContent = `
             /* Toast Notifications */
             .toast-notification {
                 position: fixed;
                 bottom: 20px; /* Position at bottom */
                 right: 20px;
                 display: flex;
                 align-items: center;
                 gap: 10px;
                 padding: 12px 16px;
                 background-color: var(--surface);
                 border-radius: var(--radius-md);
                 box-shadow: var(--shadow-lg);
                 z-index: 1001; /* Ensure above other elements */
                 transform: translateY(150%); /* Start off screen */
                 opacity: 0;
                 transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease; /* Bounce effect */
                 font-size: var(--font-sm);
                 max-width: 350px;
                 border-left: 4px solid var(--info); /* Default to info */
             }
             .toast-notification.toast-visible {
                 transform: translateY(0);
                 opacity: 1;
             }
             .toast-notification.toast-success { border-left-color: var(--accent); }
             .toast-notification.toast-error { border-left-color: var(--error); }
             .toast-notification.toast-warning { border-left-color: var(--warning); }
             .toast-notification.toast-info { border-left-color: var(--info); }

             .toast-icon { font-size: 20px; }
             .toast-success .toast-icon { color: var(--accent); }
             .toast-error .toast-icon { color: var(--error); }
             .toast-warning .toast-icon { color: var(--warning); }
             .toast-info .toast-icon { color: var(--info); }

             .toast-message { flex-grow: 1; color: var(--text-secondary); }
             .toast-close { background: none; border: none; cursor: pointer; padding: 2px; margin-left: auto; color: var(--text-tertiary); line-height: 1; }
             .toast-close:hover { color: var(--text-primary); }
             .toast-close .material-symbols-rounded { font-size: 18px; vertical-align: middle; }

             /* Button Press Animation */
             .pressed { transform: scale(0.96); transition: transform 0.1s ease; }

             /* Search Button Feedback */
             .searching { opacity: 0.7; cursor: wait; }

             /* Table Row Fade Animations */
             @keyframes fadeInTableRow { from { opacity: 0; transform: scaleY(0.8); } to { opacity: 1; transform: scaleY(1); } }
             @keyframes fadeOutTableRow { from { opacity: 1; } to { opacity: 0; } }
             /* Apply transform origin for better scaling effect */
             tbody tr { transform-origin: center top; }

             /* Loading Overlay */
             .loading-overlay { /* Styles from original code */ }
             .loading-overlay.visible { /* Styles from original code */ }
             .loading-container { /* Styles from original code */ }
             .loading-spinner { /* Styles from original code */ }
             .loading-text { /* Styles from original code */ }
             @keyframes spin { /* Styles from original code */ }

              /* Error Message Style */
             .error-message {
                 color: var(--error);
                 background-color: rgba(239, 68, 68, 0.1);
                 border: 1px solid rgba(239, 68, 68, 0.2);
                 padding: var(--spacing-md);
                 border-radius: var(--radius-md);
                 margin-top: var(--spacing-lg);
                 font-size: var(--font-sm);
             }

             /* Ensure clear button is aligned */
             .clear-search { align-items: center; justify-content: center; }
             .clear-search .material-symbols-rounded { vertical-align: middle; }

             /* Sort icon alignment */
             th .sort-icon { vertical-align: middle; margin-left: 4px; font-size: 16px; transition: transform 0.2s ease; }

         `;
         document.head.appendChild(style);
     }

    // --- Loading Indicator ---
    let loadingOverlay = null; // Cache the element
    function showLoading(message = 'Loading...') {
         if (!loadingOverlay) {
             loadingOverlay = document.createElement('div');
             loadingOverlay.className = 'loading-overlay';
             loadingOverlay.innerHTML = `
                 <div class="loading-container">
                     <div class="loading-spinner"></div>
                     <div class="loading-text">Loading...</div>
                 </div>
             `;
             document.body.appendChild(loadingOverlay);
         }
         loadingOverlay.querySelector('.loading-text').textContent = message;
         // Ensure it's visible
         requestAnimationFrame(() => {
             loadingOverlay.classList.add('visible');
         });
    }

    function hideLoading() {
         if (loadingOverlay) {
             loadingOverlay.classList.remove('visible');
             // Optional: Remove from DOM after transition, but caching is often fine
             // loadingOverlay.addEventListener('transitionend', () => {
             //     if (!loadingOverlay.classList.contains('visible') && loadingOverlay.parentElement) {
             //         loadingOverlay.parentElement.removeChild(loadingOverlay);
             //         loadingOverlay = null;
             //     }
             // }, { once: true });
         }
    }

    // --- Final Check ---
    console.log("Fuzzy-Anki UI Setup Complete.");
});
