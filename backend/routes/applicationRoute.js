import express from "express";
import { Application } from "../models/ApplicationModel.js";
import { Dog } from "../models/DogModel.js";
import { Adopter } from "../models/adopterModel.js";

const router = express.Router();

// ✅ Create a new application
router.post("/add", async (req, res) => {
  try {
    const { dog_id, adopter_id, status } = req.body;

    if (!dog_id || !adopter_id) {
      return res.status(400).json({ error: "dog_id and adopter_id are required." });
    }

    // Verify dog and adopter exist
    const dog = await Dog.findById(dog_id);
    const adopter = await Adopter.findById(adopter_id);

    if (!dog) return res.status(404).json({ error: "Dog not found." });
    if (!adopter) return res.status(404).json({ error: "Adopter not found." });

    const application = new Application({
      dog: dog_id,
      adopter: adopter_id,
      status: status || "Submitted"
    });

    const savedApplication = await application.save();
    res.status(201).json(savedApplication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get all applications
router.get("/", async (req, res) => {
  try {
    const { status, dog_id, adopter_id, startDate, endDate, includeAvailableDogs } = req.query;

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (dog_id) filter.dog = dog_id;
    if (adopter_id) filter.adopter = adopter_id;

    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    // Handle "Include Dogs Not Yet Adopted" checkbox
    if (includeAvailableDogs === "true") {
      // Find IDs of dogs that already have an approved application
      const adoptedDogs = await Application.distinct("dog", { status: "Approved" });
      filter.dog = { $nin: adoptedDogs };
    }

    const applications = await Application.find(filter)
      .populate("dog")
      .populate("adopter")
      .sort({ submittedAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get single application by ID
router.get("/:id", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("dog")
      .populate("adopter");

    if (!application) return res.status(404).json({ error: "Application not found." });

    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update application
router.put("/:id", async (req, res) => {
  try {
    const { dog_id, adopter_id, status } = req.body;

    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      { dog: dog_id, adopter: adopter_id, status },
      { new: true, runValidators: true }
    );

    if (!updatedApplication) return res.status(404).json({ error: "Application not found." });

    res.status(200).json(updatedApplication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete application
router.delete("/:id", async (req, res) => {
  try {
    const deletedApplication = await Application.findByIdAndDelete(req.params.id);

    if (!deletedApplication) return res.status(404).json({ error: "Application not found." });

    res.status(200).json({ message: "Application deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// calculate stats
// ✅ Get applications statistics with optional filters
router.get("/stats", async (req, res) => {
  try {
    const { status, dog_id, adopter_id, startDate, endDate, includeAvailableDogs } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (dog_id) filter.dog = dog_id;
    if (adopter_id) filter.adopter = adopter_id;

    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    if (includeAvailableDogs === "true") {
      const adoptedDogs = await Application.distinct("dog", { status: "Approved" });
      filter.dog = { $nin: adoptedDogs };
    }

    const applications = await Application.find(filter);

    const total = applications.length;

    // Count by status
    const byStatus = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    // Average applications per dog
    const uniqueDogs = new Set(applications.map(app => app.dog.toString()));
    const averageApplicationsPerDog = uniqueDogs.size ? total / uniqueDogs.size : 0;

    res.json({
      total,
      byStatus,
      averageApplicationsPerDog
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
