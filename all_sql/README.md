# Running Database Schemas

All 35 tables are converted to MySQL-compatible syntax and located in this directory (`all_sql/`).

## How to run all queries automatically in one script

A script has been provided at `src/sql/scripts/run-schemas.js` to automatically read, connect, and execute all `.sql` files in sequence.

### Prerequisites
1. Ensure your local MySQL server is running.
2. Configure your MySQL credentials in the `.env` file at the root of the project:
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=api_car
   ```

### Execution
Run the following command from the root of the project:
```bash
node src/sql/scripts/run-schemas.js
```

This script will:
- Check if your configured database exists, and create it if it doesn't.
- Connect to the database.
- Execute all 35 SQL scripts sequentially in alphanumeric order.
