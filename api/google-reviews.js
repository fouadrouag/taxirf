export default async function handler(req, res) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Utiliser l'identifiant CID de Google Maps converti en URL de recherche
    const cid = '17578527583064985802'; // 0xf43405c1332140ca en décimal
    
    const response = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.reviews,places.googleMapsUri'
      },
      body: JSON.stringify({
        textQuery: 'Taxi RF 75 rue Rosa Bonheur Ribécourt-Dreslincourt 60170',
        languageCode: 'fr',
        regionCode: 'FR',
        maxResultCount: 10,
        locationRestriction: {
          rectangle: {
            low: { latitude: 49.40, longitude: 2.40 },
            high: { latitude: 49.42, longitude: 2.45 }
          }
        }
      })
    });

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      return res.status(200).json({
        name: 'Taxi RF',
        rating: 5.0,
        totalRatings: 7,
        googleMapsUri: 'https://maps.app.goo.gl/buL9ADVXBtMNJ6S4A',
        reviews: []
      });
    }

    // Chercher "Taxi RF" dans les résultats
    let place = data.places.find(p => 
      p.displayName?.text?.toLowerCase() === 'taxi rf'
    );
    
    // Si pas trouvé, chercher avec includes
    if (!place) {
      place = data.places.find(p => 
        p.displayName?.text?.toLowerCase().includes('taxi rf')
      );
    }

    // Si toujours pas trouvé, premier résultat
    if (!place) place = data.places[0];

    return res.status(200).json({
      name: place.displayName?.text || 'Taxi RF',
      rating: place.rating || 5,
      totalRatings: place.userRatingCount || 0,
      googleMapsUri: 'https://maps.app.goo.gl/buL9ADVXBtMNJ6S4A',
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
