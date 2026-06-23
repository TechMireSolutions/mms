const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'mms.db');
console.log(`Connecting to SQLite database at: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error(`SQLite database does not exist at ${dbPath}. Please run the server first to initialize the schema.`);
  process.exit(1);
}

const db = new Database(dbPath);

function exportTableFromPostgres(tableName) {
  console.log(`Exporting table ${tableName} from PostgreSQL...`);
  const query = `SELECT json_agg(t) FROM (SELECT * FROM ${tableName}) t`;
  try {
    const stdout = execSync(
      `docker exec mms-postgres psql -U postgres -d mms -t -A -c "${query}"`,
      { maxBuffer: 100 * 1024 * 1024 }
    );
    const trimmed = stdout.toString().trim();
    if (!trimmed || trimmed === 'null' || trimmed === '') {
      return [];
    }
    return JSON.parse(trimmed);
  } catch (error) {
    console.error(`Failed to export table ${tableName}:`, error.message);
    throw error;
  }
}

function convertDate(isoString) {
  if (!isoString) return null;
  return Math.floor(new Date(isoString).getTime() / 1000);
}

try {
  // Disable foreign keys temporarily for batch imports
  db.pragma('foreign_keys = OFF');

  // Begin transaction
  db.transaction(() => {
    // 1. collections
    console.log('Migrating table: collections...');
    const collections = exportTableFromPostgres('collections');
    db.prepare('DELETE FROM collections').run();
    const insertCollection = db.prepare(
      'INSERT INTO collections (name, data, updated_at) VALUES (?, ?, ?)'
    );
    for (const row of collections) {
      insertCollection.run(row.name, row.data, convertDate(row.updated_at));
    }
    console.log(`Migrated ${collections.length} rows to collections.`);

    // 2. objects
    console.log('Migrating table: objects...');
    const objects = exportTableFromPostgres('objects');
    db.prepare('DELETE FROM objects').run();
    const insertObject = db.prepare(
      'INSERT INTO objects (key, data, updated_at) VALUES (?, ?, ?)'
    );
    for (const row of objects) {
      insertObject.run(row.key, row.data, convertDate(row.updated_at));
    }
    console.log(`Migrated ${objects.length} rows to objects.`);

    // 3. platform_users
    console.log('Migrating table: platform_users...');
    const platformUsers = exportTableFromPostgres('platform_users');
    db.prepare('DELETE FROM platform_users').run();
    const insertPlatformUser = db.prepare(
      `INSERT INTO platform_users (id, email, name, password_hash, email_verified_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of platformUsers) {
      insertPlatformUser.run(
        row.id,
        row.email,
        row.name,
        row.password_hash,
        convertDate(row.email_verified_at),
        convertDate(row.created_at),
        convertDate(row.updated_at)
      );
    }
    console.log(`Migrated ${platformUsers.length} rows to platform_users.`);

    // 4. tenant_users
    console.log('Migrating table: tenant_users...');
    const tenantUsers = exportTableFromPostgres('tenant_users');
    db.prepare('DELETE FROM tenant_users').run();
    const insertTenantUser = db.prepare(
      `INSERT INTO tenant_users (id, workspace_subdomain, login_email, password_hash, name, role, contact_id, email_verified_at, pending_login_email, created_at, updated_at, profile_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of tenantUsers) {
      insertTenantUser.run(
        row.id,
        row.workspace_subdomain,
        row.login_email,
        row.password_hash,
        row.name,
        row.role,
        row.contact_id,
        convertDate(row.email_verified_at),
        row.pending_login_email,
        convertDate(row.created_at),
        convertDate(row.updated_at),
        row.profile_json
      );
    }
    console.log(`Migrated ${tenantUsers.length} rows to tenant_users.`);

    // 5. auth_artifacts
    console.log('Migrating table: auth_artifacts...');
    const authArtifacts = exportTableFromPostgres('auth_artifacts');
    db.prepare('DELETE FROM auth_artifacts').run();
    const insertAuthArtifact = db.prepare(
      `INSERT INTO auth_artifacts (id, kind, payload, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const row of authArtifacts) {
      insertAuthArtifact.run(
        row.id,
        row.kind,
        row.payload,
        convertDate(row.expires_at),
        convertDate(row.created_at)
      );
    }
    console.log(`Migrated ${authArtifacts.length} rows to auth_artifacts.`);
  })();

  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');
  console.log('Migration successfully completed!');
} catch (error) {
  console.error('Migration failed and was rolled back:', error);
} finally {
  db.close();
}
