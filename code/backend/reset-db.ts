import { pool } from './src/config/db';

async function resetDb() {
  try {
    console.log("Dropping public schema...");
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;');
    console.log("Schema reset successfully.");
  } catch (error) {
    console.error("Error resetting schema:", error);
  } finally {
    process.exit(0);
  }
}

resetDb();
