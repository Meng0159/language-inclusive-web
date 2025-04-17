import { NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_API_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input')?.trim();

  if (!input || !GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const autocompleteRes = await fetch(
    `${PLACES_API_URL}?input=${encodeURIComponent(input)}&components=country:au&types=geocode&key=${GOOGLE_MAPS_API_KEY}`
  );

  const autocompleteData = await autocompleteRes.json();

  if (autocompleteData.status !== 'OK') {
    return NextResponse.json({ predictions: [] });
  }

  const isPostcodeInput = /^\d{4}$/.test(input); // Australian postcode

  const enrichedPredictions = await Promise.all(
    autocompleteData.predictions.slice(0, 5).map(async (prediction: any) => {
      const detailRes = await fetch(
        `${DETAILS_API_URL}?place_id=${prediction.place_id}&fields=address_component&key=${GOOGLE_MAPS_API_KEY}`
      );
      const detailData = await detailRes.json();

      const components = detailData?.result?.address_components ?? [];

      const postcodeComp = components.find((c: any) => c.types.includes('postal_code'));
      const suburbComp =
        components.find((c: any) => c.types.includes('locality')) ??
        components.find((c: any) => c.types.includes('postal_town'));
      const stateComp = components.find((c: any) => c.types.includes('administrative_area_level_1'));

      const postcode = postcodeComp?.long_name;
      const suburb = suburbComp?.long_name;
      const state = stateComp?.short_name;

      // Only return if postcode matches exactly when input is a postcode
      if (isPostcodeInput && postcode !== input) {
        return null;
      }

      const labelParts = [];
      if (suburb) labelParts.push(suburb);
      if (state) labelParts.push(state);
      if (postcode) labelParts.push(postcode);

      const formattedLabel = labelParts.join(' ');

      return {
        description: formattedLabel,
        place_id: prediction.place_id,
      };
    })
  );

  const validResults = enrichedPredictions.filter(Boolean);

  return NextResponse.json({ predictions: validResults });
}
