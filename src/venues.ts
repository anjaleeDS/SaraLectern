import { Venue } from './types';

export const VENUES: Venue[] = [
  // Podcasts — intimate (1-on-1 interview format)
  { id: 'v1', name: 'Coaching for Leaders Podcast', type: 'podcast', vertical: 'coaching', audience: 'executive coaches and HR leaders', audience_size_range: 'intimate', topic_tags: ['leadership', 'coaching', 'professional development'], cfp_url: '#' },
  { id: 'v3', name: 'Future of Work Podcast', type: 'podcast', vertical: 'AI/workforce', audience: 'business leaders navigating AI disruption', audience_size_range: 'intimate', topic_tags: ['AI', 'future of work', 'leadership'], cfp_url: '#' },
  { id: 'v6', name: 'The Becoming Podcast', type: 'podcast', vertical: 'coaching', audience: 'mid-career professionals in transition', audience_size_range: 'intimate', topic_tags: ['career transition', 'coaching', 'reinvention'], cfp_url: '#' },
  { id: 'v9', name: 'The Career Clarity Podcast', type: 'podcast', vertical: 'coaching', audience: 'professionals seeking career clarity', audience_size_range: 'intimate', topic_tags: ['career coaching', 'clarity', 'reinvention'], cfp_url: '#' },
  { id: 'v11', name: 'The HR Heartbeat', type: 'podcast', vertical: 'HR/people ops', audience: 'HR practitioners and people leaders', audience_size_range: 'intimate', topic_tags: ['HR', 'people ops', 'culture', 'leadership'], cfp_url: '#' },
  { id: 'v12', name: 'Founder to Founder', type: 'podcast', vertical: 'entrepreneurship', audience: 'early-stage founders and operators', audience_size_range: 'intimate', topic_tags: ['startups', 'entrepreneurship', 'growth', 'leadership'], cfp_url: '#' },
  { id: 'v13', name: 'The Empathetic Leader', type: 'podcast', vertical: 'leadership', audience: 'managers and team leads in mid-size companies', audience_size_range: 'intimate', topic_tags: ['empathy', 'leadership', 'management', 'team building'], cfp_url: '#' },

  // Video Podcasts
  { id: 'v14', name: 'Work Differently with Sara Blake', type: 'video_podcast', vertical: 'future of work', audience: 'knowledge workers and remote team leaders', audience_size_range: 'intimate', topic_tags: ['remote work', 'productivity', 'leadership', 'future of work'], cfp_url: '#' },
  { id: 'v15', name: 'The AI Practitioner Show', type: 'video_podcast', vertical: 'AI/tech', audience: 'practitioners implementing AI in enterprise', audience_size_range: 'mid', topic_tags: ['AI', 'machine learning', 'enterprise tech', 'implementation'], cfp_url: '#' },
  { id: 'v16', name: 'Bold Women in Business', type: 'video_podcast', vertical: 'entrepreneurship', audience: 'women founders, executives, and operators', audience_size_range: 'mid', audience_gender: 'women', topic_tags: ['women in business', 'leadership', 'entrepreneurship', 'DEI'], cfp_url: '#' },
  { id: 'v17', name: 'The Marketing Humanist', type: 'video_podcast', vertical: 'marketing', audience: 'brand strategists and content marketers', audience_size_range: 'mid', topic_tags: ['marketing', 'brand', 'content', 'storytelling'], cfp_url: '#' },

  // Conferences — mid-size (100–500 attendees)
  { id: 'v2', name: 'She Is AI Summit', type: 'conference', vertical: 'AI/workforce', audience: 'women in tech and AI', audience_size_range: 'mid', audience_gender: 'women', topic_tags: ['AI', 'women in tech', 'workforce'], cfp_url: '#' },
  { id: 'v5', name: 'Data-Driven HR Summit', type: 'conference', vertical: 'AI/workforce', audience: 'HR and people analytics leaders', audience_size_range: 'mid', topic_tags: ['data', 'HR', 'analytics', 'AI'], cfp_url: '#' },
  { id: 'v7', name: 'AI + Ethics Forum', type: 'conference', vertical: 'AI/workforce', audience: 'policymakers and tech leaders', audience_size_range: 'mid', topic_tags: ['AI ethics', 'responsible AI', 'policy'], cfp_url: '#' },
  { id: 'v8', name: 'Women in Data Science Conference', type: 'conference', vertical: 'AI/workforce', audience: 'data scientists and analytics leaders', audience_size_range: 'mid', audience_gender: 'women', topic_tags: ['data science', 'women in tech', 'AI'], cfp_url: '#' },
  { id: 'v18', name: 'PeopleFirst HR Conference', type: 'conference', vertical: 'HR/people ops', audience: 'HR directors, CHROs, and talent leaders', audience_size_range: 'mid', topic_tags: ['HR', 'talent', 'people strategy', 'culture'], cfp_url: '#' },
  { id: 'v19', name: 'Startup Marketing Summit', type: 'conference', vertical: 'marketing', audience: 'growth marketers and demand gen leaders at startups', audience_size_range: 'mid', topic_tags: ['marketing', 'growth', 'startups', 'demand gen'], cfp_url: '#' },

  // Conferences — growing (500–1,500 attendees)
  { id: 'v4', name: 'ICF Global Conference', type: 'conference', vertical: 'coaching', audience: 'professional coaches worldwide', audience_size_range: 'growing', topic_tags: ['coaching', 'ICF', 'professional development'], cfp_url: '#' },
  { id: 'v10', name: 'Responsible AI Leadership Summit', type: 'conference', vertical: 'AI/workforce', audience: 'senior leaders implementing AI responsibly', audience_size_range: 'growing', topic_tags: ['responsible AI', 'leadership', 'AI strategy'], cfp_url: '#' },
  { id: 'v20', name: 'Future Leaders Forum', type: 'conference', vertical: 'leadership', audience: 'emerging leaders across industries', audience_size_range: 'growing', topic_tags: ['leadership', 'career development', 'management', 'mentorship'], cfp_url: '#' },

  // Digital Events
  { id: 'v21', name: 'The DEI Practitioner Summit (Virtual)', type: 'digital_event', vertical: 'DEI', audience: 'DEI professionals, HR leaders, and people managers', audience_size_range: 'mid', topic_tags: ['DEI', 'inclusion', 'belonging', 'HR', 'culture'], cfp_url: '#' },
  { id: 'v22', name: 'Coaches Corner Online Intensive', type: 'digital_event', vertical: 'coaching', audience: 'coaches and consultants building their practice', audience_size_range: 'intimate', topic_tags: ['coaching', 'consulting', 'business development', 'professional development'], cfp_url: '#' },
  { id: 'v23', name: 'HealthTech Innovators Webinar Series', type: 'digital_event', vertical: 'healthtech', audience: 'healthcare operators and digital health founders', audience_size_range: 'mid', topic_tags: ['healthcare', 'health tech', 'innovation', 'digital health'], cfp_url: '#' },

  // Pharma & Life Sciences
  { id: 'v24', name: 'Women in Pharma Leadership Summit', type: 'conference', vertical: 'pharma', audience: 'women executives and rising leaders in the pharmaceutical industry', audience_size_range: 'mid', audience_gender: 'women', topic_tags: ['pharmaceutical', 'women in pharma', 'leadership', 'life sciences', 'drug development'], cfp_url: '#' },
  { id: 'v25', name: 'Life Sciences L&D Forum', type: 'conference', vertical: 'pharma', audience: 'learning and development professionals in biotech and pharma', audience_size_range: 'mid', topic_tags: ['learning and development', 'pharmaceutical', 'life sciences', 'talent development', 'biotech'], cfp_url: '#' },
  { id: 'v26', name: 'The Pharma People Podcast', type: 'podcast', vertical: 'pharma', audience: 'HR and people leaders inside pharmaceutical and biotech companies', audience_size_range: 'intimate', topic_tags: ['pharmaceutical', 'HR', 'people ops', 'life sciences', 'talent'], cfp_url: '#' },
];
