/**
 * Migration Script: Convert Blog.author_id from ObjectId to String
 * 
 * This script migrates author_id from ObjectId to String (user.user_id)
 * 
 * IMPORTANT: Backup your database before running this script!
 * Run with: npm run ts-node scripts/migrations/002-migrate-blog-author-id.ts
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function migrateBlogAuthorId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-salahakar');
    console.log('Connected to MongoDB');

    const connection = mongoose.connection;
    if (!connection.db) {
      throw new Error('Database connection not established');
    }
    const db = connection.db;
    const blogsCollection = db.collection('blogs');

    console.log('Starting migration of Blog.author_id...');

    // Get all blogs with author_id
    const blogs = await blogsCollection.find({ author_id: { $exists: true, $ne: null } }).toArray();
    console.log(`Found ${blogs.length} blogs to migrate`);

    let updated = 0;
    let errors = 0;

    for (const blog of blogs) {
      try {
        if (blog.author_id && typeof blog.author_id === 'object') {
          const user = await db!.collection('users').findOne({ _id: blog.author_id });
          if (user && user.user_id) {
            await blogsCollection.updateOne(
              { _id: blog._id },
              { $set: { author_id: user.user_id } }
            );
            updated++;
            console.log(`Updated blog ${blog.blog_id}`);
          } else {
            console.log(`No user found for author_id ${blog.author_id}, setting to null`);
            await blogsCollection.updateOne(
              { _id: blog._id },
              { $set: { author_id: null } }
            );
            updated++;
          }
        }
      } catch (err) {
        console.error(`Error migrating blog ${blog._id}:`, err);
        errors++;
      }
    }

    console.log(`Migration complete. Updated: ${updated}, Errors: ${errors}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateBlogAuthorId();
