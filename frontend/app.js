const API_BASE_URL = "https://petadoptionnew.onrender.com";

// Load dogs and adopters for dropdowns
async function loadDogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/dogs/getDogs`);
        const dogs = await response.json();
        const dogSelect = document.getElementById('dogSelect');
        
        dogSelect.innerHTML = '<option value="">Select a dog...</option>';
        dogs.forEach(dog => {
            const option = document.createElement('option');
            option.value = dog._id;
            option.textContent = `${dog.name} (${dog.breed}, Age: ${dog.age})`;
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
        const adopterSelect = document.getElementById('adopterSelect');
        
        adopterSelect.innerHTML = '<option value="">Select an adopter...</option>';
        adopters.forEach(adopter => {
            const option = document.createElement('option');
            option.value = adopter._id;
            option.textContent = `${adopter.name} (${adopter.phone}, ${adopter.homeType})`;
            adopterSelect.appendChild(option);
        });
    } catch (error) {
        showMessage('Error loading adopters: ' + error.message, 'error');
        console.error('Error loading adopters:', error);
    }
}

// Load all applications
async function loadApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications/`);
        const applications = await response.json();
        const tbody = document.getElementById('applicationsTableBody');
        console.log("Applications length: ", applications.length);
        if (applications.length === 0) {

            tbody.innerHTML = '<tr><td colspan="7" class="loading">No applications found</td></tr>';
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
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editApplication('${app._id}', '${app.dog?._id || ''}', '${app.adopter?._id || ''}', '${app.status}')">Edit</button>
                        ${app.dog?._id && app.dog?.status === 'Pending' ? `<button class="btn-found-home" onclick="foundHome('${app.dog._id}', '${app._id}')">🏠 Found Home</button>` : ''}
                        <button class="btn-delete" onclick="deleteApplication('${app._id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showMessage('Error loading applications: ' + error.message, 'error');
        console.error('Error loading applications:', error);
        document.getElementById('applicationsTableBody').innerHTML = 
            '<tr><td colspan="7" class="loading">Error loading applications</td></tr>';
    }
}

// Handle form submission
document.getElementById('applicationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const applicationId = document.getElementById('applicationId').value;
    const dogId = document.getElementById('dogSelect').value;
    const adopterId = document.getElementById('adopterSelect').value;
    // Status is always "Submitted" for new applications, or preserved for edits
    const status = applicationId ? document.getElementById('statusSelect')?.value || 'Submitted' : 'Submitted';
    
    if (!dogId || !adopterId) {
        showMessage('Please select both a dog and an adopter', 'error');
        return;
    }
    
    try {
        let response;
        if (applicationId) {
            // Update existing application - preserve existing status if not provided
            response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dog_id: dogId,
                    adopter_id: adopterId,
                    status: status
                })
            });
        } else {
            // Create new application - always starts as "Submitted"
            response = await fetch(`${API_BASE_URL}/applications/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dog_id: dogId,
                    adopter_id: adopterId,
                    status: 'Submitted'
                })
            });
        }
        
        if (response.ok) {
            showMessage(applicationId ? 'Application updated successfully!' : 'Application added successfully!', 'success');
            resetForm();
            loadApplications();
        } else {
            const error = await response.json();
            showMessage('Error: ' + (error.error || 'Failed to save application'), 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
        console.error('Error saving application:', error);
    }
});

// Edit application
function editApplication(id, dogId, adopterId, status) {
    document.getElementById('applicationId').value = id;
    document.getElementById('dogSelect').value = dogId;
    document.getElementById('adopterSelect').value = adopterId;
    // Store status in a hidden field for updates (status is not editable in form)
    if (!document.getElementById('statusSelect')) {
        const hiddenStatus = document.createElement('input');
        hiddenStatus.type = 'hidden';
        hiddenStatus.id = 'statusSelect';
        document.getElementById('applicationForm').appendChild(hiddenStatus);
    }
    document.getElementById('statusSelect').value = status;
    
    document.getElementById('submitBtn').textContent = 'Update Application';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete application
async function deleteApplication(id) {
    if (!confirm('Are you sure you want to delete this application?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Application deleted successfully!', 'success');
            loadApplications();
        } else {
            const error = await response.json();
            showMessage('Error: ' + (error.error || 'Failed to delete application'), 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
        console.error('Error deleting application:', error);
    }
}

// Found Home - Mark dog as adopted
async function foundHome(dogId, applicationId) {
    console.log("inside the foundHome function");
    if (!confirm('Mark this dog as "Found Home"? This will update the dog status to Adopted and approve the application.')) {
        return;
    }
    // if found home or time expires add to past dogs db
    try {
        const response = await fetch(`${API_BASE_URL}/dogs/foundHome/${dogId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                applicationId: applicationId
            })
        });
        
        if (response.ok) {
            showMessage('Dog has found a home! Moved to adopted dogs table and removed from applications.', 'success');
            // set other applications that have not been approved to rejected

            // get dog name and breed from dog id 

            const resp = await fetch(`${API_BASE_URL}/applications/${applicationId}/approve`, {
                method: "PUT"
              });

            if (!resp.ok) {
                showMessage('Error');
                return;
            }
            

            loadApplications();
            loadAdoptedDogs();
        } else {
            const error = await response.json();
            showMessage('Error: ' + (error.error || 'Failed to update dog status'), 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
        console.error('Error updating dog status:', error);
    }
}

// Reset form
function resetForm() {
    document.getElementById('applicationForm').reset();
    document.getElementById('applicationId').value = '';
    document.getElementById('submitBtn').textContent = 'Add Application';
    document.getElementById('cancelBtn').style.display = 'none';
    // Remove hidden statusSelect if it exists
    const statusSelect = document.getElementById('statusSelect');
    if (statusSelect) {
        statusSelect.remove();
    }
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

// Load adopted dogs
async function loadAdoptedDogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/dogs/adopted?limit=50`);
        const adoptedDogs = await response.json();
        const tbody = document.getElementById('adoptedDogsTableBody');
        
        if (adoptedDogs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">No adopted dogs found</td></tr>';
            return;
        }
        
        tbody.innerHTML = adoptedDogs.map(dog => `
            <tr>
                <td>${dog.name || 'N/A'}</td>
                <td>${dog.breed || 'N/A'}</td>
                <td>${dog.age || 'N/A'}</td>
                <td>${dog.adopter?.name || 'N/A'}</td>
                <td>${dog.adopter?.phone || 'N/A'}</td>
                <td>${new Date(dog.adoptedDate).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        showMessage('Error loading adopted dogs: ' + error.message, 'error');
        console.error('Error loading adopted dogs:', error);
        document.getElementById('adoptedDogsTableBody').innerHTML = 
            '<tr><td colspan="6" class="loading">Error loading adopted dogs</td></tr>';
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadDogs();
    loadAdopters();
    loadApplications();
    loadAdoptedDogs();
});

