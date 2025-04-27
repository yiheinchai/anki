document.addEventListener('DOMContentLoaded', function() {
    // Update time display
    function updateTimeDisplay() {
        const now = new Date();
        const formattedTime = now.toISOString().slice(0, 19).replace('T', ' ');
        document.getElementById('current-time').textContent = formattedTime;
    }
    
    // Update time every minute
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 60000);

    // Tab switching with smooth transitions
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Add exit animation to current active tab
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) {
                activeTab.style.animation = 'fadeOut 0.15s ease forwards';
                
                setTimeout(() => {
                    // After exit animation completes
                    tabBtns.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => {
                        c.classList.remove('active');
                        c.style.animation = '';
                    });
                    
                    btn.classList.add('active');
                    const newActiveTab = document.getElementById(`${btn.dataset.tab}-tab`);
                    newActiveTab.classList.add('active');
                    newActiveTab.style.animation = 'fadeIn 0.2s ease forwards';
                }, 150);
            } else {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
            }
        });
    });
    
    // File input handling with visual feedback
    function setupFileInput(inputId, labelId) {
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId);
        
        if (input && label) {
            input.addEventListener('change', function() {
                if (this.files.length > 0) {
                    label.textContent = this.files[0].name;
                    label.parentElement.classList.add('has-file');
                    
                    // Show visual feedback
                    const successFeedback = document.createElement('div');
                    successFeedback.className = 'file-feedback success';
                    successFeedback.innerHTML = '<span class="material-symbols-rounded">check_circle</span><span>File selected</span>';
                    
                    const existingFeedback = label.parentElement.querySelector('.file-feedback');
                    if (existingFeedback) {
                        label.parentElement.removeChild(existingFeedback);
                    }
                    
                    label.parentElement.appendChild(successFeedback);
                    
                    // Animate feedback
                    setTimeout(() => {
                        successFeedback.style.opacity = '1';
                        successFeedback.style.transform = 'translateY(0)';
                    }, 10);
                    
                    // Remove feedback after delay
                    setTimeout(() => {
                        successFeedback.style.opacity = '0';
                        successFeedback.style.transform = 'translateY(-10px)';
                        
                        setTimeout(() => {
                            if (successFeedback.parentElement) {
                                successFeedback.parentElement.removeChild(successFeedback);
                            }
                        }, 300);
                    }, 3000);
                } else {
                    label.textContent = 'No file chosen';
                    label.parentElement.classList.remove('has-file');
                }
            });
        }
    }
    
    setupFileInput('ankiFile', 'ankiFileName');
    setupFileInput('sqliteFile', 'sqliteFileName');
    
    // Number input increment/decrement
    const numberInputs = document.querySelectorAll('.number-input-wrapper');
    numberInputs.forEach(wrapper => {
        const input = wrapper.querySelector('input[type="number"]');
        const upBtn = wrapper.querySelector('.number-up');
        const downBtn = wrapper.querySelector('.number-down');
        
        if (input && upBtn && downBtn) {
            upBtn.addEventListener('click', () => {
                input.stepUp();
                input.dispatchEvent(new Event('change'));
                animateButtonPress(upBtn);
            });
            
            downBtn.addEventListener('click', () => {
                input.stepDown();
                input.dispatchEvent(new Event('change'));
                animateButtonPress(downBtn);
            });
        }
    });
    
    function animateButtonPress(button) {
        button.classList.add('pressed');
        setTimeout(() => button.classList.remove('pressed'), 150);
    }
    
    // Toast notification system
    function showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        });
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        
        // Icon based on type
        let icon = 'info';
        if (type === 'success') icon = 'check_circle';
        else if (type === 'error') icon = 'error';
        else if (type === 'warning') icon = 'warning';
        
        toast.innerHTML = `
            <span class="material-symbols-rounded">${icon}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close"><span class="material-symbols-rounded">close</span></button>
        `;
        
        // Append to body
        document.body.appendChild(toast);
        
        // Show toast with animation
        setTimeout(() => toast.classList.add('toast-visible'), 10);
        
        // Add close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('toast-visible');
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        });
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.classList.remove('toast-visible');
                toast.classList.add('toast-exit');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
    
    // Add toast style dynamically
    const toastStyle = document.createElement('style');
    toastStyle.textContent = `
        .toast-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background-color: var(--surface);
            border-left: 4px solid var(--primary);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 100;
            transform: translateX(120%);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            font-size: var(--font-sm);
            max-width: 320px;
        }
        
        .toast-notification.toast-visible {
            transform: translateX(0);
            opacity: 1;
        }
        
        .toast-notification.toast-exit {
            transform: translateX(120%);
            opacity: 0;
        }
        
        .toast-notification.success {
            border-left-color: var(--accent);
        }
        
        .toast-notification.error {
            border-left-color: var(--error);
        }
        
        .toast-notification.warning {
            border-left-color: var(--warning);
        }
        
        .toast-notification .material-symbols-rounded {
            font-size: 18px;
            color: var(--primary);
        }
        
        .toast-notification.success .material-symbols-rounded {
            color: var(--accent);
        }
        
        .toast-notification.error .material-symbols-rounded {
            color: var(--error);
        }
        
        .toast-notification.warning .material-symbols-rounded {
            color: var(--warning);
        }
        
        .toast-message {
            flex: 1;
        }
        
        .toast-close {
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            padding: 2px;
            color: var(--text-tertiary);
        }
        
        .toast-close:hover {
            color: var(--text-primary);
        }
        
        .toast-close .material-symbols-rounded {
            font-size: 16px;
            color: inherit;
        }
        
        /* Animation for button press */
        .pressed {
            transform: scale(0.95);
        }
        
        /* File feedback styles */
        .file-feedback {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: var(--font-xs);
            margin-top: 4px;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .file-feedback.success {
            color: var(--accent);
        }
        
        .file-feedback.error {
            color: var(--error);
        }
        
        .file-feedback .material-symbols-rounded {
            font-size: 14px;
        }
        
        /* Search ripple effect */
        .search-ripple {
            position: absolute;
            background-color: rgba(99, 102, 241, 0.1);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(1);
                opacity: 0;
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(4px); }
        }
    `;
    document.head.appendChild(toastStyle);
    
    // Search functionality
    let allFields = new Set(); // Store all field names from all decks
    let currentDeckFieldMap = {}; // Map deck index to field names
    
    // Search interface setup with animations
    function setupSearchInterface() {
        const searchInterface = document.getElementById('search-interface');
        if (searchInterface && searchInterface.style.display === 'none') {
            // Fade in the search interface
            searchInterface.style.display = 'block';
            searchInterface.style.opacity = '0';
            searchInterface.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                searchInterface.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                searchInterface.style.opacity = '1';
                searchInterface.style.transform = 'translateY(0)';
            }, 10);
            
            // Focus on search input after animation
            setTimeout(() => {
                const searchInput = document.getElementById('card-search');
                if (searchInput) searchInput.focus();
            }, 300);
        }
        
        // Clear search button
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                document.getElementById('card-search').value = '';
                clearSearch();
                
                // Visual feedback
                this.classList.add('active');
                setTimeout(() => this.classList.remove('active'), 300);
            });
        }
        
        // Search button with animation
        const searchBtn = document.getElementById('search-button');
        if (searchBtn) {
            searchBtn.addEventListener('click', function() {
                // Add animation
                this.classList.add('searching');
                setTimeout(() => {
                    performSearch();
                    this.classList.remove('searching');
                }, 300);
            });
        }
        
        // Search on Enter key with ripple effect
        const searchInput = document.getElementById('card-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    // Create ripple effect
                    const ripple = document.createElement('span');
                    ripple.className = 'search-ripple';
                    this.parentElement.appendChild(ripple);
                    
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height) * 2;
                    
                    ripple.style.width = `${size}px`;
                    ripple.style.height = `${size}px`;
                    ripple.style.left = `${e.clientX - rect.left - size/2}px`;
                    ripple.style.top = `${e.clientY - rect.top - size/2}px`;
                    
                    ripple.classList.add('active');
                    
                    setTimeout(() => {
                        ripple.remove();
                        performSearch();
                    }, 300);
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
                // Create a toast notification for error
                showToast('Invalid regular expression. Please check your syntax.', 'error');
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
                
                // Show or hide row based on matches with smooth animation
                if (rowMatches) {
                    if (row.classList.contains('filtered')) {
                        row.style.animation = 'fadeIn 0.3s ease forwards';
                        setTimeout(() => {
                            row.classList.remove('filtered');
                            row.style.animation = '';
                        }, 300);
                    }
                    matchCount++;
                } else {
                    if (!row.classList.contains('filtered')) {
                        row.style.animation = 'fadeOut 0.3s ease forwards';
                        setTimeout(() => {
                            row.classList.add('filtered');
                            row.style.animation = '';
                        }, 300);
                    }
                }
            });
        });
        
        // Update stats with counter animation
        const endTime = performance.now();
        animateCounter('results-count', 0, matchCount, 500);
        document.getElementById('search-time').textContent = Math.round(endTime - startTime);
        
        // Show toast notification with results
        if (matchCount > 0) {
            showToast(`Found ${matchCount} matching card${matchCount !== 1 ? 's' : ''}`, 'success');
        } else {
            showToast('No matches found. Try different search terms.', 'warning');
        }
    }
    
    function animateCounter(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let startTime = null;
        
        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            // Easing function for smooth counting
            const easeOutQuad = t => t * (2 - t);
            const easedProgress = easeOutQuad(percentage);
            
            const currentCount = Math.floor(start + (end - start) * easedProgress);
            element.textContent = currentCount;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = end;
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    function clearSearch() {
        // Get all tables
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                // Show all rows with smooth animation
                if (row.classList.contains('filtered')) {
                    row.style.animation = 'fadeIn 0.3s ease forwards';
                    setTimeout(() => {
                        row.classList.remove('filtered');
                        row.style.animation = '';
                    }, 300);
                }
                
                // Remove highlights
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.innerHTML = cell.textContent;
                });
            });
        });
        
        // Reset stats with animation
        animateCounter('results-count', parseInt(document.getElementById('results-count').textContent), 0, 300);
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
                sortIcon.className = 'material-symbols-rounded sort-icon';
                sortIcon.textContent = 'unfold_more';
                sortIcon.style.fontSize = '16px';
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
                    showToast('Table exported to CSV', 'success');
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
                    <span class="material-symbols-rounded">table_rows</span>
                    ${rowCount} cards
                </span>
                <span class="deck-info-item">
                    <span class="material-symbols-rounded">view_column</span>
                    ${colCount} fields
                </span>
            `;
            
            table.parentNode.insertBefore(deckInfo, table);
            
            // Animate table appearance
            table.style.opacity = '0';
            table.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                table.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                table.style.opacity = '1';
                table.style.transform = 'translateY(0)';
            }, 100);
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
                
                // Export chart functionality
                const exportBtn = controlsDiv.querySelector('.chart-export');
                if (exportBtn) {
                    exportBtn.addEventListener('click', () => {
                        exportChartToImage(container);
                    });
                }
                
                // Chart type selector functionality
                const typeSelector = controlsDiv.querySelector('.chart-type-selector');
                if (typeSelector) {
                    typeSelector.addEventListener('change', function() {
                        updateChartType(container, this.value);
                    });
                }
                
                // Animate chart appearance
                container.style.opacity = '0';
                container.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    container.style.opacity = '1';
                    container.style.transform = 'translateY(0)';
                }, 100);
            }
        });
    }
    
    // Export chart to image
    function exportChartToImage(chartContainer) {
        // This is a placeholder for chart export functionality
        // In a real implementation, you'd use a library like html2canvas or leverage C3's export functionality
        showToast('Chart export feature coming soon!', 'info');
    }
    
    // Update chart type
    function updateChartType(chartContainer, chartType) {
        // This is a placeholder for chart type changing functionality
        // In a real implementation, you'd use C3's API to transform the chart
        showToast(`Changing chart to ${chartType} type`, 'info');
    }
    
    // Table sorting with sleek animation
    function sortTable(table, colNum) {
        const sortDirection = table.getAttribute('data-sort-dir') === 'asc' ? 'desc' : 'asc';
        table.setAttribute('data-sort-dir', sortDirection);
        
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr:not(.filtered)'));
        
        // Save row heights before reordering
        const rowHeights = rows.map(row => row.offsetHeight);
        
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
        
        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();
        rows.forEach(row => fragment.appendChild(row));
        
        // Apply the fragment with all sorted rows
        tbody.appendChild(fragment);
        
        // Update sort icons with animation
        const headers = table.querySelectorAll('th');
        headers.forEach((header, idx) => {
            const icon = header.querySelector('.sort-icon');
            if (icon) {
                if (idx === colNum) {
                    icon.style.transform = 'scale(0)';
                    setTimeout(() => {
                        icon.textContent = sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
                        icon.style.transform = 'scale(1)';
                    }, 150);
                } else {
                    icon.textContent = 'unfold_more';
                }
            }
        });
        
        // Show toast notification
        showToast(`Sorted by ${headers[colNum].textContent.replace('arrow_upward', '').replace('arrow_downward', '').replace('unfold_more', '').trim()} (${sortDirection === 'asc' ? 'ascending' : 'descending'})`, 'info');
    }
    
    // Export table to CSV with animation
    function exportTableToCSV(table) {
        const rows = table.querySelectorAll('tr:not(.filtered)');
        let csv = [];
        
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td, th');
            const row = [];
            
            for (let j = 0; j < cells.length; j++) {
                let text = cells[j].textContent.trim();
                // Escape quotes and wrap in quotes if contains comma
                if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                    text = '"' + text.replace(/"/g, '""') + '"';
                }
                row.push(text);
            }
            
            csv.push(row.join(','));
        }
        
        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Create filename from deck title or date
        const deckTitle = table.closest('.results-container')?.querySelector('h2')?.textContent || 'anki-deck';
        const safeTitle = deckTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `${safeTitle}-${timestamp}.csv`;
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        
        // Add download animation
        const downloadAnimation = document.createElement('div');
        downloadAnimation.className = 'download-animation';
        downloadAnimation.innerHTML = `
            <div class="download-circle">
                <span class="material-symbols-rounded">download</span>
            </div>
        `;
        document.body.appendChild(downloadAnimation);
        
        setTimeout(() => {
            downloadAnimation.classList.add('animate-download');
            
            setTimeout(() => {
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => {
                    downloadAnimation.classList.add('fade-out');
                    setTimeout(() => {
                        document.body.removeChild(downloadAnimation);
                    }, 500);
                }, 1000);
            }, 500);
        }, 100);
    }
    
    // Add download animation style
    const downloadAnimStyle = document.createElement('style');
    downloadAnimStyle.textContent = `
        .download-animation {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(3px);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .download-animation.animate-download {
            opacity: 1;
        }
        
        .download-animation.fade-out {
            opacity: 0;
        }
        
        .download-circle {
            width: 80px;
            height: 80px;
            background-color: var(--surface);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--shadow-lg);
            animation: pulse 1.5s infinite ease-in-out, bounce 0.5s ease-out;
        }
        
        .download-circle .material-symbols-rounded {
            font-size: 32px;
            color: var(--primary);
            animation: download 1.5s infinite ease-in-out;
        }
        
        @keyframes pulse {
            0% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5);
            }
            70% {
                transform: scale(1.05);
                box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
            }
            100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
            }
        }
        
        @keyframes bounce {
            0% {
                transform: scale(0.5);
                opacity: 0;
            }
            50% {
                transform: scale(1.05);
            }
            70% {
                transform: scale(0.95);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        @keyframes download {
            0% {
                transform: translateY(-5px);
                opacity: 0.7;
            }
            50% {
                transform: translateY(5px);
                opacity: 1;
            }
            100% {
                transform: translateY(-5px);
                opacity: 0.7;
            }
        }
    `;
    document.head.appendChild(downloadAnimStyle);
    
    // Copy table to clipboard with visual feedback
    function copyTableToClipboard(table) {
        const rows = table.querySelectorAll('tr:not(.filtered)');
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
            showToast('Table copied to clipboard', 'success');
            
            // Visual feedback - flash the table
            table.style.transition = 'background-color 0.3s ease';
            table.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
            setTimeout(() => {
                table.style.backgroundColor = '';
            }, 300);
        }).catch(err => {
            showToast('Failed to copy: ' + err, 'error');
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
            // Show loading indicator
            showLoading();
            
            // Call the original function
            originalAnkiBinaryToTable(ankiArray, options);
            
            // Hide loading and show search interface after data is loaded
            setTimeout(() => {
                hideLoading();
                if (document.querySelector('table')) {
                    setupSearchInterface();
                    showToast('Deck loaded successfully!', 'success');
                }
            }, 800);
        };
    }
    
    // Loading indicator functions
    function showLoading() {
        // Create loading overlay if not exists
        if (!document.querySelector('.loading-overlay')) {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading your Anki deck...</div>
                </div>
            `;
            
            document.body.appendChild(loadingOverlay);
            
            // Add loading styles
            const loadingStyle = document.createElement('style');
            loadingStyle.textContent = `
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(5px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .loading-overlay.visible {
                    opacity: 1;
                }
                
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    background-color: var(--surface);
                    padding: 32px;
                    border-radius: 16px;
                    box-shadow: var(--shadow-lg);
                    max-width: 80%;
                }
                
                .loading-spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid rgba(99, 102, 241, 0.1);
                    border-radius: 50%;
                    border-top-color: var(--primary);
                    animation: spin 1s linear infinite;
                }
                
                .loading-text {
                    font-size: var(--font-md);
                    font-weight: 500;
                    color: var(--text-secondary);
                }
                
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `;
            
            document.head.appendChild(loadingStyle);
            
            // Show with animation
            setTimeout(() => {
                loadingOverlay.classList.add('visible');
            }, 10);
        } else {
            document.querySelector('.loading-overlay').classList.add('visible');
        }
    }
    
    function hideLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('visible');
            
            // Remove from DOM after animation
            setTimeout(() => {
                if (loadingOverlay.parentElement) {
                    loadingOverlay.parentElement.removeChild(loadingOverlay);
                }
            }, 300);
        }
    }
    
    // Add these functions to the apkg.js file to properly handle search functionality
    enhanceApkgJS();
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
window.addEventListener('load', function() {
    enhanceApkgJS();
    
    // Set the current user in the UI
    const username = 'yiheinchai';
    const userInitials = username.split(/\s+/).map(word => word[0].toUpperCase()).join('');
    
    const avatarElement = document.querySelector('.avatar span');
    if (avatarElement) avatarElement.textContent = userInitials;
    
    const usernameElement = document.querySelector('.username');
    if (usernameElement) usernameElement.textContent = username;
    
    // Set current time
    updateTimeDisplay();
});

// Update time function
function updateTimeDisplay() {
    const now = new Date();
    
    // Format: YYYY-MM-DD HH:MM:SS
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    
    const timeDisplay = document.getElementById('current-time');
    if (timeDisplay) timeDisplay.textContent = formattedTime;
}
