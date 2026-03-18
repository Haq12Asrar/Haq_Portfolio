import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import clientPromise from '@/lib/db';

const messagesPath = path.join(process.cwd(), 'messages.json');

const fetchMessagesFromDb = async () => {
    try {
        const client = await clientPromise;
        if (!client) return null;
        const db = client.db('portfolio_analytics');
        return await db.collection('messages').find({}).sort({ timestamp: -1 }).toArray();
    } catch (e) { return null; }
};

export async function GET() {
    try {
        const dbMessages = await fetchMessagesFromDb();
        if (dbMessages) return NextResponse.json(dbMessages);

        if (!fs.existsSync(messagesPath)) return NextResponse.json([]);
        const fileContents = fs.readFileSync(messagesPath, 'utf8');
        const messages = JSON.parse(fileContents);
        return NextResponse.json(messages.reverse());
    } catch (error) {
        return NextResponse.json({ error: 'SYSTEM_FAILURE' }, { status: 500 });
    }
}
