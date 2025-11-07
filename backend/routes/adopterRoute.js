import express from "express";
import { Adopter } from "../models/adopterModel.js";

const router = express.Router();

// ✅ Create (Add) a new adopter
router.post("/add", async (req, res) => {
  try {
    const { name, phone, homeType, experience } = req.body;

    if (!name || !phone || !homeType) {
      return res.status(400).json({ error: "name, phone, and homeType are required." });
    }

    const adopter = new Adopter({
      name,
      phone,
      homeType,
      experience
    });

    const savedAdopter = await adopter.save();
    res.status(201).json(savedAdopter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get all adopters
router.get("/", async (req, res) => {
  try {
    const adopters = await Adopter.find();
    res.status(200).json(adopters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get single adopter by ID
router.get("/:id", async (req, res) => {
  try {
    const adopter = await Adopter.findById(req.params.id);

    if (!adopter) {
      return res.status(404).json({ error: "Adopter not found." });
    }

    res.status(200).json(adopter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update adopter
router.put("/:id", async (req, res) => {
  try {
    const { name, phone, homeType, experience } = req.body;

    const updatedAdopter = await Adopter.findByIdAndUpdate(
      req.params.id,
      { name, phone, homeType, experience },
      { new: true, runValidators: true }
    );

    if (!updatedAdopter) {
      return res.status(404).json({ error: "Adopter not found." });
    }

    res.status(200).json(updatedAdopter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete adopter
router.delete("/:id", async (req, res) => {
  try {
    const deletedAdopter = await Adopter.findByIdAndDelete(req.params.id);

    if (!deletedAdopter) {
      return res.status(404).json({ error: "Adopter not found." });
    }

    res.status(200).json({ message: "Adopter deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
