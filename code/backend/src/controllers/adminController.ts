import { Request, Response } from 'express';
import * as adminService from '../services/adminService';

export async function getAdminSummary(req: Request, res: Response): Promise<void> {
  try {
    const summary = await adminService.getAdminSummary();
    res.status(200).json(summary);
  } catch (error) {
    console.error('Admin summary error:', error);
    res.status(500).json({
      message: 'Failed to fetch admin summary'
    });
  }
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const role = req.query.role as string | undefined;
    const users = await adminService.getUsers(role);
    res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Failed to fetch users'
    });
  }
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.id as string, 10);
    const { is_approved } = req.body;
    
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }
    if (typeof is_approved !== 'boolean') {
      res.status(400).json({ message: 'is_approved must be a boolean' });
      return;
    }

    const updatedUser = await adminService.updateUserStatus(userId, is_approved);
    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error('Update user status error:', error);
    res.status(500).json({
      message: error.message || 'Failed to update user status'
    });
  }
}

export async function getStudents(req: Request, res: Response): Promise<void> {
  try {
    const students = await adminService.getStudents();
    res.status(200).json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      message: 'Failed to fetch students'
    });
  }
}
