import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

// Usually from environment variables
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BJpM2TMSXMSfJLL6BBk3jU3DVbX_QMrB8H1rpXQQ88c1HX0wkEJCVa9HXpf50RGhIrjh-BreRKjvrgrquJps78g';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'mihEohD_hrfm-p_AiS6BXCAGRqbsz9sEgeFCSkWG3UE';

webpush.setVapidDetails(
  'mailto:support@example.com',
  publicVapidKey,
  privateVapidKey
);

export { webpush };
