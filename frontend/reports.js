const API_BASE_URL = 'http://localhost:5555';

// Load dogs and adopters for filter dropdowns
async function loadDogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/dogs/getDogs`);
        
        const dogs = await response.json();
        const dogSelect = document.getElementById('filterDog');
        
        dogs.forEach(dog => {
            const option = document.createElement('option');
            option.value = dog._id;
            option.textContent = `${dog.name} (${dog.breed})`;
            dogSelect.appendChild(option);
        });
    } catch (error) {
        showMessage('Error loading dogs: ' + error.message, 'error');
        console.error('Error loading dogs:', error);
    }
}

async function loadAdopters() {
    try {
        const response = await fetch(`${API_BASE_URL}/adopters/`);
        const adopters = await response.json();
        const adopterSelect = document.getElementById('filterAdopter');
        
        adopters.forEach(adopter => {
            const option = document.createElement('option');
            option.value = adopter._id;
            option.textContent = `${adopter.name} (${adopter.phone})`;
            adopterSelect.appendChild(option);
        });
    } catch (error) {
        showMessage('Error loading adopters: ' + error.message, 'error');
        console.error('Error loading adopters:', error);
    }
}

// Generate report
async function generateReport() {
    const status = document.getElementById('filterStatus').value;
    const dogId = document.getElementById('filterDog').value;
    const adopterId = document.getElementById('filterAdopter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Read the checkbox boolean
    const includeAvailableDogs = document.getElementById('filterAvailableDogs').checked;

    // Build query string
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (dogId) params.append('dog_id', dogId);
    if (adopterId) params.append('adopter_id', adopterId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    // Add the checkbox filter
    if (includeAvailableDogs) params.append('includeAvailableDogs', 'true');

    try {
        const [applicationsResponse, statsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/filters/applications?${params.toString()}`),
            fetch(`${API_BASE_URL}/filters/applications/stats?${params.toString()}`)
        ]);
        
        const applications = await applicationsResponse.json();
        const stats = await statsResponse.json();
        
        displayStatistics(stats);
        displayApplications(applications);
        showMessage('Report generated successfully!', 'success');
    } catch (error) {
        showMessage('Error generating report: ' + error.message, 'error');
        console.error('Error generating report:', error);
    }
}


// Display statistics
function displayStatistics(stats) {
    const statsSection = document.getElementById('statsSection');
    if (statsSection) statsSection.style.display = 'block';

    const statTotalEl = document.getElementById('statTotal');
    if (statTotalEl) statTotalEl.textContent = stats?.total ?? 0;

    const statAvgPerDogEl = document.getElementById('statAvgPerDog');
    if (statAvgPerDogEl) statAvgPerDogEl.textContent = (stats?.averageApplicationsPerDog ?? 0).toFixed(2);

    const countSubmittedEl = document.getElementById('countSubmitted');
    if (countSubmittedEl) countSubmittedEl.textContent = stats?.byStatus?.Submitted ?? 0;

    const countInReviewEl = document.getElementById('countInReview');
    if (countInReviewEl) countInReviewEl.textContent = stats?.byStatus?.['In Review'] ?? 0;

    const countApprovedEl = document.getElementById('countApproved');
    if (countApprovedEl) countApprovedEl.textContent = stats?.byStatus?.Approved ?? 0;

    const countRejectedEl = document.getElementById('countRejected');
    if (countRejectedEl) countRejectedEl.textContent = stats?.byStatus?.Rejected ?? 0;
}


// Display applications table
function displayApplications(applications) {
    const tbody = document.getElementById('reportTableBody');
    // Get the checkbox element    
    if (applications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No applications match the selected filters</td></tr>';
        return;
    }
    
    tbody.innerHTML = applications.map(app => `
        <tr>
            <td>${app.dog?.name || 'N/A'}</td>
            <td>${app.dog?.breed || 'N/A'}</td>
            <td>${app.adopter?.name || 'N/A'}</td>
            <td>${app.adopter?.phone || 'N/A'}</td>
            <td><span class="status-badge ${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></td>
            <td>${new Date(app.submittedAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Clear filters
function clearFilters() {
    document.getElementById('filterForm').reset();
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('reportTableBody').innerHTML = 
        '<tr><td colspan="6" class="loading">Apply filters to generate report...</td></tr>';
}

// Show message
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    
    setTimeout(() => {
        messageEl.className = 'message';
    }, 3000);
}

// Handle form submission
document.getElementById('filterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    generateReport();
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadDogs();
    loadAdopters();
});

