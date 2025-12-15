const API_BASE_URL = "https://petadoptionnew.onrender.com";

// Load all adopters
async function loadAdopters() {
    try {
        const response = await fetch(`${API_BASE_URL}/adopters/`);
        const adopters = await response.json();
        const tbody = document.getElementById('adoptersTableBody');
        
        if (adopters.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading">No adopters found</td></tr>';
            return;
        }
        
        tbody.innerHTML = adopters.map(adopter => `
            <tr>
                <td>${adopter.name || 'N/A'}</td>
                <td>${adopter.phone || 'N/A'}</td>
                <td>${adopter.homeType || 'N/A'}</td>
                <td>${adopter.experience || 'None'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editAdopter('${adopter._id}', '${escapeHtml(adopter.name)}', '${escapeHtml(adopter.phone)}', '${adopter.homeType}', '${escapeHtml(adopter.experience || '')}')">Edit</button>
                        <button class="btn-delete" onclick="deleteAdopter('${adopter._id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showMessage('Error loading adopters: ' + error.message, 'error');
        console.error('Error loading adopters:', error);
        document.getElementById('adoptersTableBody').innerHTML = 
            '<tr><td colspan="5" class="loading">Error loading adopters</td></tr>';
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle form submission
document.getElementById('adopterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const adopterId = document.getElementById('adopterId').value;
    const name = document.getElementById('adopterName').value.trim();
    const phone = document.getElementById('adopterPhone').value.trim();
    const homeType = document.getElementById('adopterHomeType').value;
    const experience = document.getElementById('adopterExperience').value.trim();
    
    if (!name || !phone || !homeType) {
        showMessage('Please fill in all required fields (Name, Phone, Home Type).', 'error');
        return;
    }
    
    try {
        let response;
        if (adopterId) {
            // Update existing adopter
            response = await fetch(`${API_BASE_URL}/adopters/${adopterId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    phone,
                    homeType,
                    experience
                })
            });
        } else {
            // Create new adopter
            response = await fetch(`${API_BASE_URL}/adopters/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    phone,
                    homeType,
                    experience
                })
            });
        }
        
        if (response.ok) {
            showMessage(adopterId ? 'Adopter updated successfully!' : 'Adopter added successfully!', 'success');
            resetForm();
            loadAdopters();
        } else {
            const error = await response.json();
            showMessage('Error: ' + (error.error || 'Failed to save adopter'), 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
        console.error('Error saving adopter:', error);
    }
});

// Edit adopter
function editAdopter(id, name, phone, homeType, experience) {
    document.getElementById('adopterId').value = id;
    document.getElementById('adopterName').value = name;
    document.getElementById('adopterPhone').value = phone;
    document.getElementById('adopterHomeType').value = homeType;
    document.getElementById('adopterExperience').value = experience || '';
    
    document.getElementById('submitBtn').textContent = 'Update Adopter';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete adopter
async function deleteAdopter(id) {
    confirm('Are you sure you want to delete this adopter? This action cannot be undone.')
   
    
    try {
        const response = await fetch(`${API_BASE_URL}/adopters/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Adopter deleted successfully!', 'success');
            loadAdopters();
        } else {
            const error = await response.json();
            showMessage('Error: ' + (error.error || 'Failed to delete adopter'), 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
        console.error('Error deleting adopter:', error);
    }
}

// Reset form
function resetForm() {
    document.getElementById('adopterForm').reset();
    document.getElementById('adopterId').value = '';
    document.getElementById('submitBtn').textContent = 'Add Adopter';
    document.getElementById('cancelBtn').style.display = 'none';
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

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadAdopters();
});

