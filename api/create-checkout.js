export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe key not configured' });
  }

  const { amount, description, customerEmail, customerName, nom, prenom, tel, depart, arrivee, date, heure, estimation, acompte } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Montant invalide' });
  }

  try {
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('payment_method_types[]', 'card');
    params.append('line_items[0][price_data][currency]', 'eur');
    params.append('line_items[0][price_data][product_data][name]', 'Taxi RF — Acompte réservation');
    params.append('line_items[0][price_data][product_data][description]', description || 'Acompte 30%');
    params.append('line_items[0][price_data][unit_amount]', String(Math.round(amount * 100)));
    params.append('line_items[0][quantity]', '1');
    params.append('customer_email', customerEmail || '');
    params.append('success_url', 'https://taxirf.com/tarifs-taxi-rf.html?payment=success');
    params.append('cancel_url', 'https://taxirf.com/tarifs-taxi-rf.html?payment=cancel');

    // Toutes les infos dans metadata pour le webhook
    params.append('metadata[nom]', nom || '');
    params.append('metadata[prenom]', prenom || '');
    params.append('metadata[email]', customerEmail || '');
    params.append('metadata[tel]', tel || '');
    params.append('metadata[depart]', depart || '');
    params.append('metadata[arrivee]', arrivee || '');
    params.append('metadata[date]', date || '');
    params.append('metadata[heure]', heure || '');
    params.append('metadata[estimation]', estimation || '');
    params.append('metadata[acompte]', acompte || '');

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + secretKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await response.json();

    if (session.error) {
      return res.status(400).json({ error: session.error.message });
    }

    return res.status(200).json({ url: session.url });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
