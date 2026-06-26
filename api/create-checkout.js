const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, description, customerEmail, customerName } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Montant invalide' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Taxi RF — Acompte réservation',
              description: description || 'Acompte 30% pour votre trajet',
            },
            unit_amount: Math.round(amount * 100), // en centimes
          },
          quantity: 1,
        },
      ],
      success_url: 'https://taxirf.com/tarifs-taxi-rf.html?payment=success',
      cancel_url: 'https://taxirf.com/tarifs-taxi-rf.html?payment=cancel',
      metadata: {
        customerName: customerName || '',
        customerEmail: customerEmail || '',
      },
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
