export interface Landmark {
  id: string;
  name: string;
  category: 'Historic' | 'Nature' | 'Cultural' | 'Iconic' | 'Culinary';
  lat: number;
  lng: number;
  cityOrRegion: string;
  description: string;
  aiTip: string;
  recommendedDuration: string;
}

export const FAMOUS_COUNTRY_LANDMARKS: Record<string, Landmark[]> = {
  // JAPAN
  JPN: [
    {
      id: 'jp-1',
      name: 'Senso-ji Temple & Asakusa',
      category: 'Historic',
      lat: 35.7148,
      lng: 139.7967,
      cityOrRegion: 'Tokyo',
      description: "Tokyo's oldest and most significant Buddhist temple, renowned for its giant red Thunder Gate (Kaminarimon) and vibrant Nakamise market street.",
      aiTip: 'Visit at dawn for quiet photos, then try hot freshly baked ningyo-yaki cakes on Nakamise Street.',
      recommendedDuration: '2-3 hours'
    },
    {
      id: 'jp-2',
      name: 'Mount Fuji (Fifth Station & Fuji Five Lakes)',
      category: 'Nature',
      lat: 35.3606,
      lng: 138.7274,
      cityOrRegion: 'Shizuoka / Yamanashi',
      description: "Japan's sacred volcano and highest peak at 3,776m, celebrated for symmetrical snow-capped vistas reflecting across Lake Kawaguchiko.",
      aiTip: 'Catch the early morning highway bus from Shinjuku for crystal-clear reflections across Lake Kawaguchiko.',
      recommendedDuration: 'Full Day'
    },
    {
      id: 'jp-3',
      name: 'Fushimi Inari-Taisha Shrine',
      category: 'Cultural',
      lat: 34.9671,
      lng: 135.7727,
      cityOrRegion: 'Kyoto',
      description: 'The world-famous Shinto shrine with thousands of vermilion torii gates winding up the sacred Mount Inari forest.',
      aiTip: 'Hike past the initial crowd to the Yotsutsuji intersection for panoramic sunset views over Kyoto.',
      recommendedDuration: '3 hours'
    },
    {
      id: 'jp-4',
      name: 'Kinkaku-ji (The Golden Pavilion)',
      category: 'Iconic',
      lat: 35.0394,
      lng: 135.7292,
      cityOrRegion: 'Kyoto',
      description: 'A Zen Buddhist temple whose top two floors are completely covered in pure gold leaf, reflected in the surrounding Mirror Pond.',
      aiTip: 'Visit on a sunny morning when the sunlight reflects off the pond onto the gold foil leafing.',
      recommendedDuration: '1.5 hours'
    },
    {
      id: 'jp-5',
      name: 'Dotonbori Culinary District',
      category: 'Culinary',
      lat: 34.6687,
      lng: 135.5013,
      cityOrRegion: 'Osaka',
      description: 'The pulsing neon heart of Kansai gastronomy, famed for giant animated Glico signs, takoyaki stalls, and okonomiyaki teppan griddles.',
      aiTip: 'Grab piping hot octopus takoyaki from Kukuru and take a night canal boat tour.',
      recommendedDuration: 'Evening'
    }
  ],

  // FRANCE
  FRA: [
    {
      id: 'fr-1',
      name: 'Eiffel Tower & Champ de Mars',
      category: 'Iconic',
      lat: 48.8584,
      lng: 2.2945,
      cityOrRegion: 'Paris',
      description: "Gustave Eiffel's 1889 wrought-iron masterpiece standing 330m above the Seine river, symbolizing French architectural ingenuity.",
      aiTip: 'Watch the tower sparkle on the hour after sunset from the Trocadéro terrace across the river.',
      recommendedDuration: '2-3 hours'
    },
    {
      id: 'fr-2',
      name: 'Louvre Museum & Glass Pyramid',
      category: 'Cultural',
      lat: 48.8606,
      lng: 2.3376,
      cityOrRegion: 'Paris',
      description: 'The grand royal palace housing over 35,000 historic masterpieces, including the Mona Lisa, Venus de Milo, and Winged Victory.',
      aiTip: 'Book Wednesday or Friday evening slots for fewer crowds and dramatic pyramid lighting.',
      recommendedDuration: '3-4 hours'
    },
    {
      id: 'fr-3',
      name: 'Palace of Versailles & Grand Canal',
      category: 'Historic',
      lat: 48.8049,
      lng: 2.1204,
      cityOrRegion: 'Versailles',
      description: "Louis XIV's monumental royal residence boasting the Hall of Mirrors and 800 hectares of classical French gardens.",
      aiTip: 'Rent a rowboat on the Grand Canal or rent bicycles to visit the Queen’s Hamlet.',
      recommendedDuration: 'Half to Full Day'
    },
    {
      id: 'fr-4',
      name: 'Mont Saint-Michel Abbey',
      category: 'Historic',
      lat: 48.636,
      lng: -1.5115,
      cityOrRegion: 'Normandy',
      description: 'A breathtaking medieval Benedictine abbey perched on a rocky tidal island surrounded by dramatic shifting ocean tides.',
      aiTip: 'Stay overnight on the island to walk the quiet lantern-lit cobblestones after tour buses leave.',
      recommendedDuration: 'Full Day'
    },
    {
      id: 'fr-5',
      name: 'Promenade des Anglais & Old Nice',
      category: 'Nature',
      lat: 43.6952,
      lng: 7.2656,
      cityOrRegion: 'French Riviera',
      description: 'The legendary Mediterranean seaside boulevard in Nice lined with palm trees and sapphire blue Baie des Anges waters.',
      aiTip: 'Taste local socca (chickpea crepe) in the Cours Saleya flower market in Old Nice.',
      recommendedDuration: 'Half Day'
    }
  ],

  // BRAZIL
  BRA: [
    {
      id: 'br-1',
      name: 'Christ the Redeemer & Corcovado',
      category: 'Iconic',
      lat: -22.9519,
      lng: -43.2105,
      cityOrRegion: 'Rio de Janeiro',
      description: 'The monumental 30m Art Deco statue perched atop Corcovado mountain overlooking Rio de Janeiro and Guanabara Bay.',
      aiTip: 'Take the scenic cogwheel train through Tijuca Rainforest early in the morning to beat the haze.',
      recommendedDuration: '2-3 hours'
    },
    {
      id: 'br-2',
      name: 'Sugarloaf Mountain (Pão de Açúcar)',
      category: 'Nature',
      lat: -22.9492,
      lng: -43.1545,
      cityOrRegion: 'Rio de Janeiro',
      description: 'A monolithic granite-quartz peak rising 396m from the harbor, accessible by two-stage glass cable cars.',
      aiTip: 'Plan your cable car ride for one hour before sunset to see Rio light up under twilight.',
      recommendedDuration: '2-3 hours'
    },
    {
      id: 'br-3',
      name: 'Iguazu Falls (Cataratas do Iguaçu)',
      category: 'Nature',
      lat: -25.6953,
      lng: -54.4367,
      cityOrRegion: 'Paraná',
      description: 'One of the New Seven Wonders of Nature, featuring 275 cascades roaring through subtropical Atlantic rainforest.',
      aiTip: 'Walk along the Devil’s Throat catwalk with a waterproof poncho for an unforgettable sensory rush.',
      recommendedDuration: 'Full Day'
    },
    {
      id: 'br-4',
      name: 'Historic Pelourinho & Olodum',
      category: 'Cultural',
      lat: -12.9714,
      lng: -38.5085,
      cityOrRegion: 'Salvador da Bahia',
      description: 'The colorful Afro-Brazilian colonial epicenter with cobblestone plazas, baroque churches, and drumming troupes.',
      aiTip: 'Visit on Tuesday evening for the legendary Olodum drum rehearsal in the cobblestone square.',
      recommendedDuration: 'Half Day'
    }
  ],

  // AUSTRALIA
  AUS: [
    {
      id: 'au-1',
      name: 'Sydney Opera House & Circular Quay',
      category: 'Iconic',
      lat: -33.8568,
      lng: 151.2153,
      cityOrRegion: 'Sydney',
      description: "Jørn Utzon's UNESCO-listed architectural wonder with expressive shell roofs dominating Sydney Harbour.",
      aiTip: 'Walk around the Bennelong Point boardwalk at sunset and have drinks at the Opera Bar.',
      recommendedDuration: '2-3 hours'
    },
    {
      id: 'au-2',
      name: 'Great Barrier Reef (Agincourt Reef)',
      category: 'Nature',
      lat: -16.0375,
      lng: 145.8333,
      cityOrRegion: 'Queensland',
      description: "The world's largest living coral reef ecosystem, teeming with marine turtles, manta rays, and tropical fish.",
      aiTip: 'Take a catamaran from Port Douglas to the outer reef pontoon for the clearest underwater visibility.',
      recommendedDuration: 'Full Day'
    },
    {
      id: 'au-3',
      name: 'Uluru-Kata Tjuta National Park',
      category: 'Cultural',
      lat: -25.3444,
      lng: 131.0369,
      cityOrRegion: 'Northern Territory',
      description: "The ancient red sandstone monolith sacred to the Anangu Aboriginal people, glowing deep ochre at sunset.",
      aiTip: 'Walk the 10km Uluru Base Walk at sunrise while guided by indigenous rangers.',
      recommendedDuration: 'Full Day'
    }
  ],

  // EGYPT
  EGY: [
    {
      id: 'eg-1',
      name: 'Giza Necropolis & Great Sphinx',
      category: 'Iconic',
      lat: 29.9792,
      lng: 31.1342,
      cityOrRegion: 'Cairo / Giza',
      description: 'The only surviving wonder of the ancient world: the Great Pyramid of Khufu and the monolithic Sphinx.',
      aiTip: 'Arrive at the gate at 8:00 AM sharp to explore before the desert heat and tourist buses arrive.',
      recommendedDuration: 'Half Day'
    },
    {
      id: 'eg-2',
      name: 'Karnak & Luxor Temples',
      category: 'Historic',
      lat: 25.7188,
      lng: 32.6573,
      cityOrRegion: 'Luxor',
      description: 'The vast ancient city of Thebes with towering hypostyle halls with 134 colossal sandstone columns.',
      aiTip: 'Visit Luxor Temple at night when the stone pharaonic statues are dramatically illuminated.',
      recommendedDuration: 'Full Day'
    },
    {
      id: 'eg-3',
      name: 'Valley of the Kings',
      category: 'Historic',
      lat: 25.7402,
      lng: 32.6014,
      cityOrRegion: 'West Bank Luxor',
      description: 'The royal burial ground of New Kingdom pharaohs featuring brilliantly painted tombs preserved for millennia.',
      aiTip: 'Purchase the ticket for King Tutankhamun and Seti I tombs for the most vibrant surviving hieroglyphics.',
      recommendedDuration: '3-4 hours'
    }
  ],

  // CANADA
  CAN: [
    {
      id: 'ca-1',
      name: 'Banff National Park & Lake Louise',
      category: 'Nature',
      lat: 51.4254,
      lng: -116.1773,
      cityOrRegion: 'Alberta Rockies',
      description: 'World-famous turquoise glacial lakes cradled beneath majestic rugged Rocky Mountain peaks.',
      aiTip: 'Canoe across Lake Louise before 9:00 AM when the water is perfectly still like glass.',
      recommendedDuration: 'Full Day'
    },
    {
      id: 'ca-2',
      name: 'Old Québec (Vieux-Québec)',
      category: 'Historic',
      lat: 46.8123,
      lng: -71.2064,
      cityOrRegion: 'Québec City',
      description: 'The only fortified city in North America north of Mexico, crowned by the grand Château Frontenac.',
      aiTip: 'Stroll down Rue du Petit-Champlain and ride the funicular railway to Dufferin Terrace.',
      recommendedDuration: 'Half Day'
    },
    {
      id: 'ca-3',
      name: 'Niagara Falls (Horseshoe Falls)',
      category: 'Iconic',
      lat: 43.0799,
      lng: -79.0747,
      cityOrRegion: 'Ontario',
      description: 'One of the most powerful waterfalls on Earth, cascading over 168,000 cubic meters of water per minute.',
      aiTip: 'Take the Voyage to the Falls boat tour to experience the thundering mist up close.',
      recommendedDuration: 'Half Day'
    }
  ]
};

/**
 * Returns landmarks for a country, or generates realistic landmarks around capital/center coordinates
 */
export function getLandmarksForCountry(countryCode: string, countryName: string, capital: string, latlng?: [number, number]): Landmark[] {
  const code = countryCode.toUpperCase();
  if (FAMOUS_COUNTRY_LANDMARKS[code]) {
    return FAMOUS_COUNTRY_LANDMARKS[code];
  }

  const baseLat = latlng && latlng.length === 2 ? latlng[0] : 0;
  const baseLng = latlng && latlng.length === 2 ? latlng[1] : 0;

  // Generate 4 representative landmark points around the destination
  return [
    {
      id: `${code.toLowerCase()}-1`,
      name: `${capital} Historic Center & Grand Plaza`,
      category: 'Historic',
      lat: baseLat + 0.05,
      lng: baseLng + 0.04,
      cityOrRegion: capital,
      description: `The vibrant historic core and administrative heart of ${countryName}, home to central plazas and architectural heritage.`,
      aiTip: 'Explore the pedestrian plazas in the morning and visit local artisan galleries.',
      recommendedDuration: '2-3 hours'
    },
    {
      id: `${code.toLowerCase()}-2`,
      name: `National Cultural Museum of ${countryName}`,
      category: 'Cultural',
      lat: baseLat - 0.03,
      lng: baseLng - 0.02,
      cityOrRegion: capital,
      description: `Exhibitions showcasing the folklore, artistic achievements, and traditions of ${countryName}.`,
      aiTip: 'Pick up an audio guide to learn about regional heritage artifacts.',
      recommendedDuration: '2 hours'
    },
    {
      id: `${code.toLowerCase()}-3`,
      name: `${countryName} Scenic National Reserve & Overlook`,
      category: 'Nature',
      lat: baseLat + 0.45,
      lng: baseLng - 0.35,
      cityOrRegion: `Near ${capital}`,
      description: `Spectacular regional landscapes, botanical biodiversity, and hiking trails representative of ${countryName}.`,
      aiTip: 'Pack walking shoes and a camera for panoramic views over the countryside.',
      recommendedDuration: 'Half Day'
    },
    {
      id: `${code.toLowerCase()}-4`,
      name: `${capital} Traditional Market Bazaar`,
      category: 'Culinary',
      lat: baseLat - 0.02,
      lng: baseLng + 0.03,
      cityOrRegion: capital,
      description: `Vibrant culinary quarter where travelers taste authentic local delicacies and seasonal refreshments.`,
      aiTip: 'Sample street food specialities and interact with warm local merchants.',
      recommendedDuration: 'Evening'
    }
  ];
}
