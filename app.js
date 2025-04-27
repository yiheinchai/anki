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
                
