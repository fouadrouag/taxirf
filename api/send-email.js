export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Resend key not configured' });
  }

  const { type, nom, prenom, email, tel, depart, arrivee, date, heure, estimation, acompte, message, lang } = req.body;
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

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

    // Email au client pour une demande avec paiement à bord
    if (type === 'paiement_bord_client') {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Taxi RF <reservations@taxirf.com>',
          to: email,
          subject: 'Demande de réservation reçue — Taxi RF',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
              <div style="background: #1A1A1A; padding: 24px; text-align: center;">
                <h1 style="color: #C9A84C; margin: 0; font-size: 24px;">Taxi RF</h1>
                <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0;">Demande de réservation</p>
              </div>
              <div style="padding: 32px 24px;">
                <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
                <p>Nous avons bien reçu votre demande de réservation avec paiement à bord. Nous vous recontactons rapidement pour confirmer la course avec le chauffeur.</p>
                <div style="background: #F5F5F5; border-left: 4px solid #C9A84C; padding: 20px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0 0 8px;"><strong>Départ :</strong> ${depart}</p>
                  <p style="margin: 0 0 8px;"><strong>Arrivée :</strong> ${arrivee}</p>
                  <p style="margin: 0 0 8px;"><strong>Date :</strong> ${date}</p>
                  <p style="margin: 0 0 8px;"><strong>Heure :</strong> ${heure}</p>
                  <p style="margin: 0 0 8px;"><strong>Estimation :</strong> ${estimation}</p>
                  <p style="margin: 0;"><strong>Paiement :</strong> à bord, après confirmation avec le chauffeur</p>
                </div>
                <p>Pour toute question, contactez-nous :</p>
                <p>📞 <a href="tel:+33605717711" style="color: #C9A84C;">06 05 71 77 11</a><br>
                ✉️ <a href="mailto:contact@taxirf.com" style="color: #C9A84C;">contact@taxirf.com</a></p>
                <p style="margin-top: 24px;">À bientôt,<br><strong>Taxi RF</strong></p>
              </div>
            </div>
          `
        })
      });
    }

    // Email au chauffeur pour une demande avec paiement à bord
    if (type === 'paiement_bord_notification') {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Taxi RF <reservations@taxirf.com>',
          to: 'reservations@taxirf.com',
          subject: '🚕 Demande paiement à bord — ' + prenom + ' ' + nom,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
              <div style="background: #1A1A1A; padding: 24px;">
                <h1 style="color: #C9A84C; margin: 0; font-size: 20px;">🚕 Demande paiement à bord</h1>
              </div>
              <div style="padding: 24px;">
                <p style="background:#FFF8E1;border-left:4px solid #C9A84C;padding:14px;margin:0 0 20px;">Cette course doit être confirmée avec le chauffeur avant validation définitive.</p>
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
                <p><strong>Paiement :</strong> à bord</p>
              </div>
            </div>
          `
        })
      });

    }

    // Message envoyé depuis la page contact
    if (type === 'contact') {
      if (!nom || !tel || !email || !message) {
        return res.status(400).json({ error: 'Champs contact manquants' });
      }

      const isEnglish = lang === 'en';
      const cleanNom = escapeHtml(nom);
      const cleanTel = escapeHtml(tel);
      const cleanEmail = escapeHtml(email);
      const cleanMessage = escapeHtml(message).replace(/\n/g, '<br>');

      const contactResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Taxi RF <contact@taxirf.com>',
          to: 'contact@taxirf.com',
          reply_to: email,
          subject: (isEnglish ? 'Contact message - ' : 'Message contact - ') + nom,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
              <div style="background: #1A1A1A; padding: 24px;">
                <h1 style="color: #C9A84C; margin: 0; font-size: 20px;">${isEnglish ? 'New contact message' : 'Nouveau message contact'}</h1>
              </div>
              <div style="padding: 24px;">
                <h2 style="font-size: 16px;">${isEnglish ? 'Contact' : 'Contact'}</h2>
                <p><strong>${isEnglish ? 'Name' : 'Nom'} :</strong> ${cleanNom}</p>
                <p><strong>${isEnglish ? 'Phone' : 'Téléphone'} :</strong> <a href="tel:${cleanTel}">${cleanTel}</a></p>
                <p><strong>Email :</strong> <a href="mailto:${cleanEmail}">${cleanEmail}</a></p>
                <h2 style="font-size: 16px; margin-top: 20px;">Message</h2>
                <div style="background: #F5F5F5; border-left: 4px solid #C9A84C; padding: 16px; border-radius: 4px; line-height: 1.6;">${cleanMessage}</div>
              </div>
            </div>
          `
        })
      });

      if (!contactResponse.ok) {
        const contactError = await contactResponse.json().catch(() => ({}));
        return res.status(contactResponse.status).json({
          error: contactError.message || 'Erreur envoi contact'
        });
      }
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
