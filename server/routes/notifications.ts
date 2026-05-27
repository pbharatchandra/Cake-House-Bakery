import express from 'express';
import { db } from '../lib/db.js';
import { webpush } from '../lib/webpush.js';

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe', async (req: any, res) => {
  const { subscription, userId } = req.body;

  if (!subscription || !subscription.endpoint || !userId) {
    return res.status(400).json({ message: 'Invalid subscription' });
  }

  try {
    const userExists = await db.user.findUnique({ where: { id: userId }});
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Upsert subscription based on endpoint
    await db.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || 'BJpM2TMSXMSfJLL6BBk3jU3DVbX_QMrB8H1rpXQQ88c1HX0wkEJCVa9HXpf50RGhIrjh-BreRKjvrgrquJps78g' });
});

export default router;
