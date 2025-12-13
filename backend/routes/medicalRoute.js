import express from "express";
import {MedicalRecords} from "../models/recordModel.js";
import { Dog } from "../models/DogModel.js";

const router = express.Router();

// ✅ Create new medical record
router.post("/add", async (req, res) => {
  try {
    const { dog_id, description, treatment_date, vet_name, notes } = req.body;

    if (!dog_id || !description) {
      return res.status(400).json({ error: "dog_id and description are required." });
    }

    // Verify dog exists
    const dog = await Dog.findById(dog_id);
    if (!dog) return res.status(404).json({ error: "Dog not found." });

    const record = new MedicalRecords({
      dog_id: dog_id,
      description,
      treatment_date: treatment_date || Date.now(),
      vet_name,
      notes
    });

    const savedRecord = await record.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get all medical records
router.get("/", async (req, res) => {
  try {
    const { dog_id } = req.query;
    const filter = {};
    if (dog_id) filter.dog_id = dog_id;
    
    const records = await MedicalRecords.find(filter).populate("dog_id").sort({ treatment_date: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get single record by ID
router.get("/:id", async (req, res) => {
  try {
    const record = await MedicalRecords.findById(req.params.id).populate("dog_id");

    if (!record) return res.status(404).json({ error: "Medical record not found." });

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update medical record
router.put("/:id", async (req, res) => {
  try {
    const { dog_id, description, treatment_date, vet_name, notes } = req.body;

    const updatedRecord = await MedicalRecords.findByIdAndUpdate(
      req.params.id,
      { dog_id: dog_id, description, treatment_date, vet_name, notes },
      { new: true, runValidators: true }
    );

    if (!updatedRecord) return res.status(404).json({ error: "Medical record not found." });

    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete medical record
router.delete("/:id", async (req, res) => {
  try {
    const deletedRecord = await MedicalRecords.findByIdAndDelete(req.params.id);

    if (!deletedRecord) return res.status(404).json({ error: "Medical record not found." });

    res.status(200).json({ message: "Medical record deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
