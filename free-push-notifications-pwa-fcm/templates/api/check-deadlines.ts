// Vercel serverless function. Called by a GitHub Actions cron job.
// Generic parts: auth check, Admin SDK init, dedupe log, send + stale-token cleanup.
// App-specific part you MUST customize: the block that builds `candidates` —
// that's just "read your own Firestore collections and figure out what's due."
//
// npm i firebase-admin @vercel/node

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const LEAD_DAYS = Number(process.env.NOTIFY_LEAD_DAYS ?? 3);

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

// Day-only diff, compared in UTC. Fine as long as your cron's run time still
// falls on the same calendar day in your target timezone (see README gotcha #6).
function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const todayUTC = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  const targetUTC = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  return Math.round((targetUTC - todayUTC) / 86400000);
}

interface Candidate {
  docId: string;
  collection: string;
  dateField: string;
  dateValue: string;
  title: string;
  body: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    const messaging = getMessaging(app);

    const tokensSnap = await db.collection('fcm_tokens').get();
    const tokens = tokensSnap.docs.map((d) => d.id);
    if (tokens.length === 0) {
      res.status(200).json({ checked: 0, sent: 0, note: 'No registered devices.' });
      return;
    }

    // --- APP-SPECIFIC: replace this block ---
    // Read whatever collections/fields your app tracks and turn them into a
    // flat list of "candidate" (docId, dateField, dateValue) triples.
    const candidates: Candidate[] = [];
    const itemsSnap = await db.collection('<YOUR_COLLECTION>').get();
    for (const doc of itemsSnap.docs) {
      const data = doc.data();
      if (data.dueDate) {
        candidates.push({
          docId: doc.id,
          collection: '<YOUR_COLLECTION>',
          dateField: 'dueDate',
          dateValue: data.dueDate,
          title: '<Notification title>',
          body: `<Some description referencing data.someField>`,
        });
      }
    }
    // --- end app-specific block ---

    let sent = 0;
    const logCollection = db.collection('notification_log');

    for (const c of candidates) {
      const diff = daysUntil(c.dateValue);
      if (diff === null) continue;
      let bucket: 'lead' | 'today' | null = null;
      if (diff === LEAD_DAYS) bucket = 'lead';
      else if (diff === 0) bucket = 'today';
      if (!bucket) continue;

      const logId = `${c.collection}_${c.docId}_${c.dateField}_${c.dateValue}_${bucket}`.replace(/[/\s]/g, '_');
      const logRef = logCollection.doc(logId);
      if ((await logRef.get()).exists) continue; // already sent — dedupe (gotcha #5)

      const daysLabel = bucket === 'today' ? 'today' : `in ${LEAD_DAYS} day${LEAD_DAYS === 1 ? '' : 's'}`;
      const result = await messaging.sendEachForMulticast({
        tokens,
        notification: { title: c.title, body: `${c.body} — due ${daysLabel}` },
        data: { collection: c.collection, docId: c.docId },
      });

      const staleTokens: string[] = [];
      result.responses.forEach((r, i) => {
        if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') {
          staleTokens.push(tokens[i]);
        }
      });
      if (staleTokens.length) {
        await Promise.all(staleTokens.map((t) => db.collection('fcm_tokens').doc(t).delete()));
      }

      await logRef.set({ sentAt: Timestamp.now(), successCount: result.successCount });
      sent += result.successCount;
    }

    res.status(200).json({ checked: candidates.length, sent });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
