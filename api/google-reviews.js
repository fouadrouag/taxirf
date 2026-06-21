export default async function handler(req, res) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.reviews,places.googleMapsUri'
      },
      body: JSON.stringify({
        textQuery: 'Taxi RF, 75 rue Rosa Bonheur, 60170 Ribécourt-Dreslincourt, France',
        languageCode: 'fr',
        regionCode: 'FR'
      })
    });

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      return res.status(404).json({ error: 'Place not found' });
    }

    const place = data.places[0];

    return res.status(200).json({
      name: place.displayName?.text || 'Taxi RF',
      rating: place.rating || 5,
      totalRatings: place.userRatingCount || 0,
      googleMapsUri: place.googleMapsUri || 'https://maps.app.goo.gl/buL9ADVXBtMNJ6S4A',
      reviews: (place.reviews || []).slice(0, 4).map(r => ({
        author: r.authorAttribution?.displayName || 'Anonyme',
        rating: r.rating || 5,
        text: r.text?.text || '',
        time: r.relativePublishTimeDescription || ''
      }))
    });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
  }
}
