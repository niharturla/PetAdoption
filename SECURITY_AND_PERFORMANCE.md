# Security and Performance Documentation

## 1. SQL Injection Protection (NoSQL Injection Protection)

### Protection Mechanisms

Our application uses MongoDB (NoSQL database) and implements multiple layers of protection against injection attacks:

#### a. MongoDB Sanitization Middleware
- **Location**: `backend/index.js`
- **Implementation**: We use the `express-mongo-sanitize` package to automatically sanitize all incoming requests
- **Code**:
  ```javascript
  app.use(mongoSanitize()); // protect against NoSQL injection attacks
  ```
- **What it does**: 
  - Removes any keys that start with `$` or contain `.` from user input
  - Prevents MongoDB operators like `$gt`, `$ne`, `$regex`, etc. from being injected
  - Protects against attacks like: `{ "username": { "$ne": null }, "password": { "$ne": null } }`

#### b. Input Validation and Type Enforcement
- **Mongoose Schema Validation**: All models use strict schema validation
- **Type Enforcement**: Fields are explicitly typed (String, Number, Date, ObjectId)
- **Enum Validation**: Status fields use enum validation to restrict values
- **Example**: 
  ```javascript
  status: {
    type: String,
    enum: ["Available", "Pending", "Adopted"],
    default: "Available",
  }
  ```

#### c. Parameterized Queries
- **Mongoose ODM**: All database queries use Mongoose, which automatically parameterizes queries
- **ObjectId Validation**: MongoDB ObjectIds are validated before use
- **Example**: 
  ```javascript
  const dog = await Dog.findById(dogId); // Safe - Mongoose validates ObjectId format
  ```

#### d. Custom Sanitization Function
- **Location**: `backend/index.js`
- **Additional Layer**: Custom sanitization function that recursively removes dangerous keys
- **Code**:
  ```javascript
  const sanitize = (obj) => {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      }
      if (typeof obj[key] === "object") sanitize(obj[key]);
    }
  };
  ```

#### e. Input Type Conversion
- **Explicit Type Conversion**: Query parameters are explicitly converted to proper types
- **Example**: 
  ```javascript
  if (minAge) filter.age = { ...filter.age, $gte: Number(minAge) };
  ```

### Attack Prevention Examples

**Prevented Attack 1**: NoSQL Injection via query parameters
```
GET /applications?status[$ne]=Rejected
```
**Protection**: mongoSanitize removes `$ne`, making the query invalid

**Prevented Attack 2**: Injection via request body
```json
{
  "username": { "$gt": "" },
  "password": { "$gt": "" }
}
```
**Protection**: mongoSanitize sanitizes the body, removing `$gt` operators

---

## 2. Database Indexes

### Index Strategy

Indexes are strategically placed on frequently queried fields to optimize query performance. Below is a comprehensive list of all indexes and their usage.

### Dog Model Indexes

#### Index 1: `{ status: 1 }`
- **Purpose**: Filter dogs by availability status
- **Queries Supported**:
  - `Dog.find({ status: "Available" })` - Used in `dogRoute.js` to get available dogs
  - `Dog.find({ status: "Pending" })` - Used in status filtering
  - **Location**: Dog listings, filter routes, reports
- **Performance Impact**: O(log n) instead of O(n) for status-based queries

#### Index 2: `{ breed: 1 }`
- **Purpose**: Filter dogs by breed
- **Queries Supported**:
  - `Dog.find({ breed: "Golden Retriever" })` - Used in `filterRoutes.js` breed filtering
  - **Location**: Filter routes (`/filters/dogs?breed=...`)
- **Performance Impact**: Fast breed-based searches in reports

#### Index 3: `{ status: 1, availableUntil: 1 }` (Compound)
- **Purpose**: Find available dogs that need status updates
- **Queries Supported**:
  - `Dog.find({ status: "Available", availableUntil: { $lte: now } })` - Used in `dogRoute.js` `/checkStatuses` endpoint
  - **Location**: Automatic status update functionality
- **Performance Impact**: Critical for the status check cron job/endpoint

#### Index 4: `{ intakeDate: -1 }`
- **Purpose**: Sort dogs by intake date (newest first)
- **Queries Supported**:
  - `Dog.find().sort({ intakeDate: -1 })` - Used in reports and listings
  - **Location**: Reports with date sorting
- **Performance Impact**: Efficient sorting for chronological reports

### Application Model Indexes

#### Index 1: `{ status: 1 }`
- **Purpose**: Filter applications by status
- **Queries Supported**:
  - `Application.find({ status: "Submitted" })` - Used extensively in reports
  - `Application.distinct("dog", { status: "Approved" })` - Used to find adopted dogs
  - **Location**: `applicationRoute.js`, `filterRoutes.js`, reports
- **Performance Impact**: Essential for status-based filtering in reports

#### Index 2: `{ dog: 1 }`
- **Purpose**: Find all applications for a specific dog
- **Queries Supported**:
  - `Application.find({ dog: dogId })` - Used when checking if dog has applications
  - `Application.deleteMany({ dog: dog_id })` - Used when dog is adopted
  - **Location**: `dogRoute.js` deleteApps endpoint, application queries
- **Performance Impact**: Fast lookup when removing applications for adopted dogs

#### Index 3: `{ adopter: 1 }`
- **Purpose**: Find all applications by a specific adopter
- **Queries Supported**:
  - `Application.find({ adopter: adopterId })` - Used in adopter reports
  - **Location**: Filter routes, adopter-specific reports
- **Performance Impact**: Efficient adopter history queries

#### Index 4: `{ submittedAt: -1 }`
- **Purpose**: Sort applications by submission date
- **Queries Supported**:
  - `Application.find().sort({ submittedAt: -1 })` - Used in all application listings
  - **Location**: `applicationRoute.js`, reports
- **Performance Impact**: Fast chronological sorting

#### Index 5: `{ status: 1, submittedAt: -1 }` (Compound)
- **Purpose**: Filter by status and sort by date
- **Queries Supported**:
  - `Application.find({ status: "Approved" }).sort({ submittedAt: -1 })` - Used in reports
  - **Location**: Reports with status and date filters
- **Performance Impact**: Optimizes common report queries

#### Index 6: `{ dog: 1, status: 1 }` (Compound)
- **Purpose**: Find approved applications for a dog
- **Queries Supported**:
  - `Application.find({ dog: dogId, status: "Approved" })` - Used to check if dog is already adopted
  - **Location**: Application validation, adoption checks
- **Performance Impact**: Fast lookup for adoption status checks

### Adopter Model Indexes

#### Index 1: `{ homeType: 1 }`
- **Purpose**: Filter adopters by home type
- **Queries Supported**:
  - `Adopter.find({ homeType: "House" })` - Used in filter routes
  - **Location**: `filterRoutes.js` adopter filtering
- **Performance Impact**: Efficient home type filtering

#### Index 2: `{ experience: 1 }`
- **Purpose**: Filter adopters by experience level
- **Queries Supported**:
  - `Adopter.find({ experience: "Experienced" })` - Used in filter routes
  - **Location**: `filterRoutes.js` adopter filtering
- **Performance Impact**: Fast experience-based queries

#### Index 3: `{ homeType: 1, experience: 1 }` (Compound)
- **Purpose**: Complex adopter filtering
- **Queries Supported**:
  - `Adopter.find({ homeType: "House", experience: "Experienced" })` - Used in advanced filters
  - **Location**: Complex filter queries in reports
- **Performance Impact**: Optimizes multi-criteria adopter searches

### AdoptedDog Model Indexes

#### Index 1: `{ adoptedDate: -1 }`
- **Purpose**: Sort adopted dogs by adoption date (newest first)
- **Queries Supported**:
  - `AdoptedDog.find().sort({ adoptedDate: -1 }).limit(50)` - Used in adopted dogs listing
  - **Location**: `dogRoute.js` `/adopted` endpoint
- **Performance Impact**: Efficient sorting for "recent adoptions" display

#### Index 2: `{ adopter: 1 }`
- **Purpose**: Filter adopted dogs by adopter
- **Queries Supported**:
  - `AdoptedDog.find({ adopter: adopterId })` - Used in adopter-specific reports
  - **Location**: Reports filtering by adopter
- **Performance Impact**: Fast adopter history queries

#### Index 3: `{ adoptedDate: -1, adopter: 1 }` (Compound)
- **Purpose**: Date range queries with adopter filtering
- **Queries Supported**:
  - `AdoptedDog.find({ adopter: adopterId, adoptedDate: { $gte: startDate, $lte: endDate } })` - Used in reports
  - **Location**: Reports with date and adopter filters
- **Performance Impact**: Optimizes complex report queries

### Medical Records Model Indexes

#### Index 1: `{ dog_id: 1 }`
- **Purpose**: Find all medical records for a specific dog
- **Queries Supported**:
  - `MedicalRecords.find({ dog_id: dogId })` - Used in medical record queries
  - **Location**: Medical record routes
- **Performance Impact**: Fast lookup of dog's medical history

#### Index 2: `{ treatment_date: -1 }`
- **Purpose**: Sort medical records by treatment date
- **Queries Supported**:
  - `MedicalRecords.find().sort({ treatment_date: -1 })` - Used in medical record listings
  - **Location**: Medical record routes
- **Performance Impact**: Efficient chronological sorting

#### Index 3: `{ vet_name: 1 }`
- **Purpose**: Filter medical records by veterinarian
- **Queries Supported**:
  - `MedicalRecords.find({ vet_name: "Dr. Smith" })` - Used in filter routes
  - **Location**: `filterRoutes.js` medical filtering
- **Performance Impact**: Fast veterinarian-based queries

#### Index 4: `{ dog_id: 1, treatment_date: -1 }` (Compound)
- **Purpose**: Get medical records for a dog sorted by date
- **Queries Supported**:
  - `MedicalRecords.find({ dog_id: dogId }).sort({ treatment_date: -1 })` - Used in dog medical history
  - **Location**: Medical record queries with date sorting
- **Performance Impact**: Optimizes common medical record queries

---

## 3. Transactions and Isolation Levels

### Transaction Implementation

Our application uses MongoDB transactions to ensure data consistency, especially in critical operations like marking a dog as adopted.

### Transaction Usage

#### Example: Found Home Endpoint
**Location**: `backend/routes/dogRoute.js` - `/foundHome/:id` endpoint

**Why Transactions Are Needed**:
When a dog finds a home, we need to:
1. Create a record in the AdoptedDog collection
2. Delete all applications for that dog
3. Delete the dog from the main Dog collection

If any of these operations fail, we need to rollback all changes to maintain data consistency.

**Implementation**:
```javascript
router.post("/foundHome/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // All operations use the same session
    const dog = await Dog.findById(dogId).session(session);
    const adoptedDog = new AdoptedDog({...});
    await adoptedDog.save({ session });
    await Application.deleteMany({ dog: dogId }).session(session);
    await Dog.findByIdAndDelete(dogId).session(session);
    
    await session.commitTransaction();
    session.endSession();
    // Success response
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    // Error response
  }
});
```

### Isolation Level

**MongoDB Default Isolation**: MongoDB uses **Snapshot Isolation** by default, which provides:
- **Read Consistency**: All reads within a transaction see a consistent snapshot of the data
- **Write Isolation**: Writes are isolated until the transaction commits
- **Prevents**: Dirty reads, non-repeatable reads, and phantom reads

### Concurrency Considerations

#### Single User vs. Multi-User Design

**Current Design**: The application is designed to handle **multiple concurrent users**. Here's how:

1. **Transaction Isolation**: MongoDB transactions ensure that concurrent operations don't interfere with each other
2. **Optimistic Concurrency**: Mongoose uses versioning to detect conflicts
3. **Atomic Operations**: Critical operations use transactions to ensure atomicity

#### Multi-User Scenarios

**Scenario 1: Two users trying to adopt the same dog**
- **Problem**: Both users click "Found Home" for the same dog
- **Solution**: The transaction ensures only one succeeds. The second transaction will either:
  - Fail because the dog no longer exists (if first transaction committed)
  - Wait for the first transaction to complete (MongoDB handles this)

**Scenario 2: User viewing applications while another user adopts a dog**
- **Problem**: User A is viewing applications, User B adopts a dog (removes it from applications)
- **Solution**: 
  - User A sees a consistent snapshot (snapshot isolation)
  - The application list will update on next refresh
  - No data corruption occurs

**Scenario 3: Concurrent application submissions**
- **Problem**: Multiple users submit applications for the same dog simultaneously
- **Solution**: 
  - Each application is created independently (no conflict)
  - When dog is adopted, all applications are deleted atomically via transaction

### Transaction Best Practices Implemented

1. **Always use sessions**: All operations in a transaction use the same session
2. **Error handling**: Always abort transaction on error
3. **Session cleanup**: Always end session after transaction completes
4. **Atomic operations**: Related operations are grouped in transactions

### Future Enhancements for Higher Concurrency

If the application needs to handle very high concurrency, we could implement:

1. **Pessimistic Locking**: Lock documents during critical operations
2. **Retry Logic**: Retry failed transactions with exponential backoff
3. **Queue System**: Queue adoption requests to process sequentially
4. **Optimistic Locking**: Use version fields to detect and handle conflicts

---

## Summary

### Security
- ✅ NoSQL injection protection via `express-mongo-sanitize`
- ✅ Schema validation and type enforcement
- ✅ Parameterized queries through Mongoose
- ✅ Custom sanitization functions

### Performance
- ✅ 20+ strategic indexes across all models
- ✅ Compound indexes for complex queries
- ✅ Indexes support all major queries and reports

### Data Integrity
- ✅ Transactions for critical operations
- ✅ Snapshot isolation for consistency
- ✅ Multi-user concurrency support
- ✅ Atomic operations for data consistency

