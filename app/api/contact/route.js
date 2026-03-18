import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import clientPromise from '@/lib/db';

const messagesPath = path.join(process.cwd(), 'messages.json');

const saveMessageToDb = async (message) => {
  try {
    const client = await clientPromise;
    if (!client) return;
    const db = client.db('portfolio_analytics');
    await db.collection('messages').insertOne({ ...message, timestamp: new Date() });
  } catch (e) { }
};

export async function POST(request) {
  try {
    const message = await request.json();
    const fullMessage = { ...message, timestamp: new Date().toISOString() };
    await saveMessageToDb(fullMessage);

    let currentMessages = [];
    if (fs.existsSync(messagesPath)) {
      currentMessages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    }
    currentMessages.push(fullMessage);
    fs.writeFileSync(messagesPath, JSON.stringify(currentMessages, null, 2), 'utf8');

    return NextResponse.json({ message: 'INCOMING_COM_RECEIVED' });
  } catch (error) {
    return NextResponse.json({ error: 'TRANSMISSION_ERROR' }, { status: 500 });
  }
}
