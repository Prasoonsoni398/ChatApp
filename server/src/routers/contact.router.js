import express from "express";
import {
  searchByPhone,
  getContacts,
  addContact,
  updateContactName,
  removeContact,
} from "../controllers/contact.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET  /api/contacts?phone=+91xxxxxxxxxx  — search user by phone
router.get("/search", protect, searchByPhone);

// GET  /api/contacts  — list my contacts
router.get("/", protect, getContacts);

// POST /api/contacts  — add contact by userId (optional customName)
router.post("/", protect, addContact);

// PUT  /api/contacts/:userId  — edit contact custom nickname
router.put("/:userId", protect, updateContactName);

// DELETE /api/contacts/:userId  — remove contact
router.delete("/:userId", protect, removeContact);

export default router;
