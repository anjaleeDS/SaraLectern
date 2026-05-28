export type Screen = 'intake' | 'confirm' | 'preferences' | 'topics' | 'venues' | 'pitches' | 'dashboard';

export interface SpeakerPreferences {
  formats: string[];           // podcast, video_podcast, conference_talk, panel, workshop, digital_event
  audience_size: string;       // intimate, mid, growing, any
  audience_gender: string;     // women_only, mixed, any
  audience_demo: string;
  geography: string[];         // remote, domestic, international
  timing: string;              // next_3mo, next_6mo, flexible
  compensation: string;        // paid_only, open_unpaid, travel_min
  focus_topics: string[];
  avoid_topics: string[];
  style: string[];             // inspirational, technical, practical, provocative, storytelling
  said_no_to: string;
  dream_opportunity: string;
}

export interface SpeakerProfile {
  name: string;
  title: string;
  expertise_areas: string[];
  years_experience: number;
  key_achievements: string[];
  speaking_experience: string;
  target_audience: string;
  preferences?: SpeakerPreferences;
}

export interface UploadedFile {
  name: string;
  text: string;
  size: number;
}

export interface IntakeData {
  linkedin_url: string;
  bio_text: string;
  career_history: string;
  video_urls: string[];
  best_talk: string;
  files: UploadedFile[];
  preferences: SpeakerPreferences;
}

export interface Topic {
  id: string;
  title: string;
  rationale: string;
  venue_type: 'podcast' | 'video_podcast' | 'conference' | 'workshop' | 'digital_event';
  locked: boolean;
}

export type VenueType = 'podcast' | 'video_podcast' | 'conference' | 'digital_event';
export type AudienceSizeRange = 'intimate' | 'mid' | 'growing';

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  vertical: string;
  audience: string;
  audience_size_range: AudienceSizeRange;
  audience_gender?: 'women' | 'mixed';  // omit = general/any
  topic_tags: string[];
  cfp_url: string;
}

export type MatchScore = 'High' | 'Medium';

export interface VenueMatch {
  venue: Venue;
  score: MatchScore;
  reason: string;
  selected: boolean;
}

export type OutreachStatus = 'Queued' | 'Sent' | 'Opened' | 'Responded' | 'Confirmed' | 'Declined';

export interface PitchDraft {
  venueId: string;
  venueName: string;
  topicTitle: string;
  subjectLine: string;
  body: string;
  approved: boolean;
  edited: boolean;
  originalBody: string;
}

export interface OutreachItem {
  venueId: string;
  venueName: string;
  topicTitle: string;
  status: OutreachStatus;
  lastUpdated: string;
  pitchBody: string;
  subjectLine: string;
}

export interface AppState {
  screen: Screen;
  chatMessages: ChatMessage[];
  profile: SpeakerProfile | null;
  intakeData: IntakeData | null;
  topics: Topic[];
  venueMatches: VenueMatch[];
  pitchDrafts: PitchDraft[];
  outreach: OutreachItem[];
  isLoading: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
