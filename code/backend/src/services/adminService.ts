import db from '../config/db';

export interface AdminSummary {
  totalUsers: number;
  totalVehicles: number;
  activeRoutes: number;
}

export async function getAdminSummary(): Promise<AdminSummary> {
  try {
    const usersQuery = `SELECT COUNT(*) AS total_users FROM users`;
    const vehiclesQuery = `SELECT COUNT(*) AS total_vehicles FROM vehicles`;
    const routesQuery = `
      SELECT COUNT(*) AS active_routes
      FROM routes
      WHERE status = 'active'
    `;

    const usersResult = await db.query(usersQuery);
    const vehiclesResult = await db.query(vehiclesQuery);
    const routesResult = await db.query(routesQuery);

    return {
      totalUsers: parseInt(usersResult.rows[0].total_users, 10),
      totalVehicles: parseInt(vehiclesResult.rows[0].total_vehicles, 10),
      activeRoutes: parseInt(routesResult.rows[0].active_routes, 10)
    };

  } catch (error) {
    console.error("Error fetching admin summary:", error);
    throw error;
  }
}

export async function getUsers(role?: string): Promise<any[]> {
  try {
    let query = `SELECT id, name, email, role, phone, is_approved, created_at FROM users`;
    const params: any[] = [];

    if (role) {
      query += ` WHERE role = $1`;
      params.push(role);
    }
    
    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function updateUserStatus(userId: number, isApproved: boolean): Promise<any> {
  try {
    const query = `
      UPDATE users 
      SET is_approved = $1
      WHERE id = $2
      RETURNING id, name, email, role, phone, is_approved
    `;
    const result = await db.query(query, [isApproved, userId]);
    if (result.rows.length === 0) {
      throw new Error("User not found");
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
}

export async function getStudents(): Promise<any[]> {
  try {
    const query = `
      SELECT 
        s.id, s.name, s.school, s.status,
        rs1.stop_name as pickup_stop,
        rs2.stop_name as dropoff_stop,
        u.name as parent_name,
        u.phone as parent_phone
      FROM students s
      LEFT JOIN route_stops rs1 ON s.pickup_stop_id = rs1.id
      LEFT JOIN route_stops rs2 ON s.dropoff_stop_id = rs2.id
      LEFT JOIN parent_students ps ON s.id = ps.student_id
      LEFT JOIN users u ON ps.parent_id = u.id
      ORDER BY s.id DESC
    `;
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
}
