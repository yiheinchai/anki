document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });
    
    // File input handling
    function setupFileInput(inputId, labelId) {
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId);
        
        if (input && label) {
            input.addEventListener('change', function() {
                label.textContent = this.files.length > 0 ? this.files[0].name : 'No file chosen';
            });
        }
    }
    
    setupFileInput('ankiFile', 'ankiFileName');
    setupFileInput('sqliteFile', 'sqliteFileName');
    
    // Search functionality
    let allFields = new Set(); // Store all field names from all decks
    let currentDeckFieldMap = {}; // Map deck index to field names
    
    // Search interface setup
    function setupSearchInterface() {
        const searchInterface = document.getElementById('search-interface');
        if (searchInterface) {
            searchInterface.style.display = 'block';
        }
        
        // Clear search button
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                document.getElementById('card-search').value = '';
                clearSearch();
            });
        }
        
        // Search button
        const searchBtn = document.getElementById('search-button');
        if (searchBtn) {
            searchBtn.addEventListener('click', performSearch);
        }
        
        // Search on Enter key
        const searchInput = document.getElementById('card-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
        
        // Update search fields dropdown
        updateSearchFields();
    }
    
    function updateSearchFields() {
        const searchFields = document.getElementById('search-fields');
        if (!searchFields) return;
        
        // Clear existing options except "All fields"
        while (searchFields.options.length > 1) {
            searchFields.remove(1);
        }
        
        // Add all unique fields from all decks
        allFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field;
            option.textContent = field;
            searchFields.appendChild(option);
        });
    }
    
    function performSearch() {
        const startTime = performance.now();
        
        const searchInput = document.getElementById('card-search');
        const searchValue = searchInput.value.trim();
        
        if (!searchValue) {
            clearSearch();
            return;
        }
        
        const caseSensitive = document.getElementById('case-sensitive').checked;
        const useRegex = document.getElementById('regex-search').checked;
        const searchField = document.getElementById('search-fields').value;
        
        // Create search regex or pattern
        let searchPattern;
        if (useRegex) {
            try {
                searchPattern = new RegExp(searchValue, caseSensitive ? 'g' : 'gi');
            } catch (e) {
                alert('Invalid regular expression. Please check your syntax.');
                return;
            }
        } else {
            searchPattern = caseSensitive ? searchValue : searchValue.toLowerCase();
        }
        
        // Get all tables
        const tables = document.querySelectorAll('table');
        let matchCount = 0;
        
        tables.forEach((table, tableIndex) => {
            const rows = table.querySelectorAll('tbody tr');
            const fieldIndices = getSearchFieldIndices(table, searchField, tableIndex);
            
            rows.forEach(row => {
                let rowMatches = false;
                const cells = row.querySelectorAll('td');
                
                // Search only in specified fields or in all fields
                fieldIndices.forEach(index => {
                    if (index >= cells.length) return;
                    
                    const cell = cells[index];
                    const cellText = cell.textContent;
                    let matches = false;
                    
                    if (useRegex) {
                        searchPattern.lastIndex = 0; // Reset regex index
                        matches = searchPattern.test(cellText);
                        
                        // Highlight matches
                        if (matches) {
                            searchPattern.lastIndex = 0; // Reset regex index again
                            cell.innerHTML = cellText.replace(searchPattern, 
                                match => `<span class="search-highlight">${match}</span>`);
                        }
                    } else {
                        const textToSearch = caseSensitive ? cellText : cellText.toLowerCase();
                        matches = textToSearch.includes(searchPattern);
                        
                        // Highlight matches
                        if (matches) {
                            // Escape special regex characters in the search term
                            const escapedSearchPattern = searchPattern.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const highlightRegex = new RegExp(escapedSearchPattern, caseSensitive ? 'g' : 'gi');
                            cell.innerHTML = cellText.replace(highlightRegex, 
                                match => `<span class="search-highlight">${match}</span>`);
                        }
                    }
                    
                    if (matches) rowMatches = true;
                });
                
                // Show or hide row based on matches
                if (rowMatches) {
                    row.classList.remove('filtered');
                    matchCount++;
                } else {
                    row.classList.add('filtered');
                }
            });
        });
        
        // Update stats
        const endTime = performance.now();
        document.getElementById('results-count').textContent = matchCount;
        document.getElementById('search-time').textContent = Math.round(endTime - startTime);
    }
    
    function clearSearch() {
        // Get all tables
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                // Show all rows
                row.classList.remove('filtered');
                
                // Remove highlights
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.innerHTML = cell.textContent;
                });
            });
        });
        
        // Reset stats
        document.getElementById('results-count').textContent = '0';
        document.getElementById('search-time').textContent = '0';
    }
    
    function getSearchFieldIndices(table, fieldName, tableIndex) {
        if (fieldName === 'all') {
            // Return all column indices
            const headerCells = table.querySelectorAll('th');
            return Array.from(headerCells).map((_, index) => index);
        }
        
        // Get field indices for the specific field
        const headerCells = table.querySelectorAll('th');
        const indices = [];
        
        headerCells.forEach((cell, index) => {
            if (cell.textContent === fieldName) {
                indices.push(index);
            }
        });
        
        return indices;
    }
    
    // Observe deck loading to set up search
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                // If tables were added to the DOM
                const hasNewTables = Array.from(mutation.addedNodes).some(node => 
                    node.tagName === 'TABLE' || (node.querySelector && node.querySelector('table')));
                
                if (hasNewTables) {
                    enhanceTables();
                    enhanceCharts();
                    
                    // Collect field names for search
                    collectFieldNames();
                    
                    // Show search interface if any tables are present
                    if (document.querySelector('table')) {
                        setupSearchInterface();
                    }
                }
            }
        });
    });
    
    const ankiEl = document.getElementById('anki');
    const reviewsEl = document.getElementById('reviews');
    
    if (ankiEl) observer.observe(ankiEl, { childList: true, subtree: true });
    if (reviewsEl) observer.observe(reviewsEl, { childList: true, subtree: true });
    
    // Collect field names from all tables for search
    function collectFieldNames() {
        const tables = document.querySelectorAll('table:not(.processed-fields)');
        
        tables.forEach((table, tableIndex) => {
            const headerCells = table.querySelectorAll('th');
            const fieldNames = Array.from(headerCells).map(cell => cell.textContent);
            
            // Add field names to the set of all fields
            fieldNames.forEach(field => allFields.add(field));
            
            // Store field names for this table
            currentDeckFieldMap[tableIndex] = fieldNames;
            
            // Mark table as processed
            table.classList.add('processed-fields');
        });
        
        // Update search fields dropdown
        updateSearchFields();
    }
    
    // Table enhancements
    function enhanceTables() {
        const tables = document.querySelectorAll('table:not(.enhanced)');
        
        tables.forEach(table => {
            table.classList.add('enhanced');
            
            // Add responsive wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
            
            // Add sorting capability
            const headerCells = table.querySelectorAll('th');
            headerCells.forEach(cell => {
                cell.addEventListener('click', () => {
                    sortTable(table, Array.from(headerCells).indexOf(cell));
                });
                
                // Add sort icon
                const sortIcon = document.createElement('span');
                sortIcon.className = 'sort-icon material-icons';
                sortIcon.textContent = 'unfold_more';
                sortIcon.style.fontSize = '14px';
                cell.appendChild(sortIcon);
            });
            
            // Add export options if large table
            if (table.querySelectorAll('tr').length > 10) {
                const controls = document.createElement('div');
                controls.className = 'table-controls';
                controls.innerHTML = `
                    <button class="btn-export">Export CSV</button>
                    <button class="btn-copy">Copy to Clipboard</button>
                `;
                table.parentNode.insertBefore(controls, table);
                
                // Attach export functionality
                controls.querySelector('.btn-export').addEventListener('click', () => {
                    exportTableToCSV(table);
                });
                
                controls.querySelector('.btn-copy').addEventListener('click', () => {
                    copyTableToClipboard(table);
                });
            }
            
            // Add table info
            const deckInfo = document.createElement('div');
            deckInfo.className = 'deck-info';
            const rowCount = table.querySelectorAll('tbody tr').length;
            const colCount = table.querySelectorAll('th').length;
            
            deckInfo.innerHTML = `
                <span class="deck-info-item">
                    <span class="material-icons" style="font-size: 12px; vertical-align: middle;">table_rows</span>
                    ${rowCount} cards
                </span>
                <span class="deck-info-item">
                    <span class="material-icons" style="font-size: 12px; vertical-align: middle;">view_column</span>
                    ${colCount} fields
                </span>
            `;
            
            table.parentNode.insertBefore(deckInfo, table);
        });
    }
    
    // Chart enhancements
    function enhanceCharts() {
        const chartContainers = document.querySelectorAll('[id^="chart"], [id^="histogram"], [id^="scatter"]');
        chartContainers.forEach(container => {
            if (!container.parentNode.querySelector('.chart-controls')) {
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'chart-controls';
                controlsDiv.innerHTML = `
                    <select class="chart-type-selector">
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="scatter">Scatter Plot</option>
                    </select>
                    <button class="chart-export">Export</button>
                `;
                
                const heading = container.previousElementSibling;
                if (heading && (heading.tagName === 'H3' || heading.tagName === 'H4')) {
                    heading.parentNode.insertBefore(controlsDiv, heading.nextSibling);
                }
            }
        });
    }
    
    // Table sorting
    function sortTable(table, colNum) {
        const sortDirection = table.getAttribute('data-sort-dir') === 'asc' ? 'desc' : 'asc';
        table.setAttribute('data-sort-dir', sortDirection);
        
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            let aVal = a.querySelectorAll('td')[colNum]?.textContent.trim();
            let bVal = b.querySelectorAll('td')[colNum]?.textContent.trim();
            
            // Handle numeric sorting
            if (!isNaN(aVal) && !isNaN(bVal)) {
                return sortDirection === 'asc' 
                    ? parseFloat(aVal) - parseFloat(bVal)
                    : parseFloat(bVal) - parseFloat(aVal);
            }
            
            // Try date sorting
            const aDate = new Date(aVal);
            const bDate = new Date(bVal);
            if (!isNaN(aDate) && !isNaN(bDate)) {
                return sortDirection === 'asc' 
                    ? aDate - bDate
                    : bDate - aDate;
            }
            
            // Fall back to string sorting
            return sortDirection === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        });
        
        rows.forEach(row => tbody.appendChild(row));
        
        // Update sort icons
        const headers = table.querySelectorAll('th');
        headers.forEach((header, idx) => {
            const icon = header.querySelector('.sort-icon');
            if (icon) {
                icon.textContent = idx === colNum
                    ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward')
                    : 'unfold_more';
            }
        });
    }
    
    // Export table to CSV
    function exportTableToCSV(table) {
        const rows = table.querySelectorAll('tr');
        let csv = [];
        
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td, th');
            const row = [];
            
            for (let j = 0; j < cells.length; j++) {
                let text = cells[j].textContent.trim();
                // Escape quotes and wrap in quotes if contains comma
                if (text.includes(',') || text.includes('"')) {
                    text = '"' + text.replace(/"/g, '""') + '"';
                }
                row.push(text);
            }
            
            csv.push(row.join(','));
        }
        
        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'anki_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Copy table to clipboard
    function copyTableToClipboard(table) {
        const rows = table.querySelectorAll('tr');
        let text = '';
        
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td, th');
            const rowData = [];
            
            for (let j = 0; j < cells.length; j++) {
                rowData.push(cells[j].textContent.trim());
            }
            
            text += rowData.join('\t') + '\n';
        }
        
        navigator.clipboard.writeText(text).then(() => {
            alert('Table copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy table:', err);
        });
    }
    
    // Check if we need to add search functionality to the `tabulate` function in apkg.js
    // We'll need to modify the original tabulate function
    window.originalTabulate = window.tabulate || null;
    
    // We'll inject our modified tabulate function after the original one loads
    function injectSearchAwareTabulate() {
        if (window.originalTabulate === null && window.tabulate) {
            // Store the original function
            window.originalTabulate = window.tabulate;
            
            // Replace with our version that's aware of search
            window.tabulate = function(datatable, columns, containerString) {
                // Call original function to create the table
                const table = window.originalTabulate(datatable, columns, containerString);
                
                // After table is created, collect field names for search
                collectFieldNames();
                
                // Show search interface
                setupSearchInterface();
                
                return table;
            };
        }
        
        // Keep checking until we can inject our function
        if (window.originalTabulate === null) {
            setTimeout(injectSearchAwareTabulate, 100);
        }
    }
    
    // Start the injection process
    injectSearchAwareTabulate();
    
    // Initialize the deck loading hooks by modifying the ankiBinaryToTable function
    const originalAnkiBinaryToTable = window.ankiBinaryToTable;
    if (originalAnkiBinaryToTable) {
        window.ankiBinaryToTable = function(ankiArray, options) {
            // Call the original function
            originalAnkiBinaryToTable(ankiArray, options);
            
            // Show search interface after data is loaded
            setTimeout(() => {
                if (document.querySelector('table')) {
                    setupSearchInterface();
                }
            }, 500);
        };
    }
});

// Add these functions to the apkg.js file to properly handle search functionality
function enhanceApkgJS() {
    const scriptContent = `
        // Store the original tabulate function
        var originalTabulate = tabulate;
        
        // Override the tabulate function to add search capabilities
        tabulate = function(datatable, columns, containerString) {
            // Call the original function
            var table = originalTabulate(datatable, columns, containerString);
            
            // Make the search interface visible if it exists
            var searchInterface = document.getElementById('search-interface');
            if (searchInterface) {
                searchInterface.style.display = 'block';
            }
            
            return table;
        };
    `;
    
    // Create a script element and add it to the document
    const script = document.createElement('script');
    script.textContent = scriptContent;
    document.body.appendChild(script);
}

// Run the enhancement once the page is fully loaded
window.addEventListener('load', enhanceApkgJS);
