# 🐾 Pet Adoption Center Backend

Live URL: https://main.d2hlw0girgqm22.amplifyapp.com/

## Overview

This is the backend for a **Pet Adoption Center** application built with **Node.js, Express, and MongoDB (MERN stack)**.
It supports managing:

* Dogs
* Adopters
* Adoption Applications
* Medical Records

It also includes **filter routes** to dynamically query data for reporting and frontend dropdowns.

---

## Features

1. **Dog Management**

   * Add, update, delete, and list dogs.
   * Filter dogs by age range and breed.

2. **Adopter Management**

   * Add, update, delete, and list adopters.
   * Filter adopters by home type and experience.

3. **Application Management**

   * Track adoption applications.
   * Filter applications by dog, adopter, or status.

4. **Medical Records**

   * Track veterinary records for dogs.
   * Filter by dog, vet name, or date range.

5. **Dynamic Filtering**

   * Supports multiple query parameters for each collection.

---

## Tech Stack

* **Backend:** Node.js, Express
* **Database:** MongoDB (Mongoose ODM)
* **Testing:** Postman
* **Environment:** ES Modules (`type: "module"` in package.json)

---

## Project Structure

```
backend/
│
├─ models/
│  ├─ DogModel.js
│  ├─ adopterModel.js
│  ├─ applicationModel.js
│  └─ medicalRecordsModel.js
│
├─ routes/
│  ├─ dogRoutes.js
│  ├─ adopterRoutes.js
│  ├─ applicationRoutes.js
│  ├─ medicalRecordsRoutes.js
│  └─ filterRoutes.js
│
├─ index.js
├─ package.json
└─ README.md
```

---

## Getting Started

### Prerequisites

* Node.js (v18+ recommended)
* MongoDB (local or cloud)
* npm

---

### Installation

```bash
git clone <repo-url>
cd backend
npm install
```

Create a `.env` file in the root folder with:

```
MONGO_URI=<your-mongodb-connection-string>
PORT=5555
```

---

### Running the Server

```bash
npm run dev
```

The server should start on **[http://localhost:5555](http://localhost:5555)** (or your specified PORT).

---

## API Routes

### 1. **Dogs**

| Method | Route               | Description        |
| ------ | ------------------- | ------------------ |
| POST   | /dogs/addDog        | Add a new dog      |
| GET    | /dogs/getDogs       | List all dogs      |
| GET    | /dogs/getDog/:id    | Get a dog by ID    |
| PUT    | /dogs/updateDog/:id | Update a dog by ID |
| DELETE | /dogs/deleteDog/:id | Delete a dog by ID |

**Example POST Body:**

```json
{
  "name": "Buddy",
  "age": 3,
  "breed": "Golden Retriever"
}
```

---

### 2. **Adopters**

| Method | Route         | Description          |
| ------ | ------------- | -------------------- |
| POST   | /adopters/add | Add a new adopter    |
| GET    | /adopters/    | List all adopters    |
| GET    | /adopters/:id | Get an adopter by ID |
| PUT    | /adopters/:id | Update an adopter    |
| DELETE | /adopters/:id | Delete an adopter    |

**Example POST Body:**

```json
{
  "name": "Emily Sanders",
  "phone": "555-9102",
  "homeType": "Apartment",
  "experience": "Owned a cat for 5 years"
}
```

---

### 3. **Applications**

| Method | Route             | Description           |
| ------ | ----------------- | --------------------- |
| POST   | /applications/add | Add a new application |
| GET    | /applications/    | List all applications |
| GET    | /applications/:id | Get application by ID |
| PUT    | /applications/:id | Update application    |
| DELETE | /applications/:id | Delete application    |

**Example POST Body:**

```json
{
  "dog_id": "690d25d34ac6e0021ac28b14",
  "adopter_id": "690d282bd3be33281882710a",
  "status": "Submitted"
}
```

---

### 4. **Medical Records**

| Method | Route               | Description              |
| ------ | ------------------- | ------------------------ |
| POST   | /medicalRecords/add | Add medical record       |
| GET    | /medicalRecords/    | List all medical records |
| GET    | /medicalRecords/:id | Get medical record by ID |
| PUT    | /medicalRecords/:id | Update medical record    |
| DELETE | /medicalRecords/:id | Delete medical record    |

**Example POST Body:**

```json
{
  "dog_id": "690d25d34ac6e0021ac28b14",
  "description": "Initial checkup",
  "treatment_date": "2025-11-06",
  "vet_name": "Dr. Smith",
  "notes": "Healthy"
}
```

---

### 5. **Filter Routes**

| Method | Route                 | Description                                                            |
| ------ | --------------------- | ---------------------------------------------------------------------- |
| GET    | /filters/dogs         | Filter dogs by `minAge`, `maxAge`, `breed`                             |
| GET    | /filters/adopters     | Filter adopters by `homeType`, `experience`                            |
| GET    | /filters/applications | Filter applications by `status`, `dog_id`, `adopter_id`                |
| GET    | /filters/medical      | Filter medical records by `dog_id`, `vet_name`, `startDate`, `endDate` |

---

## Testing

Use **Postman** or **Insomnia**:

* Set `Content-Type: application/json`
* Test each route with the JSON examples above.
* Filtering works with query parameters:

```
GET http://localhost:5555/filters/dogs?minAge=1&maxAge=5&breed=Golden Retriever
```

---

## Notes

* All `_id` fields are MongoDB ObjectIds.
* Dates are in ISO 8601 format.
* Routes return JSON objects.

---

## License

This project is open-source and free to use.
