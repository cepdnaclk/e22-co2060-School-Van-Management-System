import { pool } from "../config/db";

export interface Journey {
  id: number;
  driver_id: number;
  route_id: number;
  status: string;
  started_at: Date;
  completed_at: Date | null;
}

/**
 * Create a new journey for a driver + route
 */
export async function createJourney(driverId: number, routeId: number): Promise<Journey> {
  const result = await pool.query(
    `INSERT INTO journeys (driver_id, route_id, status)
     VALUES ($1, $2, 'pickup_started')
     RETURNING *`,
    [driverId, routeId]
  );
  return result.rows[0];
}

/**
 * Update journey status
 */
export async function updateJourneyStatus(
  journeyId: number,
  status: string,
  completedAt?: Date
): Promise<Journey> {
  const result = await pool.query(
    `UPDATE journeys
     SET status = $1, completed_at = $2
     WHERE id = $3
     RETURNING *`,
    [status, completedAt || null, journeyId]
  );
  return result.rows[0];
}

/**
 * Get active (non-completed) journey for a driver
 */
export async function getActiveJourneyByDriver(driverId: number): Promise<Journey | null> {
  const result = await pool.query(
    `SELECT j.*, r.route_name
     FROM journeys j
     JOIN routes r ON r.id = j.route_id
     WHERE j.driver_id = $1 AND j.status != 'completed'
     ORDER BY j.started_at DESC
     LIMIT 1`,
    [driverId]
  );
  return result.rows[0] || null;
}

/**
 * Get journey by ID
 */
export async function getJourneyById(journeyId: number): Promise<Journey | null> {
  const result = await pool.query(
    `SELECT j.*, r.route_name
     FROM journeys j
     JOIN routes r ON r.id = j.route_id
     WHERE j.id = $1`,
    [journeyId]
  );
  return result.rows[0] || null;
}

/**
 * Get journey history for a driver
 */
export async function getJourneysByDriver(driverId: number): Promise<Journey[]> {
  const result = await pool.query(
    `SELECT j.*, r.route_name
     FROM journeys j
     JOIN routes r ON r.id = j.route_id
     WHERE j.driver_id = $1
     ORDER BY j.started_at DESC`,
    [driverId]
  );
  return result.rows;
}

/**
 * Get students assigned to a route (via route_stops and parent_students)
 * Returns boarding/dropoff status for the given journey
 */
export async function getStudentsForJourney(journeyId: number): Promise<any[]> {
  const result = await pool.query(
    `SELECT DISTINCT
       s.id AS student_id,
       s.name AS student_name,
       sb.boarded_at,
       sd.dropped_at,
       EXISTS (
         SELECT 1 FROM student_absences sa
         WHERE sa.student_id = s.id
           AND sa.absence_date = j.started_at::DATE
           AND (
             sa.session_type = 'both'
             OR sa.session_type = CASE
               WHEN j.status IN ('pickup_started', 'heading_to_school', 'arrived_at_school') THEN 'morning'
               ELSE 'afternoon'
             END
           )
       ) AS is_absent
     FROM journeys j
     JOIN routes r ON r.id = j.route_id
     JOIN route_stops rs ON rs.route_id = r.id
     JOIN students s ON (s.pickup_stop_id = rs.id OR s.dropoff_stop_id = rs.id)
     LEFT JOIN student_boarding sb ON sb.journey_id = j.id AND sb.student_id = s.id
     LEFT JOIN student_dropoff sd ON sd.journey_id = j.id AND sd.student_id = s.id
     WHERE j.id = $1
     ORDER BY s.name`,
    [journeyId]
  );
  return result.rows;
}

/**
 * Get boarding/dropoff attendance for past journeys of a driver
 */
export async function getAttendanceByDriver(driverId: number): Promise<any[]> {
  const result = await pool.query(
    `SELECT
       j.id AS journey_id,
       j.started_at,
       j.completed_at,
       j.status,
       r.route_name,
       COUNT(DISTINCT sb.student_id) AS boarded_count,
       COUNT(DISTINCT sd.student_id) AS dropped_count
     FROM journeys j
     JOIN routes r ON r.id = j.route_id
     LEFT JOIN student_boarding sb ON sb.journey_id = j.id
     LEFT JOIN student_dropoff sd ON sd.journey_id = j.id
     WHERE j.driver_id = $1
     GROUP BY j.id, r.route_name
     ORDER BY j.started_at DESC`,
    [driverId]
  );
  return result.rows;
}
