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

export default mongoose.model("MedicalRecord", medicalRecordsSchema);
