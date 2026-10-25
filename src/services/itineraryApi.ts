import { ItineraryRequest, GeneratedItinerary } from '../types/itinerary';

export async function generateItinerary(request: ItineraryRequest): Promise<GeneratedItinerary> {
  const response = await fetch('/api/itinerary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to generate itinerary (${response.status})`);
  }

  const data: GeneratedItinerary = await response.json();
  return data;
}
