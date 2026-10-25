import { ChatCountryContext } from './chat';

export interface DayPlan {
  dayNumber: number;
  title: string;
  location: string;
  morning: string;
  afternoon: string;
  evening: string;
  highlightMeal: string;
  transitTip: string;
  budgetTip?: string;
}

export interface GeneratedItinerary {
  countryName: string;
  tripTitle: string;
  summary: string;
  daysCount: number;
  travelStyle: string;
  pace: string;
  budgetTier: string;
  days: DayPlan[];
  packingAdvice: string[];
  estimatedDailyBudget: string;
  localCurrency: string;
}

export interface ItineraryRequest {
  countryContext: ChatCountryContext;
  days: number;
  travelStyle: string;
  pace: 'Relaxed' | 'Moderate' | 'Fast-Paced';
  budgetTier: 'Budget' | 'Moderate' | 'Luxury';
  startingCity?: string;
  specialNotes?: string;
}
