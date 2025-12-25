/**
 * Migration Script: Local MongoDB to MongoDB Atlas
 * Migrates all data from local database to Atlas cloud database
 */

const mongoose = require('mongoose');

// Connection URIs
const LOCAL_URI = 'mongodb://localhost:27017/business-incubator';
const ATLAS_URI = 'mongodb+srv://Sharique:Sharique022@cluster0.ugjk9bj.mongodb.net/business-incubator?retryWrites=true&w=majority&appName=Cluster0';

// Collections to migrate
const COLLECTIONS = [
  'users',
  'startups',
  'mentors',
  'mentorshiprequests',
  'resources',
  'fundingapplications',
  'notifications'
];

async function migrateData() {
  console.log('🚀 Starting Data Migration to MongoDB Atlas...\n');

  try {
    // Connect to local MongoDB
    console.log('📥 Connecting to LOCAL MongoDB...');
    const localConnection = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to LOCAL MongoDB\n');

    // Connect to Atlas MongoDB
    console.log('📤 Connecting to MongoDB Atlas...');
    const atlasConnection = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to MongoDB Atlas\n');

    let totalDocuments = 0;
    let migratedDocuments = 0;

    // Migrate each collection
    for (const collectionName of COLLECTIONS) {
      try {
        console.log(`📦 Migrating collection: ${collectionName}`);
        
        // Check if collection exists in local DB
        const collections = await localConnection.db.listCollections({ name: collectionName }).toArray();
        
        if (collections.length === 0) {
          console.log(`   ⚠️  Collection '${collectionName}' does not exist in local DB. Skipping...\n`);
          continue;
        }

        // Get data from local
        const LocalModel = localConnection.model(collectionName, new mongoose.Schema({}, { strict: false }), collectionName);
        const documents = await LocalModel.find({}).lean();
        
        if (documents.length === 0) {
          console.log(`   ℹ️  Collection '${collectionName}' is empty. Skipping...\n`);
          continue;
        }

        totalDocuments += documents.length;
        console.log(`   Found ${documents.length} documents`);

        // Insert into Atlas
        const AtlasModel = atlasConnection.model(collectionName, new mongoose.Schema({}, { strict: false }), collectionName);
        
        // Clear existing data in Atlas for this collection
        await AtlasModel.deleteMany({});
        console.log(`   Cleared existing data in Atlas`);
        
        // Insert documents
        if (documents.length > 0) {
          await AtlasModel.insertMany(documents);
          migratedDocuments += documents.length;
          console.log(`   ✅ Migrated ${documents.length} documents\n`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error migrating collection '${collectionName}':`, error.message, '\n');
      }
    }

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Migration Complete!');
    console.log(`📊 Total documents found: ${totalDocuments}`);
    console.log(`✅ Successfully migrated: ${migratedDocuments}`);
    console.log('═══════════════════════════════════════════════════\n');

    // Close connections
    await localConnection.close();
    await atlasConnection.close();
    console.log('🔒 Connections closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData();
