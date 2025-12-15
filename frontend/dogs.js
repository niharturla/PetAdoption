const API_BASE_URL = "https://petadoptionnew.onrender.com";
let allDogs = []; // store all dogs for filtering

// Load all dogs
async function loadDogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/dogs/getDogs`);
        allDogs = await response.json();
        renderDogs(allDogs);
    } catch (error) {
        showMessage('Error loading dogs: ' + error.message, 'error');
        console.error('Error loading dogs:', error);
        document.getElementById('dogsTableBody').innerHTML = 
            '<tr><td colspan="6" class="loading">Error loading dogs</td></tr>';
    }
}

// Calculate days remaining until availableUntil
function getDaysRemaining(availableUntil) {
    if (!availableUntil) return 'N/A';
    const now = new Date();
    const until = new Date(availableUntil);
    const diff = until - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
}

// Format countdown timer
function formatCountdown(availableUntil) {
    if (!availableUntil) return '<span class="countdown-expired">N/A</span>';
    const now = new Date();
    const until = new Date(availableUntil);
    const diff = until - now;
    
    if (diff <= 0) {
        return '<span class="countdown-expired">Expired</span>';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `<span class="countdown-timer" data-until="${availableUntil}">${days}d ${hours}h</span>`;
    } else if (hours > 0) {
        return `<span class="countdown-timer" data-until="${availableUntil}">${hours}h ${minutes}m</span>`;
    } else {
        return `<span class="countdown-timer urgent" data-until="${availableUntil}">${minutes}m</span>`;
    }
}

// Format availableUntil date for datetime-local input (for editing)
function formatDateForInput(availableUntil) {
    if (!availableUntil) return '';
    const date = new Date(availableUntil);
    // Format: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Render dogs in table
function renderDogs(dogs) {
    const tbody = document.getElementById('dogsTableBody');
    if (dogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No dogs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = dogs.map(dog => `
        <tr>
            <td>${dog.name || 'N/A'}</td>
            <td>${dog.breed || 'N/A'}</td>
            <td>${dog.age || 'N/A'}</td>
            <td><span class="status-badge ${getStatusClass(dog.status)}">${dog.status || 'Available'}</span></td>
            <td>${formatCountdown(dog.availableUntil)}</td>
            <td>${dog.intakeDate ? new Date(dog.intakeDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-medical" onclick="openMedicalForm('${dog._id}', '${escapeHtml(dog.name)}')">➕ Add Record</button>
                    <button class="btn-view-pdf" onclick="viewMedicalRecordsPDF('${dog._id}', '${escapeHtml(dog.name)}')">📄 View PDF</button>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editDog('${dog._id}', '${escapeHtml(dog.name)}', '${escapeHtml(dog.breed)}', ${dog.age}, '${dog.status || 'Available'}', '${dog.availableUntil || ''}')">Edit</button>
                    <button class="btn-delete" onclick="deleteDog('${dog._id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Start countdown timers
    startCountdownTimers();
}

// Start countdown timers for all dogs
function startCountdownTimers() {
    const timers = document.querySelectorAll('.countdown-timer');
    timers.forEach(timer => {
        const until = timer.getAttribute('data-until');
        if (until) {
            updateCountdown(timer, until);
            setInterval(() => updateCountdown(timer, until), 60000); // Update every minute
        }
    });
}

// Update countdown display
function updateCountdown(element, availableUntil) {
    const now = new Date();
    const until = new Date(availableUntil);
    const diff = until - now;
    
    if (diff <= 0) {
        element.innerHTML = '<span class="countdown-expired">Expired</span>';
        element.className = 'countdown-expired';
        // Auto-check status when expired
        checkDogStatuses();
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        element.textContent = `${days}d ${hours}h`;
        element.className = 'countdown-timer';
    } else if (hours > 0) {
        element.textContent = `${hours}h ${minutes}m`;
        element.className = 'countdown-timer';
    } else {
        element.textContent = `${minutes}m`;
        element.className = 'countdown-timer urgent';
    }
}

// Check and update dog statuses (auto-change to Pending when expired)
async function checkDogStatuses() {
    try {
        const response = await fetch(`${API_BASE_URL}/dogs/checkStatuses`, {
            method: 'POST'
        });
        if (response.ok) {
            const result = await response.json();
            if (result.count > 0) {
                showMessage(`${result.count} dog(s) status updated to Pending`, 'success');
                loadDogs(); // Reload to show updated statuses
            }
        }
    } catch (error) {
        console.error('Error checking dog statuses:', error);
    }
}

// Status badge class
function getStatusClass(status) {
    const statusMap = {
        'Available': 'approved',
        'Pending': 'in-review',
        'Adopted': 'submitted'
    };
    return statusMap[status] || 'submitted';
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add/Edit dog
document.getElementById('dogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dogId = document.getElementById('dogId').value;
    const name = document.getElementById('dogName').value.trim();
    const breed = document.getElementById('dogBreed').value.trim();
    const age = parseInt(document.getElementById('dogAge').value);
    const readyForReview = document.getElementById('readyForReview').value;
    
    if (!name || !breed || isNaN(age) || age < 0 || !readyForReview) {
        showMessage('Please fill in all fields correctly. Age must be 0 or greater, and Ready for Review date/time is required.', 'error');
        return;
    }
    
    // Convert datetime-local to ISO string for backend
    const readyForReviewDate = new Date(readyForReview).toISOString();
    
    try {
        let response;
        if (dogId) {
            // Update dog
            response = await fetch(`${API_BASE_URL}/dogs/updateDog/${dogId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, breed, age, availableUntil: readyForReviewDate })
            });
        } else {
            // Add dog
            response = await fetch(`${API_BASE_URL}/dogs/addDog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, breed, age, availableUntil: readyForReviewDate })
            });
        }

        if (response.ok) {
            showMessage(dogId ? 'Dog updated successfully!' : 'Dog added successfully!', 'success');
            resetForm();
            loadDogs();
            checkDogStatuses(); // Check for expired dogs
        } else {
            const error = await response.json();
            showMessage('Error: ' + (error.error || 'Failed to save dog'), 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
        console.error('Error saving dog:', error);
    }
});

// Edit dog
function editDog(id, name, breed, age, status, availableUntil) {
    document.getElementById('dogId').value = id;
    document.getElementById('dogName').value = name;
    document.getElementById('dogBreed').value = breed;
    document.getElementById('dogAge').value = age;
    document.getElementById('dogStatus').value = status;
    document.getElementById('readyForReview').value = formatDateForInput(availableUntil);
    document.getElementById('submitBtn').textContent = 'Update Dog';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete dog
async function deleteDog(id) {
    if (!confirm('Are you sure you want to delete this dog?')) return;
    
    try {
        const deletedRecord = await fetch(`${API_BASE_URL}/dogs/deleteRecords/${id}`, {method: 'DELETE'});
        const deletedDog = await fetch(`${API_BASE_URL}/dogs/deleteApps/${id}`, {method: 'DELETE'} );
        const response = await fetch(`${API_BASE_URL}/dogs/deleteDog/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showMessage('Dog deleted successfully!', 'success');
            // delete the applications with the dog
            // delete application id not dog id
            //const deletedDog = await fetch(`${API_BASE_URL}/dogs/deleteApps/${id}`, {method: 'DELETE'} );
            if (deletedDog) {
                showMessage('All applications related to the dog are delete', 'success');
            }

            if (deletedRecord) {
                showMessage('All medical records related to the dog are deleted', 'success');
            }
            loadDogs();
        } else {
            const error = await response.json();
            showMessage('Error: ' + (error.error || 'Failed to delete dog'), 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
        console.error('Error deleting dog:', error);
    }
}

// Reset form
function resetForm() {
    document.getElementById('dogForm').reset();
    document.getElementById('dogId').value = '';
    document.getElementById('submitBtn').textContent = 'Add Dog';
    document.getElementById('cancelBtn').style.display = 'none';
}

// Show message
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    setTimeout(() => { messageEl.className = 'message'; }, 3000);
}

// ===== Filters =====
function applyDogFilters() {
    const breedFilter = document.getElementById('filterBreed').value.toLowerCase();
    const minAge = parseInt(document.getElementById('filterMinAge').value);
    const maxAge = parseInt(document.getElementById('filterMaxAge').value);
    const statusFilter = document.getElementById('filterStatus').value;

    const filteredDogs = allDogs.filter(dog => {
        const matchesBreed = !breedFilter || (dog.breed && dog.breed.toLowerCase().includes(breedFilter));
        const matchesMinAge = isNaN(minAge) || dog.age >= minAge;
        const matchesMaxAge = isNaN(maxAge) || dog.age <= maxAge;
        const matchesStatus = !statusFilter || dog.status === statusFilter;

        return matchesBreed && matchesMinAge && matchesMaxAge && matchesStatus;
    });

    renderDogs(filteredDogs);
}

function clearDogFilters() {
    document.getElementById('filterBreed').value = '';
    document.getElementById('filterMinAge').value = '';
    document.getElementById('filterMaxAge').value = '';
    document.getElementById('filterStatus').value = '';
    renderDogs(allDogs);
}

document.getElementById('applyFilters').addEventListener('click', applyDogFilters);
document.getElementById('clearFilters').addEventListener('click', clearDogFilters);

// Medical Records Functions
function openMedicalForm(dogId, dogName) {
    document.getElementById('medicalRecordDogId').value = dogId;
    document.getElementById('medicalRecordId').value = '';
    document.getElementById('medicalRecordForm').reset();
    document.getElementById('medicalRecordDogId').value = dogId;
    document.getElementById('medicalSubmitBtn').textContent = 'Add Medical Record';
    document.getElementById('medicalRecordSection').style.display = 'block';
    document.getElementById('medicalRecordSection').querySelector('h2').textContent = `Add Medical Record - ${dogName}`;
    document.getElementById('medicalTreatmentDate').valueAsDate = new Date();
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function closeMedicalForm() {
    document.getElementById('medicalRecordSection').style.display = 'none';
    document.getElementById('medicalRecordForm').reset();
}

// Handle medical record form submission
document.getElementById('medicalRecordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dogId = document.getElementById('medicalRecordDogId').value;
    const recordId = document.getElementById('medicalRecordId').value;
    const description = document.getElementById('medicalDescription').value.trim();
    const treatmentDate = document.getElementById('medicalTreatmentDate').value;
    const vetName = document.getElementById('medicalVetName').value.trim();
    const notes = document.getElementById('medicalNotes').value.trim();
    
    if (!description || !treatmentDate) {
        showMessage('Please fill in description and treatment date.', 'error');
        return;
    }
    
    try {
        let response;
        if (recordId) {
            // Update existing record
            response = await fetch(`${API_BASE_URL}/records/${recordId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dog_id: dogId, description, treatment_date: treatmentDate, vet_name: vetName, notes })
            });
        } else {
            // Create new record
            response = await fetch(`${API_BASE_URL}/records/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dog_id: dogId, description, treatment_date: treatmentDate, vet_name: vetName, notes })
            });
        }
        
        if (response.ok) {
            showMessage(recordId ? 'Medical record updated successfully!' : 'Medical record added successfully!', 'success');
            closeMedicalForm();
        } else {
            const error = await response.json();
            showMessage('Error: ' + (error.error || 'Failed to save medical record'), 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
        console.error('Error saving medical record:', error);
    }
});

// View medical records as PDF
async function viewMedicalRecordsPDF(dogId, dogName) {
    try {
        const response = await fetch(`${API_BASE_URL}/records/?dog_id=${dogId}`);
        const records = await response.json();
        
        if (records.length === 0) {
            showMessage('No medical records found for this dog.', 'error');
            return;
        }
        
        // Generate PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set title
        doc.setFontSize(18);
        doc.text('Medical Records Report', 105, 20, { align: 'center' });
        
        // Dog information
        doc.setFontSize(14);
        doc.text(`Dog: ${dogName}`, 20, 35);
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 45);
        doc.text(`Total Records: ${records.length}`, 20, 55);
        
        // Draw line
        doc.setLineWidth(0.5);
        doc.line(20, 60, 190, 60);
        
        // Add records
        let yPos = 75;
        records.forEach((record, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`Record #${index + 1}`, 20, yPos);
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            yPos += 8;
            doc.text(`Treatment Date: ${new Date(record.treatment_date).toLocaleDateString()}`, 20, yPos);
            
            if (record.vet_name) {
                yPos += 6;
                doc.text(`Veterinarian: ${record.vet_name}`, 20, yPos);
            }
            
            yPos += 6;
            doc.text(`Description:`, 20, yPos);
            yPos += 6;
            
            // Split description into multiple lines if too long
            const descLines = doc.splitTextToSize(record.description || 'N/A', 170);
            doc.text(descLines, 20, yPos);
            yPos += descLines.length * 5;
            
            if (record.notes) {
                yPos += 4;
                doc.text(`Notes:`, 20, yPos);
                yPos += 6;
                const notesLines = doc.splitTextToSize(record.notes, 170);
                doc.text(notesLines, 20, yPos);
                yPos += notesLines.length * 5;
            }
            
            yPos += 8;
            if (yPos < 280) {
                doc.setLineWidth(0.2);
                doc.line(20, yPos, 190, yPos);
                yPos += 5;
            }
        });
        
        // Save PDF
        doc.save(`Medical_Records_${dogName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        showMessage('PDF report generated successfully!', 'success');
    } catch (error) {
        showMessage('Error generating PDF: ' + error.message, 'error');
        console.error('Error generating PDF:', error);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadDogs();
    checkDogStatuses(); // Check on page load
    setInterval(checkDogStatuses, 5 * 60 * 1000); // Check every 5 minutes
});
