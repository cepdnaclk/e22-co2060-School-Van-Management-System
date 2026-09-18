import express from 'express';
import { getAdminSummary, getUsers, updateUserStatus, getStudents } from '../controllers/adminController';

const router = express.Router();

// GET /api/admin/summary
router.get('/summary', getAdminSummary);

// User & Role Management
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);

// Student Management
router.get('/students', getStudents);

export default router;
