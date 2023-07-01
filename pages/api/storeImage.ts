import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import admin, { firestore } from 'firebase-admin';
import nlp from 'compromise';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { authCheck, NextApiRequestWithUser } from '@/utils/authCheck';

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();
const storage = new Storage();

export default async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  await authCheck(req, res, async () => {
    if (req.method === 'POST') {
      const { imageUrl, prompt, episodeId, imageUUID } = req.body;

      // Use the compromise library to extract the most important words from the prompt
      let doc = nlp(prompt);
      let keywords = doc.out('array');
      let imageId = imageUUID;

      // Limit the keywords array to the first 30 elements
      keywords = keywords.slice(0, 30);

      // Fetch the image
      const response = await fetch(imageUrl);

      if (!response.ok) {
        console.error('storeImage: Error fetching image:', response.statusText);
        res.status(500).json({ error: 'Error fetching image' });
        return;
      }

      if (!response.body) {
        console.error('storeImage: No body in response');
        res.status(500).json({ error: 'No body in response' });
        return;
      }

      // Create a new blob in the bucket and upload the file data
      const bucketName = process.env.GCS_BUCKET_NAME || '';
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(`deepAIimage/${episodeId}_${imageUUID}.jpg`);

      if (imageUUID === undefined || imageUUID === null || imageUUID === '') {
        imageId = uuidv4();
      }

      // Pipe the image data to the file
      const writeStream = file.createWriteStream({
        gzip: true,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      response.body.pipe(writeStream);

      // Wait for the upload to complete
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Add the image to the Firestore index
      const docRef = db.collection('images').doc(`${episodeId}_${imageId}.jpg`);
      await docRef.set({
        episodeId: episodeId.split('_')[0],
        count: episodeId.split('_')[1],
        url: `https://storage.googleapis.com/${bucketName}/deepAIimage/${episodeId}_${imageId}.jpg`,
        keywords: keywords,
        created: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({ message: 'Image stored successfully' });
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
}