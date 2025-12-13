const API_BASE_URL = 'http://localhost:5555';

// Load dog statistics table
async function loadDogStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/filters/dogs/stats`);
    const data = await response.json();

    const dogStats = Array.isArray(data)
      ? data
      : Array.isArray(data.dogStats)
        ? data.dogStats
        : [];

    const tbody = document.getElementById('dogStatsTableBody');

    if (dogStats.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No adopted dogs found</td></tr>';
      return;
    }

    const rows = await Promise.all(
      dogStats.map(async (dog) => {
        const adopterName = await fetchDogAdopter(dog.dogId);

        return `
          <tr>
            <td>${dog.name || 'N/A'}</td>
            <td>${dog.breed || 'N/A'}</td>
            <td>${dog.totalApplications ?? 0}</td>
            <td>${adopterName}</td>
            <td>${dog.intakeDate ? new Date(dog.intakeDate).toLocaleString() : 'N/A'}</td>
            <td>${dog.adoptedDate ? new Date(dog.adoptedDate).toLocaleString() : 'N/A'}</td>
          </tr>
        `;
      })
    );

    tbody.innerHTML = rows.join('');

  } catch (error) {
    console.error(error);
    showMessage('Error loading dog statistics', 'error');
  }
}


async function fetchTotalApplications(dogId) {
    consol
    try {
      const res = await fetch(
        `${API_BASE_URL}/filters/dogs/${dogId}/applications/count`
      );
  
      if (!res.ok) return 0;
  
      const data = await res.json();
      console.log("");
      return data.totalApplications;
    } catch (error) {
      console.error("Error fetching application count:", error);
      return 0;
    }
  }
  


async function fetchDogAdopter(dogId) {
    try {
      const res = await fetch(`${API_BASE_URL}/filters/dogs/${dogId}/adopter`);
      if (!res.ok) return "Not adopted";
      const data = await res.json();
      return data.adopter?.name || "Unknown";
    } catch {
      return "N/A";
    }
  }
  

// Load adoption statistics
async function loadAdoptionStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/filters/adopted/stats`);
        const stats = await response.json();
        
        // Update stat cards
        document.getElementById('statTotalAdopted').textContent = stats.totalAdopted || 0;
        
        // Calculate and display most recent intake date/time
        if (stats.mostRecentIntakeDate) {
            const intakeDate = new Date(stats.mostRecentIntakeDate);
            const formattedDate = intakeDate.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            document.getElementById('statIntakeDate').textContent = formattedDate;
        } else {
            document.getElementById('statIntakeDate').textContent = '-';
        }
        document.getElementById('statMostBreed').textContent = stats.mostAdoptedBreed || '-';
        document.getElementById('statAvgApps').textContent = stats.averageApplicationsPerDog ? 
            stats.averageApplicationsPerDog.toFixed(2) : '0';
        
        // Top adopter
        if (stats.topAdopter) {
            document.getElementById('statTopAdopter').textContent = stats.topAdopter.name || '-';
        } else {
            document.getElementById('statTopAdopter').textContent = '-';
        }
        
        // Fastest adoption
        if (stats.fastestAdoption) {
            document.getElementById('statFastest').textContent = 
                `${stats.fastestAdoption.dogName} (${stats.fastestAdoption.days} days)`;
        } else {
            document.getElementById('statFastest').textContent = '-';
        }
        
        // Slowest adoption
        if (stats.slowestAdoption) {
            document.getElementById('statSlowest').textContent = 
                `${stats.slowestAdoption.dogName} (${stats.slowestAdoption.days} days)`;
        } else {
            document.getElementById('statSlowest').textContent = '-';
        }
        
        // Show details section if we have data
        if (stats.topAdopter || stats.fastestAdoption || stats.slowestAdoption) {
            const detailsSection = document.getElementById('adoptionDetails');
            detailsSection.style.display = 'block';
            
            if (stats.topAdopter) {
                document.getElementById('topAdopterName').textContent = stats.topAdopter.name;
                document.getElementById('topAdopterCount').textContent = stats.topAdopter.count;
            }
            
            if (stats.fastestAdoption) {
                document.getElementById('fastestDogName').textContent = stats.fastestAdoption.dogName;
                document.getElementById('fastestDays').textContent = stats.fastestAdoption.days;
            }
            
            if (stats.slowestAdoption) {
                document.getElementById('slowestDogName').textContent = stats.slowestAdoption.dogName;
                document.getElementById('slowestDays').textContent = stats.slowestAdoption.days;
            }
        }
        
    } catch (error) {
        showMessage('Error loading adoption statistics: ' + error.message, 'error');
        console.error('Error loading adoption statistics:', error);
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

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadDogStats();
    loadAdoptionStats();
});

