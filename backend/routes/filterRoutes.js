import express from "express";
import { Dog } from "../models/DogModel.js";
import { Adopter } from "../models/adopterModel.js";
import { Application } from "../models/ApplicationModel.js";
import MedicalRecord from "../models/recordModel.js";

const router = express.Router();

/**
 * FILTER DOGS
 * Example: GET /filters/dogs?minAge=1&maxAge=5&breed=Golden Retriever
 */
router.get("/dogs", async (req, res) => {
  try {
    const { minAge, maxAge, breed } = req.query;

    const filter = {};
    if (minAge) filter.age = { ...filter.age, $gte: Number(minAge) };
    if (maxAge) filter.age = { ...filter.age, $lte: Number(maxAge) };
    if (breed) filter.breed = breed;

    const dogs = await Dog.find(filter).lean();
    res.json(dogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * FILTER ADOPTERS
 * Example: GET /filters/adopters?homeType=Apartment&experience=None
 */
router.get("/adopters", async (req, res) => {
  try {
    const { homeType, experience } = req.query;
    const filter = {};
    if (homeType) filter.homeType = homeType;
    if (experience) filter.experience = experience;

    const adopters = await Adopter.find(filter).lean();
    res.json(adopters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * FILTER APPLICATIONS
 * Example: GET /filters/applications?status=Submitted&startDate=2025-01-01&endDate=2025-12-31
 */
router.get("/applications", async (req, res) => {
  try {
    const { status, dog_id, adopter_id, startDate, endDate } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (dog_id) filter.dog = dog_id;
    if (adopter_id) filter.adopter = adopter_id;
    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    const applications = await Application.find(filter)
      .populate("dog")
      .populate("adopter")
      .lean();

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET APPLICATION STATISTICS
 * Example: GET /filters/applications/stats?status=Submitted&startDate=2025-01-01&endDate=2025-12-31
 */
router.get("/applications/stats", async (req, res) => {
  try {
    const { status, dog_id, adopter_id, startDate, endDate } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (dog_id) filter.dog = dog_id;
    if (adopter_id) filter.adopter = adopter_id;
    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    const applications = await Application.find(filter)
      .populate("dog")
      .populate("adopter")
      .lean();

    const total = applications.length;
    const byStatus = {
      Submitted: applications.filter(a => a.status === "Submitted").length,
      Approved: applications.filter(a => a.status === "Approved").length,
      Rejected: applications.filter(a => a.status === "Rejected").length,
      "In Review": applications.filter(a => a.status === "In Review").length,
    };

    // Calculate average processing time (days from submission to now, or to status change)
    const now = new Date();
    const processingTimes = applications
      .map(app => {
        const submitted = new Date(app.submittedAt);
        return (now - submitted) / (1000 * 60 * 60 * 24); // Convert to days
      })
      .filter(time => time >= 0);
    
    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    // Acceptance rate (Approved / Total)
    const acceptanceRate = total > 0 ? (byStatus.Approved / total) * 100 : 0;

    // Average applications per dog (if multiple applications for same dog)
    const uniqueDogs = new Set(applications.map(a => a.dog?._id?.toString()).filter(Boolean));
    const avgApplicationsPerDog = uniqueDogs.size > 0 ? total / uniqueDogs.size : 0;

    res.json({
      total,
      byStatus,
      averageProcessingTimeDays: Math.round(avgProcessingTime * 100) / 100,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      averageApplicationsPerDog: Math.round(avgApplicationsPerDog * 100) / 100,
      uniqueDogsCount: uniqueDogs.size,
      uniqueAdoptersCount: new Set(applications.map(a => a.adopter?._id?.toString()).filter(Boolean)).size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * FILTER MEDICAL RECORDS
 * Example: GET /filters/medical?dog_id=690d25d34ac6e0021ac28b14&vet_name=Dr. Smith
 */
router.get("/medical", async (req, res) => {
  try {
    const { dog_id, vet_name, startDate, endDate } = req.query;
    const filter = {};

    if (dog_id) filter.animal_id = dog_id;
    if (vet_name) filter.vet_name = vet_name;
    if (startDate) filter.treatment_date = { ...filter.treatment_date, $gte: new Date(startDate) };
    if (endDate) filter.treatment_date = { ...filter.treatment_date, $lte: new Date(endDate) };

    const records = await MedicalRecord.find(filter)
      .populate("animal_id")
      .lean();

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
