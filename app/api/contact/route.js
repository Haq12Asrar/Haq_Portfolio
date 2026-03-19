import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import clientPromise from '@/lib/db';

const messagesPath = path.join(process.cwd(), 'messages.json');

// Messages to be stored in MongoDB in production

export async function POST(request) {
  try {
    const message = await request.json();
    const fullMessage = { ...message, timestamp: new Date() };

    // 1. Primary storage: MongoDB (Production & Local)
    const client = await clientPromise;
    if (client) {
      const db = client.db('portfolio_analytics');
      await db.collection('messages').insertOne(fullMessage);
    } else {
      console.warn('MONGODB_OFFLINE: Falling back to local/memory storage');
    }

    // 2. Secondary storage: Local JSON (Only in Development)
    if (process.env.NODE_ENV === 'development') {
      try {
        let currentMessages = [];
        if (fs.existsSync(messagesPath)) {
          currentMessages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
        }
        currentMessages.push(fullMessage);
        fs.writeFileSync(messagesPath, JSON.stringify(currentMessages, null, 2), 'utf8');
      } catch (e) {
        console.error('LOCAL_WRITE_FAIL:', e.message);
      }
    }

    return NextResponse.json({ message: 'INCOMING_COM_RECEIVED' });
  } catch (error) {
    console.error('CONTACT_API_CRASH:', error.message);
    return NextResponse.json({ error: 'TRANSMISSION_ERROR' }, { status: 500 });
  }
}
