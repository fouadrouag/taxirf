export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Resend key not configured' });
  }

  const { type, nom, prenom, email, tel, depart, arrivee, date, heure, estimation, acompte } = req.body;

  try {
    // Email au client
    if (type === 'confirmation') {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Taxi RF <contact@taxirf.com>',
          to: email,
          subject: 'Confirmation de votre réservation — Taxi RF',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
              <div style="background: #1A1A1A; padding: 24px; text-align: center;">
                <h1 style="color: #C9A84C; margin: 0; font-size: 24px;">Taxi RF</h1>
                <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0;">Confirmation de réservation</p>
              </div>
              <div style="padding: 32px 24px;">
                <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
                <p>Votre réservation est confirmée. Voici le récapitulatif de votre trajet :</p>
                <div style="background: #F5F5F5; border-left: 4px solid #C9A84C; padding: 20px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0 0 8px;"><strong>Départ :</strong> ${depart}</p>
                  <p style="margin: 0 0 8px;"><strong>Arrivée :</strong> ${arrivee}</p>
                  <p style="margin: 0 0 8px;"><strong>Date :</strong> ${date}</p>
                  <p style="margin: 0 0 8px;"><strong>Heure :</strong> ${heure}</p>
                  <p style="margin: 0 0 8px;"><strong>Estimation :</strong> ${estimation}</p>
                  <p style="margin: 0;"><strong>Acompte réglé :</strong> ${acompte}</p>
                </div>
                <p>Le solde sera réglé directement au chauffeur en fin de trajet selon le montant affiché sur le compteur homologué.</p>
                <p>Pour toute question, contactez-nous :</p>
                <p>📞 <a href="tel:+33605717711" style="color: #C9A84C;">06 05 71 77 11</a><br>
                ✉️ <a href="mailto:contact@taxirf.com" style="color: #C9A84C;">contact@taxirf.com</a></p>
                <p style="margin-top: 24px;">À bientôt,<br><strong>Taxi RF</strong></p>
              </div>
              <div style="background: #111; padding: 16px; text-align: center;">
                <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">© 2026 Taxi RF — rue Rosa Bonheur, 60170 Ribécourt-Dreslincourt</p>
              </div>
            </div>
          `
        })
      });
    }

    // Email de notification à Fouad
    if (type === 'notification') {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Taxi RF <contact@taxirf.com>',
          to: 'reservations@taxirf.com',
          subject: '🚖 Nouvelle réservation — ' + prenom + ' ' + nom,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
              <div style="background: #1A1A1A; padding: 24px;">
                <h1 style="color: #C9A84C; margin: 0; font-size: 20px;">🚖 Nouvelle réservation</h1>
              </div>
              <div style="padding: 24px;">
                <h2 style="font-size: 16px;">Client</h2>
                <p><strong>Nom :</strong> ${prenom} ${nom}</p>
                <p><strong>Téléphone :</strong> <a href="tel:${tel}">${tel}</a></p>
                <p><strong>Email :</strong> ${email}</p>
                <h2 style="font-size: 16px; margin-top: 20px;">Trajet</h2>
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

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
