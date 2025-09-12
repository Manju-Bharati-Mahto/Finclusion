const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres.qyzoqfghwjbrydagntok:7HaBoboomdGrOt9@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
});

async function deploySchema() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Reading schema file...');
    const schema = fs.readFileSync('comprehensive-database-schema-FIXED.sql', 'utf8');
    
    console.log('Executing schema...');
    const result = await client.query(schema);
    
    console.log('Schema deployed successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error deploying schema:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

deploySchema();