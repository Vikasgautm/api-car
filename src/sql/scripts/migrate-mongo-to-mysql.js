const { MongoClient } = require('mongodb');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration with environment defaults and overrides
// const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB_NAME = process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || 'car-salahakar';

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'car_salahakar',
};

// Collection to Table Name mapping for standardized MySQL naming conventions
const COLLECTION_TABLE_MAP = {
  'cars': 'Cars',
  'bodytypes': 'BodyTypes',
  'body_types': 'BodyTypes',
  'carvariants': 'CarVariants',
  'car_variants': 'CarVariants',
  'carimages': 'CarImages',
  'car_images': 'CarImages',
  'seocollections': 'SeoCollections',
  'seo_collections': 'SeoCollections',
  'brands': 'Brands',
  'images': 'Images',
  'cities': 'Cities',
  'redirects': 'Redirects',
  'platformsettings': 'PlatformSettings',
  'platform_settings': 'PlatformSettings',
  'categories': 'Categories',
  'taxonomycategories': 'TaxonomyCategories',
  'taxonomy_categories': 'TaxonomyCategories',
  'workflows': 'Workflows',
  'governanceworkflows': 'GovernanceWorkflows',
  'governance_workflows': 'GovernanceWorkflows',
  'ownerships': 'Ownerships',
  'brandownerships': 'BrandOwnerships',
  'brand_ownerships': 'BrandOwnerships',
  'rankings': 'Rankings',
  'rankingcollections': 'RankingCollections',
  'ranking_collections': 'RankingCollections',
  'fueltypes': 'FuelTypes',
  'fuel_types': 'FuelTypes',
  'imagecategories': 'ImageCategories',
  'image_categories': 'ImageCategories',
  'imagesubcategories': 'ImageSubcategories',
  'image_subcategories': 'ImageSubcategories',
  'faqs': 'FAQs',
  'seopresets': 'SeoPresets',
  'seo_presets': 'SeoPresets',
  'popularcollections': 'PopularCollections',
  'popular_collections': 'PopularCollections',
  'systemsettings': 'SystemSettings',
  'system_settings': 'SystemSettings',
  'users': 'Users',
  'user': 'Users',
  'usersessions': 'UserSessions',
  'user_sessions': 'UserSessions',
  'masteroptions': 'MasterOptions',
  'master_options': 'MasterOptions',
  'tagcategories': 'TagCategories',
  'tag_categories': 'TagCategories',
  'mileagebenchmarkoverrides': 'MileageBenchmarkOverrides',
  'mileage_benchmark_overrides': 'MileageBenchmarkOverrides',
  'importkeymappings': 'ImportKeyMappings',
  'import_key_mappings': 'ImportKeyMappings',
  'auditlogs': 'AuditLogs',
  'audit_logs': 'AuditLogs',
  'importlogs': 'ImportLogs',
  'import_logs': 'ImportLogs',
  'admin_chatbot_logs': 'AdminChatbotLogs',
  'adminchatbotlogs': 'AdminChatbotLogs',
  'comparisonrivals': 'ComparisonRivals',
  'comparison_rivals': 'ComparisonRivals',
  'deletionrequests': 'DeletionRequests',
  'deletion_requests': 'DeletionRequests',
  'editlocks': 'EditLocks',
  'edit_locks': 'EditLocks',
  'lifecyclerequests': 'LifecycleRequests',
  'lifecycle_requests': 'LifecycleRequests',
  'rankingcollectionconfigs': 'RankingCollectionConfigs',
  'ranking_collection_configs': 'RankingCollectionConfigs',
  'rankingscores': 'RankingScores',
  'ranking_scores': 'RankingScores',
  'seosettings': 'SeoSettings',
  'seo_settings': 'SeoSettings',
  'variantspeckeys': 'VariantSpecKeys',
  'variant_spec_keys': 'VariantSpecKeys',
  'workflowitems': 'WorkflowItems',
  'workflow_items': 'WorkflowItems',
  'unknownvalues': 'UnknownValues',
  'unknown_values': 'UnknownValues'
};

function getTableName(collName) {
  const normalized = collName.toLowerCase();
  if (COLLECTION_TABLE_MAP[normalized]) {
    return COLLECTION_TABLE_MAP[normalized];
  }
  // Fallback to capitalizing first letter if not in explicit mapping
  return collName.charAt(0).toUpperCase() + collName.slice(1);
}

function determineSqlType(value) {
  if (value === null || value === undefined) return 'VARCHAR(255) NULL';
  if (typeof value === 'boolean') return 'TINYINT(1) NULL';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'BIGINT NULL' : 'DOUBLE NULL';
  }
  if (value instanceof Date) return 'DATETIME NULL';
  if (typeof value === 'object') return 'JSON NULL';
  if (typeof value === 'string') {
    if (value.length > 250) return 'TEXT NULL';
    return 'VARCHAR(255) NULL';
  }
  return 'TEXT NULL';
}

function formatValueForSql(val) {
  if (val === undefined || val === null) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 19).replace('T', ' ');
  if (typeof val === 'object') {
    // If it's a Mongo ObjectId
    if (val._bsontype === 'ObjectID' || val.toHexString) {
      return val.toString();
    }
    return JSON.stringify(val);
  }
  if (typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

async function ensureTableAndColumns(mysqlConn, tableName, sampleDoc) {
  // 1. Create table if missing
  await mysqlConn.query(`
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`_id\` VARCHAR(100) NULL,
      \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // 2. Inspect current columns
  const [existingColsRows] = await mysqlConn.query(`SHOW COLUMNS FROM \`${tableName}\``);
  const existingCols = new Set(existingColsRows.map(r => r.Field));

  // 3. Add any missing columns dynamically based on sample document fields
  const fields = Object.keys(sampleDoc);
  for (const field of fields) {
    let colName = field;
    if (field === '_id') colName = '_id'; // Keep string representation of _id
    
    // Skip internal JS properties
    if (!colName || colName === 'id') continue;

    if (!existingCols.has(colName)) {
      const sqlType = determineSqlType(sampleDoc[field]);
      try {
        await mysqlConn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${colName}\` ${sqlType}`);
        existingCols.add(colName);
        console.log(`  Added column \`${colName}\` (${sqlType}) to table \`${tableName}\``);
      } catch (err) {
        // If error due to duplicate column or reserved keyword syntax
        try {
          await mysqlConn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${colName}\` TEXT NULL`);
          existingCols.add(colName);
        } catch (e) {
          console.error(`  Warning: Could not add column \`${colName}\` to \`${tableName}\`: ${e.message}`);
        }
      }
    }
  }
  return existingCols;
}

async function migrateCollection(mongoDb, mysqlConn, collectionName) {
  const targetTable = getTableName(collectionName);
  console.log(`\n--------------------------------------------------`);
  console.log(`Processing Collection: "${collectionName}" -> MySQL Table: "${targetTable}"`);

  const mongoColl = mongoDb.collection(collectionName);
  const totalDocs = await mongoColl.countDocuments();

  if (totalDocs === 0) {
    console.log(`Collection "${collectionName}" is empty. Skipping.`);
    return;
  }

  console.log(`Found ${totalDocs} documents in MongoDB collection "${collectionName}".`);

  // Get sample document to ensure schema setup
  const sampleDoc = await mongoColl.findOne({});
  const tableColumns = await ensureTableAndColumns(mysqlConn, targetTable, sampleDoc);

  // Read documents in batches
  const BATCH_SIZE = 500;
  let processed = 0;
  const cursor = mongoColl.find({});

  let batch = [];
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    batch.push(doc);

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(mysqlConn, targetTable, batch, tableColumns);
      processed += batch.length;
      console.log(`  Migrated ${processed} / ${totalDocs} documents...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(mysqlConn, targetTable, batch, tableColumns);
    processed += batch.length;
    console.log(`  Migrated ${processed} / ${totalDocs} documents...`);
  }

  console.log(`✅ Collection "${collectionName}" successfully migrated to table "${targetTable}".`);
}

async function insertBatch(mysqlConn, tableName, batch, knownColumns) {
  if (!batch || batch.length === 0) return;

  for (const doc of batch) {
    const keys = [];
    const values = [];
    const placeholders = [];

    for (const [key, val] of Object.entries(doc)) {
      if (!knownColumns.has(key)) continue; // Only insert matching schema columns
      keys.push(`\`${key}\``);
      values.push(formatValueForSql(val));
      placeholders.push('?');
    }

    if (keys.length === 0) continue;

    const sql = `INSERT INTO \`${tableName}\` (${keys.join(', ')}) VALUES (${placeholders.join(', ')})`;
    try {
      await mysqlConn.query(sql, values);
    } catch (err) {
      // If error occurs due to missing column dynamically added during runtime batch
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const match = err.message.match(/Unknown column '(.+?)'/);
        if (match && match[1]) {
          const missingCol = match[1];
          try {
            await mysqlConn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${missingCol}\` TEXT NULL`);
            knownColumns.add(missingCol);
            // Re-attempt row insert
            await mysqlConn.query(sql, values);
          } catch (e) {}
        }
      }
    }
  }
}

async function main() {
  console.log('=== STARTING MONGODB TO MYSQL MIGRATION ===');
  console.log(`MongoDB URI    : ${MONGO_URI}`);
  console.log(`MongoDB Database: ${MONGO_DB_NAME}`);
  console.log(`MySQL Host     : ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}`);
  console.log(`MySQL Database : ${MYSQL_CONFIG.database}`);

  let mongoClient;
  let mysqlConn;

  try {
    // Connect to MongoDB
    console.log('\nConnecting to MongoDB...');
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const mongoDb = mongoClient.db(MONGO_DB_NAME);
    console.log('Connected to MongoDB successfully!');

    // Connect to MySQL
    console.log('\nConnecting to MySQL...');
    mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
    console.log('Connected to MySQL successfully!');

    // List all MongoDB collections
    const collections = await mongoDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in MongoDB database "${MONGO_DB_NAME}".`);

    for (const coll of collections) {
      // Skip system collections
      if (coll.name.startsWith('system.')) continue;
      await migrateCollection(mongoDb, mysqlConn, coll.name);
    }

    console.log('\n================================================--');
    console.log('🎉 MONGODB TO MYSQL DATA MIGRATION COMPLETE!');
    console.log('================================================--\n');

  } catch (err) {
    console.error('\n❌ MIGRATION ERROR:', err);
  } finally {
    if (mongoClient) await mongoClient.close();
    if (mysqlConn) await mysqlConn.end();
  }
}

main();
