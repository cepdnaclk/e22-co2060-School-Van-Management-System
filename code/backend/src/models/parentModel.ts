import { pool } from "../config/db";

export async function getChildrenByParentId(parentId: number) {
  const query = `
    SELECT
      s.id,
      s.name,
      s.school,
      s.pickup_stop_id,
      s.dropoff_stop_id,
      s.pickup_lat,
      s.pickup_lng,
      s.dropoff_lat,
      s.dropoff_lng,
      s.status,
      ps.relationship_type,
      rs1.stop_name as pickup_stop_name,
      rs2.stop_name as dropoff_stop_name,
      r.id as route_id,
      r.route_name,
      r.driver_id
    FROM parent_students ps
    JOIN students s ON ps.student_id = s.id
    LEFT JOIN route_stops rs1 ON s.pickup_stop_id = rs1.id
    LEFT JOIN route_stops rs2 ON s.dropoff_stop_id = rs2.id
    LEFT JOIN routes r ON rs1.route_id = r.id
    WHERE ps.parent_id = $1
    ORDER BY s.name ASC
  `;

  const result = await pool.query(query, [parentId]);
  return result.rows;
}

export interface Child {
    id: number;
    name: string;
    school: string;
    pickup_stop_id: number;
    dropoff_stop_id: number;
    pickup_lat?: number;
    pickup_lng?: number;
    dropoff_lat?: number;
    dropoff_lng?: number;
    status: string;
    current_status?: string;
}
export async function createChild(parentId: number, name: string, school?: string, pickupStopId?: number, dropoffStopId?: number, pickupLat?: number, pickupLng?: number, dropoffLat?: number, dropoffLng?: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const studentRes = await client.query(
      `INSERT INTO students (name, school, pickup_stop_id, dropoff_stop_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, school, pickupStopId, dropoffStopId, pickupLat, pickupLng, dropoffLat, dropoffLng]
    );
    const studentId = studentRes.rows[0].id;

    await client.query(
      `INSERT INTO parent_students (parent_id, student_id) VALUES ($1, $2)`,
      [parentId, studentId]
    );

    await client.query("COMMIT");
    return studentRes.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateChild(studentId: number, name: string, school?: string, pickupStopId?: number, dropoffStopId?: number, pickupLat?: number, pickupLng?: number, dropoffLat?: number, dropoffLng?: number) {
  const query = `
    UPDATE students 
    SET name = $1, school = $2, pickup_stop_id = $3, dropoff_stop_id = $4, 
        pickup_lat = $5, pickup_lng = $6, dropoff_lat = $7, dropoff_lng = $8
    WHERE id = $9
    RETURNING *
  `;
  const result = await pool.query(query, [name, school, pickupStopId, dropoffStopId, pickupLat, pickupLng, dropoffLat, dropoffLng, studentId]);
  return result.rows[0];
}

export async function getChildById(studentId: number) {
  const result = await pool.query("SELECT * FROM students WHERE id = $1", [studentId]);
  return result.rows[0];
}

export async function markChildAbsent(studentId: number, date: string, sessionType: string, reason?: string) {
  const query = `
    INSERT INTO student_absences (student_id, absence_date, session_type, reason)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (student_id, absence_date) 
    DO UPDATE SET session_type = EXCLUDED.session_type, reason = EXCLUDED.reason
    RETURNING *
  `;
  const result = await pool.query(query, [studentId, date, sessionType, reason]);
  return result.rows[0];
}

export async function getChildrenAbsences(studentId: number) {
  const query = `
    SELECT id, student_id, absence_date::TEXT, session_type, reason
    FROM student_absences
    WHERE student_id = $1
    ORDER BY absence_date DESC
  `;
  const result = await pool.query(query, [studentId]);
  return result.rows;
}

export async function deleteChildAbsence(studentId: number, date: string) {
  const query = `
    DELETE FROM student_absences
    WHERE student_id = $1 AND absence_date = $2
    RETURNING *
  `;
  const result = await pool.query(query, [studentId, date]);
  return result.rows[0];
}


export async function getJourneyHistory(parentId: number) {
  const query = `
    SELECT 
      sb.id as event_id,
      'boarding' as type,
      sb.boarded_at as event_time,
      s.name as student_name,
      j.id as journey_id,
      r.route_name
    FROM parent_students ps
    JOIN students s ON ps.student_id = s.id
    JOIN student_boarding sb ON s.id = sb.student_id
    JOIN journeys j ON sb.journey_id = j.id
    JOIN routes r ON j.route_id = r.id
    WHERE ps.parent_id = $1
    UNION ALL
    SELECT 
      sd.id as event_id,
      'dropoff' as type,
      sd.dropped_at as event_time,
      s.name as student_name,
      j.id as journey_id,
      r.route_name
    FROM parent_students ps
    JOIN students s ON ps.student_id = s.id
    JOIN student_dropoff sd ON s.id = sd.student_id
    JOIN journeys j ON sd.journey_id = j.id
    JOIN routes r ON j.route_id = r.id
    WHERE ps.parent_id = $1
    ORDER BY event_time DESC
  `;
  const result = await pool.query(query, [parentId]);
  return result.rows;
}

export async function getEmergencyContacts(parentId: number) {
  const query = `
    SELECT DISTINCT
      u.name as driver_name,
      u.phone as driver_phone,
      r.route_name,
      s.name as student_name
    FROM parent_students ps
    JOIN students s ON ps.student_id = s.id
    JOIN routes r ON (s.pickup_stop_id IN (SELECT id FROM route_stops WHERE route_id = r.id) 
                   OR s.dropoff_stop_id IN (SELECT id FROM route_stops WHERE route_id = r.id))
    JOIN drivers d ON r.driver_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE ps.parent_id = $1
  `;
  const result = await pool.query(query, [parentId]);
  return result.rows;
}

export async function getLatestBoardingForStudent(studentId: number) {
  const query = `
    SELECT
      id,
      journey_id,
      student_id,
      driver_id,
      boarded_at
    FROM student_boarding
    WHERE student_id = $1
    ORDER BY boarded_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows[0] || null;
}

export async function getLatestDropoffForStudent(studentId: number) {
  const query = `
    SELECT
      id,
      journey_id,
      student_id,
      driver_id,
      dropped_at
    FROM student_dropoff
    WHERE student_id = $1
    ORDER BY dropped_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows[0] || null;
}

export async function getLatestLocationByJourneyId(journeyId: number) {
  const query = `
    SELECT
      latitude,
      longitude,
      recorded_at
    FROM journey_locations
    WHERE journey_id = $1
    ORDER BY recorded_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [journeyId]);
  return result.rows[0] || null;
}

export async function getNotificationsByStudentId(studentId: number) {
  const query = `
    SELECT
      id,
      journey_id,
      student_id,
      type,
      message,
      is_read,
      created_at
    FROM notifications
    WHERE student_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows;
}

export async function getJourneyById(journeyId: number) {
  const result = await pool.query("SELECT * FROM journeys WHERE id = $1", [journeyId]);
  return result.rows[0];
}

export async function getAvailableRoutes() {
  const query = `
    SELECT 
      r.id as route_id,
      r.route_name,
      u.name as driver_name,
      u.phone as driver_phone,
      rs.id as stop_id,
      rs.stop_name,
      rs.stop_order,
      rs.latitude,
      rs.longitude
    FROM routes r
    JOIN drivers d ON r.driver_id = d.id
    JOIN users u ON d.user_id = u.id
    LEFT JOIN route_stops rs ON r.id = rs.route_id
    ORDER BY r.id, rs.stop_order
  `;
  const result = await pool.query(query);
  
  // Group by route
  const routesMap: { [key: number]: any } = {};
  result.rows.forEach(row => {
    if (!routesMap[row.route_id]) {
      routesMap[row.route_id] = {
        id: row.route_id,
        name: row.route_name,
        driver_name: row.driver_name,
        driver_phone: row.driver_phone,
        stops: []
      };
    }
    
    if (row.stop_id) {
      routesMap[row.route_id].stops.push({
        id: row.stop_id,
        name: row.stop_name,
        order: row.stop_order,
        latitude: row.latitude,
        longitude: row.longitude
      });
    }
  });
  
  return Object.values(routesMap);
}

export async function getRouteByDriverId(driverId: number) {
  const query = `
    SELECT 
      r.id as route_id,
      r.route_name,
      u.name as driver_name,
      u.phone as driver_phone,
      rs.id as stop_id,
      rs.stop_name,
      rs.stop_order,
      rs.latitude,
      rs.longitude
    FROM routes r
    JOIN drivers d ON r.driver_id = d.id
    JOIN users u ON d.user_id = u.id
    JOIN route_stops rs ON r.id = rs.route_id
    WHERE d.id = $1
    ORDER BY rs.stop_order
  `;
  const result = await pool.query(query, [driverId]);
  
  if (result.rows.length === 0) return null;

  const route = {
    id: result.rows[0].route_id,
    name: result.rows[0].route_name,
    driver_name: result.rows[0].driver_name,
    driver_phone: result.rows[0].driver_phone,
    stops: result.rows.map(row => ({
      id: row.stop_id,
      name: row.stop_name,
      order: row.stop_order,
      latitude: row.latitude,
      longitude: row.longitude
    }))
  };
  
  return route;
}

export async function getNotificationsByParentId(parentId: number) {
  const query = `
    SELECT
      id,
      journey_id,
      user_id,
      student_id,
      type,
      message,
      is_read,
      created_at
    FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [parentId]);
  return result.rows;
}

export async function getActiveJourneyForStudent(studentId: number) {
  const query = `
    SELECT j.id
    FROM journeys j
    JOIN routes r ON j.route_id = r.id
    JOIN route_stops rs ON rs.route_id = r.id
    JOIN students s ON (s.pickup_stop_id = rs.id OR s.dropoff_stop_id = rs.id)
    WHERE s.id = $1 AND j.status != 'completed'
    LIMIT 1
  `;
  const result = await pool.query(query, [studentId]);
  return result.rows[0]?.id || null;
}

/**
 * Get all parent user IDs for students assigned to a given journey.
 * Used by the SOS service to send direct, per-parent notifications.
 */
export async function getParentUserIdsByJourneyId(journeyId: number): Promise<number[]> {
  const query = `
    SELECT DISTINCT ps.parent_id AS user_id
    FROM journeys j
    JOIN routes r ON r.id = j.route_id
    JOIN route_stops rs ON rs.route_id = r.id
    JOIN students s ON (s.pickup_stop_id = rs.id OR s.dropoff_stop_id = rs.id)
    JOIN parent_students ps ON ps.student_id = s.id
    WHERE j.id = $1
    
    UNION
    
    SELECT DISTINCT ps.parent_id AS user_id
    FROM student_boarding sb
    JOIN parent_students ps ON ps.student_id = sb.student_id
    WHERE sb.journey_id = $1
  `;
  const result = await pool.query(query, [journeyId]);
  return result.rows.map((row: { user_id: number }) => row.user_id);
}