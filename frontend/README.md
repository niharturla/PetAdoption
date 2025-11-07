# Pet Adoption Center - Frontend

## Overview

This frontend application provides two main interfaces for the Pet Adoption Center:

1. **Application Management** (`index.html`) - Add, edit, and delete adoption applications
2. **Reports & Statistics** (`reports.html`) - Filter applications and view statistics

## Features

### Requirement 1: Application Management Interface

- **Add Applications**: Create new adoption applications by selecting a dog and adopter from dynamically loaded dropdowns
- **Edit Applications**: Update existing applications (change dog, adopter, or status)
- **Delete Applications**: Remove applications from the system
- **Dynamic Dropdowns**: All dogs and adopters are loaded from the database (not hard-coded)

### Requirement 2: Report Interface

- **Filter Applications**: Filter by:
  - Status (Submitted, In Review, Approved, Rejected)
  - Dog (dynamically loaded from database)
  - Adopter (dynamically loaded from database)
  - Date range (start date and end date)
- **Statistics Display**:
  - Total applications
  - Average processing time (in days)
  - Acceptance rate (percentage)
  - Average applications per dog
  - Status breakdown (counts for each status)
- **Dynamic Data**: All filter dropdowns are populated from the database

## Getting Started

### Prerequisites

- Backend server running on `http://localhost:5555`
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Running the Frontend

1. Make sure the backend server is running:
   ```bash
   cd backend
   npm run dev
   ```

2. Open the frontend files in a browser:
   - For **Application Management**: Open `index.html` in your browser
   - For **Reports**: Open `reports.html` in your browser

   **Note**: Due to CORS restrictions, you may need to:
   - Use a local web server (e.g., Python's `python -m http.server 8000`)
   - Or use a browser extension to disable CORS
   - Or serve the files through a web server

### Using a Local Web Server

**Option 1: Python**
```bash
cd frontend
python3 -m http.server 8000
```
Then open `http://localhost:8000/index.html`

**Option 2: Node.js (http-server)**
```bash
npm install -g http-server
cd frontend
http-server -p 8000
```

## File Structure

```
frontend/
├── index.html      # Application Management page
├── reports.html    # Reports & Statistics page
├── styles.css      # Shared styles
├── app.js          # JavaScript for Application Management
├── reports.js      # JavaScript for Reports
└── README.md       # This file
```

## API Endpoints Used

### Application Management
- `GET /dogs/getDogs` - Get all dogs for dropdown
- `GET /adopters/` - Get all adopters for dropdown
- `GET /applications/` - Get all applications
- `POST /applications/add` - Create new application
- `PUT /applications/:id` - Update application
- `DELETE /applications/:id` - Delete application

### Reports
- `GET /dogs/getDogs` - Get all dogs for filter dropdown
- `GET /adopters/` - Get all adopters for filter dropdown
- `GET /filters/applications` - Filter applications
- `GET /filters/applications/stats` - Get statistics for filtered applications

## Demo Instructions

### For Requirement 1 (Application Management):

1. **Show Dynamic Dropdowns**:
   - Open the browser console (F12)
   - Show that dogs and adopters are loaded via API calls
   - Point out the code in `app.js` that fetches data from `/dogs/getDogs` and `/adopters/`

2. **Add Application**:
   - Select a dog from the dropdown (populated from database)
   - Select an adopter from the dropdown (populated from database)
   - Choose a status
   - Click "Add Application"
   - Show the new application appears in the table

3. **Edit Application**:
   - Click "Edit" on an existing application
   - Show the form is populated with current values
   - Change the dog, adopter, or status
   - Click "Update Application"
   - Show the table updates

4. **Delete Application**:
   - Click "Delete" on an application
   - Confirm deletion
   - Show the application is removed from the table

### For Requirement 2 (Reports):

1. **Show Dynamic Filter Dropdowns**:
   - Open browser console
   - Show that dogs and adopters are loaded dynamically
   - Point out the code in `reports.js`

2. **Generate Report with Filters**:
   - Select filters (status, dog, adopter, date range)
   - Click "Generate Report"
   - Show the filtered applications table
   - Show the statistics section with:
     - Total applications
     - Average processing time
     - Acceptance rate
     - Status breakdown

3. **Show Before/After Data Changes**:
   - Generate a report with current filters
   - Note the statistics
   - Go to Application Management page
   - Add/edit/delete some applications
   - Return to Reports page
   - Generate the same report again
   - Show how statistics have changed

## Code Highlights

### Dynamic Dropdown Population (app.js)
```javascript
async function loadDogs() {
    const response = await fetch(`${API_BASE_URL}/dogs/getDogs`);
    const dogs = await response.json();
    // Populate dropdown dynamically
    dogs.forEach(dog => {
        const option = document.createElement('option');
        option.value = dog._id;
        option.textContent = `${dog.name} (${dog.breed}, Age: ${dog.age})`;
        dogSelect.appendChild(option);
    });
}
```

### Statistics Calculation (backend)
The statistics endpoint (`/filters/applications/stats`) calculates:
- Total count
- Status breakdown
- Average processing time
- Acceptance rate
- Average applications per dog

## Notes

- All data is retrieved from the MongoDB database
- No hard-coded values in dropdowns
- The interface is responsive and works on different screen sizes
- Error handling is included for API failures

