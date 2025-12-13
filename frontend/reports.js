const API_BASE_URL = 'http://localhost:5555';

// Load dogs for dropdown
async function loadDogs() {
    try {
        //const res = await fetch(`${API_BASE_URL}/dogs/getDogs`);
        const res = await fetch(
            `${API_BASE_URL}/dogs/getDogs?includeAdopted=true`
          );
        const dogs = await res.json();
        const dogSelect = document.getElementById('filterDog');

        dogs.forEach(dog => {
            const option = document.createElement('option');
            option.value = dog._id;
            option.textContent = `${dog.name} (${dog.breed})`;
            dogSelect.appendChild(option);
        });
    } catch (error) {
        showMessage('Error loading dogs: ' + error.message, 'error');
        console.error(error);
    }
}

// Load adopters for dropdown
async function loadAdopters() {
    try {
        const res = await fetch(`${API_BASE_URL}/adopters/`);
        const adopters = await res.json();
        const adopterSelect = document.getElementById('filterAdopter');

        adopters.forEach(adopter => {
            const option = document.createElement('option');
            option.value = adopter._id;
            option.textContent = `${adopter.name} (${adopter.phone})`;
            adopterSelect.appendChild(option);
        });
    } catch (error) {
        showMessage('Error loading adopters: ' + error.message, 'error');
        console.error(error);
    }
}

// Generate report
async function generateReport() {
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading report...</td></tr>';

    const params = new URLSearchParams();
    const status = document.getElementById('filterStatus').value;
    const dogId = document.getElementById('filterDog').value;
    const adopterId = document.getElementById('filterAdopter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (status) params.append('status', status);
    if (dogId) params.append('dog_id', dogId);
    if (adopterId) params.append('adopter_id', adopterId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    console.log(`${API_BASE_URL}/filters/applications?${params}`);

    try {
        const [appsRes, statsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/filters/applications?${params.toString()}`),
            fetch(`${API_BASE_URL}/filters/applications/stats?${params.toString()}`)
        ]);

        //console.log(appsRes);

        const applications = await appsRes.json();
        console.log("applications: ",applications)
        const stats = await statsRes.json();

        if (!applications.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">No applications match the selected filters</td></tr>';
            document.getElementById('statsSection').style.display = 'none';
            return;
        }

        displayStatistics(stats);
        displayApplications(applications);
        showMessage('Report generated successfully!', 'success');
    } catch (error) {
        showMessage('Error generating report: ' + error.message, 'error');
        console.error(error);
    }
}

// Display statistics
function displayStatistics(stats) {
    const statsSection = document.getElementById('statsSection');
    if (statsSection) statsSection.style.display = 'block';

    document.getElementById('statTotal').textContent = stats?.total ?? 0;

    // Adopted rate
    const adoptedCount = stats?.byStatus?.Approved ?? 0;
    const total = stats?.total ?? 0;
    document.getElementById('statAcceptanceRate').textContent = total ? `${((adoptedCount/total)*100).toFixed(1)}%` : '0%';

    document.getElementById('statAvgPerDog').textContent = (stats?.averageApplicationsPerDog ?? 0).toFixed(2);

    document.getElementById('countSubmitted').textContent = stats?.byStatus?.Submitted ?? 0;
    document.getElementById('countInReview').textContent = stats?.byStatus?.['In Review'] ?? 0;
    document.getElementById('countApproved').textContent = stats?.byStatus?.Approved ?? 0;
    document.getElementById('countRejected').textContent = stats?.byStatus?.Rejected ?? 0;
}

// Display applications table
function displayApplications(applications) {
    const tbody = document.getElementById('reportTableBody');

    tbody.innerHTML = applications.map(app => `
        <tr>
            <td>${app.dog?.name ?? 'N/A'}</td>
            <td>${app.dog?.breed ?? 'N/A'}</td>
            <td>${app.adopter?.name ?? 'N/A'}</td>
            <td>${app.adopter?.phone ?? 'N/A'}</td>
            <td><span class="status-badge ${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span></td>
            <td>${app.submittedAt ? new Date(app.submittedAt).toISOString().split('T')[0] : 'N/A'}</td>
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
document.getElementById('filterForm').addEventListener('submit', e => {
    e.preventDefault();
    generateReport();
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadDogs();
    loadAdopters();
});
