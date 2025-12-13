import mongoose from "mongoose";

const medicalRecordsSchema = mongoose.Schema({
  
  record_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },

  dog_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dog",
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  treatment_date: {
    type: Date,
    required: true,
    default: Date.now,
  },

  vet_name: {
    type: String,
    required: false,
  },

  notes: {
    type: String,
    required: false,
  }

});

// Indexes for efficient querying
// Index on dog_id for finding all medical records for a specific dog (used in medical record queries)
medicalRecordsSchema.index({ dog_id: 1 });

// Index on treatment_date for date range queries and sorting (used in medical record filters)
medicalRecordsSchema.index({ treatment_date: -1 });

// Index on vet_name for filtering by veterinarian (used in filter routes)
medicalRecordsSchema.index({ vet_name: 1 });

// Compound index for dog_id and treatment_date (used in queries that filter by both dog and date range)
medicalRecordsSchema.index({ dog_id: 1, treatment_date: -1 });

export const MedicalRecords = mongoose.model("MedicalRecord", medicalRecordsSchema)