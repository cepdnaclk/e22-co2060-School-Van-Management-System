import { Client } from 'pg';

async function testPassword(password: string) {
  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: password,
    database: "school_van_db",
  });
  
  try {
    await client.connect();
    console.log(`Success with password: "${password}"`);
    await client.end();
    return true;
  } catch (err) {
    return false;
  }
}

async function run() {
  const passwords = ["1234", "12345", "123456", "password", "root", "admin", "postgres", ""];
  for (const p of passwords) {
    if (await testPassword(p)) {
      console.log(`Found password: ${p}`);
      return;
    }
  }
  console.log("No password matched.");
}

run();
