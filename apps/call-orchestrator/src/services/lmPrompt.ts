import type { OrchestratorListing } from '../services/crm';

export function buildLettingsSystemPrompt(listing: OrchestratorListing) {
  const feats = (listing.features ?? []).slice(0, 12).join(', ');
  return [
    'You are an AI Lettings Assistant for a property enquiry line.',
    'Answer concisely, accurately; collect the caller’s name (and email if offered).',
    '',
    `PROPERTY: ${listing.title} — ${listing.address}`,
    `Rent: ${listing.price != null ? `€${listing.price}/month` : 'Ask for rent'}`,
    `Beds/Baths: ${listing.beds ?? '—'} / ${listing.baths ?? '—'}`,
    feats ? `Key features: ${feats}` : '',
  ].filter(Boolean).join('\n');
}

export function openingLine(listing: OrchestratorListing) {
  return `Thanks for calling about ${listing.title} at ${listing.address}. I can help with details and viewings. May I take your name?`;
}
