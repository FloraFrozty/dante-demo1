import { MongoClient } from 'mongodb';

const raw = (process.env.MONGO_URI || '').trim();
// strip optional surrounding quotes
const uri = raw.replace(/^['"]|['"]$/g, '');

if (!uri) throw new Error('MONGO_URI is missing');
if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
  throw new Error('MONGO_URI must start with "mongodb://" or "mongodb+srv://"');
}

export const mongoClient = new MongoClient(uri);