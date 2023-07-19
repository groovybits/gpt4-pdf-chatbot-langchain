import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (admin && admin.apps && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

const db = admin.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get the channel name from the query parameters
    const { channelName } = req.query;

    // Get the commands for this channel from Firestore
    const snapshot = await db.collection('commands').where('channelId', '==', channelName).get();

    const commands: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;  // Include the document ID in the data
      commands.push(data);
    });

    // Send the commands to the client
    res.status(200).json(commands);
  } else {
    res.status(405).json({ error: 'Invalid request method' });
  }
}
