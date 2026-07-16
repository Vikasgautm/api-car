const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'car_salahakar',
};

async function addColumnIfNotExists(connection, table, column, definition) {
  try {
    const [cols] = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
    if (cols.length === 0) {
      console.log(`Adding missing column \`${column}\` to \`${table}\`...`);
      await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`Successfully added \`${column}\` to \`${table}\`.`);
    }
  } catch (err) {
    console.error(`Error checking/adding column \`${column}\` to \`${table}\`:`, err.message);
  }
}

async function ensureTableExists(connection, table, primaryKeyDef = 'id INT AUTO_INCREMENT PRIMARY KEY') {
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS \`${table}\` (${primaryKeyDef}, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB;`);
  } catch (err) {
    console.error(`Error ensuring table \`${table}\`:`, err.message);
  }
}

async function main() {
  const connection = await mysql.createConnection(dbConfig);
  console.log(`Connected to MySQL database "${dbConfig.database}". Syncing columns...`);

  const tablesToEnsure = [
    'Cars', 'BodyTypes', 'CarVariants', 'SeoCollections', 'Brands', 'Images',
    'Cities', 'Redirects', 'PlatformSettings', 'Categories', 'TaxonomyCategories',
    'Workflows', 'GovernanceWorkflows', 'Ownerships', 'BrandOwnerships',
    'Rankings', 'RankingCollections', 'FuelTypes', 'ImageCategories',
    'ImageSubcategories', 'FAQs', 'SeoPresets', 'PopularCollections',
    'SystemSettings', 'Users', 'CarImages', 'MasterOptions', 'TagCategories',
    'UserSessions', 'MileageBenchmarkOverrides', 'ImportKeyMappings', 'AuditLogs',
    'ImportLogs', 'AdminChatbotLogs', 'ComparisonRivals', 'Comparisons',
    'DeletionRequests', 'EditLocks', 'LifecycleRequests', 'RankingCollectionConfigs',
    'RankingScores', 'SeoSettings', 'VariantSpecKeys', 'WorkflowItems',
    'UnknownValues', 'Blogs', 'Tags'
  ];

  for (const t of tablesToEnsure) {
    await ensureTableExists(connection, t);
  }

  // Common universal columns for ALL tables to prevent ER_BAD_FIELD_ERROR
  const universalColumns = [
    ['_id', 'VARCHAR(100) NULL'],
    ['settings_id', 'VARCHAR(100) NULL'],
    ['group_name', 'VARCHAR(100) NULL'],
    ['car_price', 'INT NULL'],
    ['short_description', 'TEXT NULL'],
    ['total_variants', 'INT DEFAULT 0'],
    ['ev_count', 'INT DEFAULT 0'],
    ['budget_slab', 'VARCHAR(100) NULL'],
    ['body_type_id', 'VARCHAR(100) NULL'],
    ['lifecycle', 'VARCHAR(100) NULL'],
    ['is_deleted', 'TINYINT(1) DEFAULT 0'],
    ['deleted_at', 'DATETIME NULL'],
    ['is_active', 'TINYINT(1) DEFAULT 1'],
    ['is_published', 'TINYINT(1) DEFAULT 1'],
    ['is_featured', 'TINYINT(1) DEFAULT 0'],
    ['status', 'VARCHAR(50) DEFAULT \'active\''],
    ['sort_order', 'INT DEFAULT 0'],
    ['group', 'VARCHAR(100) NULL'],
    ['category', 'VARCHAR(100) NULL'],
    ['seo_title', 'VARCHAR(255) NULL'],
    ['seo_description', 'VARCHAR(500) NULL'],
    ['seo_keywords', 'VARCHAR(500) NULL'],
    ['meta_title', 'VARCHAR(255) NULL'],
    ['meta_description', 'VARCHAR(500) NULL'],
    ['canonical_url', 'VARCHAR(1000) NULL'],
    ['slug', 'VARCHAR(255) NULL'],
    ['name', 'VARCHAR(255) NULL'],
    ['description', 'TEXT NULL'],
    ['data', 'JSON NULL'],
    ['value', 'JSON NULL'],
    ['created_by', 'VARCHAR(100) NULL'],
    ['updated_by', 'VARCHAR(100) NULL'],
    ['search', 'VARCHAR(255) NULL'],
    ['image', 'JSON NULL'],
    ['logo', 'JSON NULL'],
    ['icon', 'JSON NULL'],
    ['public_id', 'VARCHAR(255) NULL'],
    ['updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
    ['created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP'],
    ['intro_content', 'TEXT NULL'],
    ['submitted_at', 'DATETIME NULL'],
    ['total_cars', 'INT DEFAULT 0'],
    ['collection_label', 'VARCHAR(255) NULL'],
    ['fuel_type_id', 'VARCHAR(100) NULL'],
    ['brand_id', 'VARCHAR(100) NULL'],
    ['brand_name', 'VARCHAR(255) NULL'],
    ['multi_fuel_models', 'INT DEFAULT 0'],
    ['display_order', 'INT DEFAULT 0'],
    ['order', 'INT DEFAULT 0'],
    ['hub_section_order', 'INT DEFAULT 0'],
    ['body_type_name', 'VARCHAR(255) NULL'],
    ['hero_image', 'JSON NULL'],
    ['primary_logo', 'JSON NULL'],
    ['related_cars', 'JSON NULL'],
    ['related_brands', 'JSON NULL'],
    ['related_blogs', 'JSON NULL'],
    ['tags', 'JSON NULL'],
    ['target_page_types', 'JSON NULL'],
    ['related_entities', 'JSON NULL'],
    ['assigned_brands', 'JSON NULL'],
    ['assigned_domains', 'JSON NULL'],
    ['permissions', 'JSON NULL'],
    ['specs_normalized', 'JSON NULL'],
    ['specifications', 'JSON NULL'],
    ['features', 'JSON NULL'],
    ['seating', 'INT NULL'],
    ['seating_capacity', 'INT NULL']
  ];

  const [rows] = await connection.query('SHOW TABLES');
  const dbTables = rows.map(r => Object.values(r)[0]);

  for (const table of dbTables) {
    // Relax NOT NULL constraints for non-primary key columns without defaults
    try {
      const [cols] = await connection.query(`SHOW FULL COLUMNS FROM \`${table}\``);
      for (const col of cols) {
        if (col.Null === 'NO' && col.Extra !== 'auto_increment' && col.Default === null && col.Key !== 'PRI') {
          console.log(`Making column \`${col.Field}\` in \`${table}\` nullable...`);
          await connection.query(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${col.Field}\` ${col.Type} NULL`);
        }
      }
    } catch (e) {
      console.error(`Error relaxing column constraints for \`${table}\`:`, e.message);
    }

    for (const [col, def] of universalColumns) {
      await addColumnIfNotExists(connection, table, col, def);
    }
  }

  console.log('Database columns synchronization complete!');
  await connection.end();
}

main().catch(err => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
