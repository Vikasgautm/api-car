const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'api_car',
};

async function main() {
  console.log('Starting schema execution...');
  console.log(`Connecting to MySQL host: ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}`);

  let connection;
  try {
    // 1. First, connect without specifying database to ensure it exists
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true,
    });

    console.log(`Ensuring database "${dbConfig.database}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await connection.query(`USE \`${dbConfig.database}\``);
    console.log(`Database "${dbConfig.database}" selected.`);
  } catch (error) {
    console.error('Failed to establish database connection:', error.message);
    process.exit(1);
  }

  // 2. Read all SQL files from all_sql directory
  const sqlDir = path.join(__dirname, '../../../all_sql');
  if (!fs.existsSync(sqlDir)) {
    console.error(`Directory not found: ${sqlDir}`);
    await connection.end();
    process.exit(1);
  }

  const files = fs.readdirSync(sqlDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Sort so they run in order (e.g. 001_, 002_, ...)

  console.log(`Found ${files.length} SQL files to execute.`);

  for (const file of files) {
    const filePath = path.join(sqlDir, file);
    console.log(`Executing ${file}...`);
    try {
      const sqlContent = fs.readFileSync(filePath, 'utf8').trim();
      if (!sqlContent) {
        console.log(`Skipped ${file} (empty file).`);
        continue;
      }
      
      // Execute the entire SQL script (multiple statements are allowed by multipleStatements: true)
      await connection.query(sqlContent);
      console.log(`Successfully executed ${file}`);
    } catch (error) {
      console.error(`❌ Error executing ${file}:`, error.message);
      // We continue executing other tables even if one fails (in case of circular constraints, etc.)
    }
  }

  await connection.end();
  console.log('Schema execution completed successfully!');
}

main().catch(error => {
  console.error('Unexpected error in runner:', error);
  process.exit(1);
});
