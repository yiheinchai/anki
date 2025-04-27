document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            const tabId = `${btn.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Display filename when file is selected
    const ankiFileInput = document.getElementById('ankiFile');
    const ankiFileName = document.getElementById('ankiFileName');
    
    if (ankiFileInput) {
        ankiFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                ankiFileName.textContent = this.files[0].name;
            } else {
                ankiFileName.textContent = 'No file chosen';
            }
        });
    }
    
    const sqliteFileInput = document.getElementById('sqliteFile');
    const sqliteFileName = document.getElementById('sqliteFileName');
    
    if (sqliteFileInput) {
        sqliteFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                sqliteFileName.textContent = this.files[0].name;
            } else {
                sqliteFileName.textContent = 'No file chosen';
            }
        });
    }
    
    // Enhance tables and results after they're created
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                enhanceTables();
                enhanceCharts();
            }
        });
    });
    
    observer.observe(document.getElementById('anki'), { childList: true, subtree: true });
    observer.observe(document.getElementById('reviews'), { childList: true, subtree: true });
    
    // Apply styling to dynamically created tables and charts
    function enhanceTables() {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            if (!table.classList.contains('enhanced')) {
                table.classList.add('enhanced');
                
                // Add responsive wrapper
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
                
                // Add sorting capability
                const headerCells = table.querySelectorAll('th');
                headerCells.forEach(cell => {
                    cell.addEventListener('click', function() {
                        sortTable(table, Array.from(headerCells).indexOf(cell));
                    });
                    
                    // Add sort icon
                    const sortIcon = document.createElement('span');
                    sortIcon.className = 'sort-icon material-icons';
                    sortIcon.textContent = 'unfold_more';
                    cell.appendChild(sortIcon);
                });
            }
        });
    }
    
    function enhanceCharts() {
        // Add a filter dropdown to each chart section
        const chartContainers = document.querySelectorAll('#chart, #histogram, #scatter-rep-lapse, #scatter-norm-rep-lapse');
        chartContainers.forEach(container => {
            if (!container.parentNode.querySelector('.chart-controls')) {
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'chart-controls';
                
                const heading = container.previousElementSibling;
                if (heading && (heading.tagName === 'H3' || heading.tagName === 'H4')) {
                    heading.parentNode.insertBefore(controlsDiv, heading.nextSibling);
                }
            }
        });
    }
    
    // Table sorting function
    function sortTable(table, colNum) {
        const sortDirection = table.getAttribute('data-sort-dir') === 'asc' ? 'desc' : 'asc';
        table.setAttribute('data-sort-dir', sortDirection);
        
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        // Sort the rows
        rows.sort((a, b) => {
            const aCol = a.querySelectorAll('td')[colNum]?.textContent.trim();
            const bCol = b.querySelectorAll('td')[colNum]?.textContent.trim();
            
            // Handle numeric sorting
            if (!isNaN(aCol) && !isNaN(bCol)) {
                return sortDirection === 'asc' 
                    ? parseFloat(aCol) - parseFloat(bCol)
                    : parseFloat(bCol) - parseFloat(aCol);
            }
            
            // Handle string sorting
            return sortDirection === 'asc'
                ? aCol.localeCompare(bCol)
                : bCol.localeCompare(aCol);
        });
        
        // Update the DOM
        rows.forEach(row => tbody.appendChild(row));
        
        // Update sort icons
        const headers = table.querySelectorAll('th');
        headers.forEach((header, idx) => {
            const icon = header.querySelector('.sort-icon');
            if (idx === colNum) {
                icon.textContent = sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
            } else {
                icon.textContent = 'unfold_more';
            }
        });
    }
    
    // Add responsive styles for tables
    const style = document.createElement('style');
    style.textContent = `
        .table-responsive {
            overflow-x: auto;
            margin-bottom: var(--spacing-lg);
        }
        
        .sort-icon {
            font-size: 16px;
            margin-left: 4px;
            vertical-align: middle;
            opacity: 0.5;
        }
        
        th:hover .sort-icon {
            opacity: 1;
        }
        
        .chart-controls {
            display: flex;
            justify-content: flex-end;
            margin-bottom: var(--spacing-md);
        }
        
        @media (max-width: 767px) {
            table {
                font-size: 12px;
            }
            
            th, td {
                padding: 8px;
            }
        }
    `;
    document.head.appendChild(style);
});
