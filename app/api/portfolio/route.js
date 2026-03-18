import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import clientPromise from '@/lib/db';

const dataPath = path.join(process.cwd(), 'data.json');

const getDbData = async () => {
  try {
    const client = await clientPromise;
    if (!client) return null;
    const db = client.db('portfolio_analytics');
    const data = await db.collection('portfolio_core').findOne({ id: 'main' });
    return data ? data.content : null;
  } catch (e) { return null; }
};

const saveDbData = async (content) => {
  try {
    const client = await clientPromise;
    if (!client) return;
    const db = client.db('portfolio_analytics');
    await db.collection('portfolio_core').updateOne(
      { id: 'main' },
      { $set: { content, updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (e) { }
};

export async function GET() {
  try {
    const dbData = await getDbData();
    if (dbData) return NextResponse.json(dbData);
    const fileContents = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_FAILURE' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newData = await request.json();
    await saveDbData(newData);
    fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2), 'utf8');
    return NextResponse.json({ message: 'PROTOCOL_SYNC_COMPLETE' });
  } catch (error) {
    return NextResponse.json({ error: 'TRANSMISSION_ERROR' }, { status: 500 });
  }
}
