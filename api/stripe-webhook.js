export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const resendKey = process.env.RESEND_API_KEY;

  if (!stripeSecret || !webhookSecret || !resendKey) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['stripe-signature'];

  // Vérification signature Stripe manuellement
  try {
    const [timestampPart, v1Part] = signature.split(',');
    const timestamp = timestampPart.replace('t=', '');
    const v1 = v1Part.replace('v1=', '');

    const signedPayload = timestamp + '.' + rawBody.toString();

    const crypto = await import('crypto');
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex');

    if (expectedSig !== v1) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody.toString());

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};

      const { nom, prenom, email, tel, depart, arrivee, date, heure, estimation, acompte } = meta;

      // Email confirmation au client
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + resendKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Taxi RF <reservations@taxirf.com>',
          to: email,
          subject: 'Confirmation de votre réservation — Taxi RF',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1A1A1A;">
              <div style="background:#1A1A1A;padding:24px;text-align:center;">
                <h1 style="color:#C9A84C;margin:0;font-size:24px;">Taxi RF</h1>
                <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;">Confirmation de réservation</p>
              </div>
              <div style="padding:32px 24px;">
                <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
                <p>Votre réservation est confirmée. Voici le récapitulatif :</p>
                <div style="background:#F5F5F5;border-left:4px solid #C9A84C;padding:20px;margin:20px 0;border-radius:4px;">
                  <p style="margin:0 0 8px;"><strong>Départ :</strong> ${depart}</p>
                  <p style="margin:0 0 8px;"><strong>Arrivée :</strong> ${arrivee}</p>
                  <p style="margin:0 0 8px;"><strong>Date :</strong> ${date}</p>
                  <p style="margin:0 0 8px;"><strong>Heure :</strong> ${heure}</p>
                  <p style="margin:0 0 8px;"><strong>Estimation :</strong> ${estimation}</p>
                  <p style="margin:0;"><strong>Acompte réglé :</strong> ${acompte}</p>
                </div>
                <p>Le solde sera réglé au chauffeur en fin de trajet selon le compteur homologué.</p>
                <p>📞 <a href="tel:+33605717711" style="color:#C9A84C;">06 05 71 77 11</a><br>
                ✉️ <a href="mailto:contact@taxirf.com" style="color:#C9A84C;">contact@taxirf.com</a></p>
                <p style="margin-top:24px;">À bientôt,<br><strong>Taxi RF</strong></p>
              </div>
              <div style="background:#111;padding:16px;text-align:center;">
                <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">© 2026 Taxi RF — rue Rosa Bonheur, 60170 Ribécourt-Dreslincourt</p>
              </div>
            </div>
          `
        })
      });

      // Email notification à Fouad
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + resendKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Taxi RF <reservations@taxirf.com>',
          to: 'reservations@taxirf.com',
          subject: '🚖 Nouvelle réservation — ' + prenom + ' ' + nom,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1A1A1A;">
              <div style="background:#1A1A1A;padding:24px;">
                <h1 style="color:#C9A84C;margin:0;font-size:20px;">🚖 Nouvelle réservation</h1>
              </div>
              <div style="padding:24px;">
                <h2 style="font-size:16px;">Client</h2>
                <p><strong>Nom :</strong> ${prenom} ${nom}</p>
                <p><strong>Téléphone :</strong> <a href="tel:${tel}">${tel}</a></p>
                <p><strong>Email :</strong> ${email}</p>
                <h2 style="font-size:16px;margin-top:20px;">Trajet</h2>
                <p><strong>Départ :</strong> ${depart}</p>
                <p><strong>Arrivée :</strong> ${arrivee}</p>
                <p><strong>Date :</strong> ${date}</p>
                <p><strong>Heure :</strong> ${heure}</p>
                <p><strong>Estimation :</strong> ${estimation}</p>
                <p><strong>Acompte payé :</strong> ${acompte}</p>
              </div>
            </div>
          `
        })
      });
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
