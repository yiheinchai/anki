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
    
    // Dynamic table enhancements
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                enhanceTables();
                enhanceCharts();
            }
        });
    });
    
    const ankiEl = document.getElementById('anki');
    const reviewsEl = document.getElementById('reviews');
    
    if (ankiEl) observer.observe(ankiEl, { childList: true, subtree: true });
    if (reviewsEl) observer.observe(reviewsEl, { childList: true, subtree: true });
    
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
    
    // Add styles for the additional controls
    const style = document.createElement('style');
    style.textContent = `
        .table-responsive {
            position: relative;
        }
        
        .table-controls {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-bottom: 4px;
        }
        
        .btn-export, .btn-copy, .chart-export {
            padding: 2px 8px;
            font-size: 11px;
            background-color: #f1f3f4;
            border: 1px solid #dadce0;
            border-radius: 2px;
            cursor: pointer;
        }
        
        .btn-export:hover, .btn-copy:hover, .chart-export:hover {
            background-color: #e8eaed;
        }
        
        .chart-type-selector {
            padding: 2px 4px;
            font-size: 11px;
            border: 1px solid #dadce0;
            border-radius: 2px;
            background-color: #f1f3f4;
        }
    `;
    document.head.appendChild(style);
});
