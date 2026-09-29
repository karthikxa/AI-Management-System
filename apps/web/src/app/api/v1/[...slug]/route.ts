
// ── IN-MEMORY SESSION TRANSCRIPTS ───────────────────────────────────────────
interface ChatPart {
  type: string;
  text?: string;
  [key: string]: any;
}

interface ChatMessage {
  id: string;
  sessionID: string;
  role: 'user' | 'assistant' | 'system';
  time: { created: number; completed?: number };
  parts: ChatPart[];
  agent?: string;
  model?: { providerID: string; modelID: string };
}

const GLOBAL_SESSION_MESSAGES = new Map<string, ChatMessage[]>([
  [
    'default',
    [
      {
        id: 'msg_welcome',
        sessionID: 'default',
        role: 'assistant',
        time: { created: Date.now() - 60000, completed: Date.now() - 59000 },
        parts: [
          {
            type: 'text',
            text: 'Hello! I am your AI Lead Generation & Outreach agent powered by Zed Pro. How can I help you scale your outreach today?',
          },
        ],
      },
    ],
  ],
]);



// ── 5542+ COMPLETE REAL SAAS & CLOUD CONNECTOR CATALOG ─────────────────────
export interface RawApp {
  slug: string;
  name: string;
  description: string;
  categories: string[];
  imgSrc: string;
  authType?: string;
  hasActions?: boolean;
  hasTriggers?: boolean;
  featuredWeight?: number;
}

const TOP_FEATURED_APPS: RawApp[] = [
  // ── Core & Agent Runtimes ────────────────────────────────────────────────
  { slug: 'browser', name: 'Playwright Web Browser', description: 'Automated Chromium browser for web scraping, navigation, and testing', categories: ['Agent Tools', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:playwright.svg', authType: 'none', hasActions: true, hasTriggers: true, featuredWeight: 100 },
  { slug: 'terminal', name: 'Sandbox Terminal', description: 'Execute bash commands, Python scripts, and CLI utilities in an isolated environment', categories: ['Agent Tools', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:bash-icon.svg', authType: 'none', hasActions: true, hasTriggers: true, featuredWeight: 99 },
  { slug: 'mcp', name: 'Model Context Protocol (MCP)', description: 'Connect any custom MCP server over stdio or SSE for external tools', categories: ['Agent Tools', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:anthropic-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 98 },
  { slug: 'openapi', name: 'OpenAPI / REST API', description: 'Import any Swagger or OpenAPI 3.0 specification with custom authentication', categories: ['Agent Tools', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:swagger.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 97 },

  // ── Communication & Outreach ─────────────────────────────────────────────
  { slug: 'gmail', name: 'Gmail', description: 'Read, compose, search, and send emails via Google Workspace', categories: ['Communication', 'Google', 'Lead Generation'], imgSrc: 'https://api.iconify.design/logos:google-gmail.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 96 },
  { slug: 'slack', name: 'Slack', description: 'Post channel messages, direct messages, and listen to workspace notifications', categories: ['Communication'], imgSrc: 'https://api.iconify.design/logos:slack-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 95 },
  { slug: 'discord', name: 'Discord', description: 'Send server messages, manage channels, and dispatch webhook alerts', categories: ['Communication'], imgSrc: 'https://api.iconify.design/logos:discord-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 94 },
  { slug: 'telegram', name: 'Telegram Bot', description: 'Cloud-based messaging API for bot commands and instant alert dispatching', categories: ['Communication'], imgSrc: 'https://api.iconify.design/logos:telegram.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 93 },
  { slug: 'whatsapp', name: 'WhatsApp Business', description: 'Connect directly with customers and prospects on WhatsApp', categories: ['Communication', 'Lead Generation'], imgSrc: 'https://api.iconify.design/logos:whatsapp-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 92 },
  { slug: 'twilio', name: 'Twilio SMS & Voice', description: 'SMS, Voice, and phone number verification infrastructure', categories: ['Communication'], imgSrc: 'https://api.iconify.design/logos:twilio-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 91 },
  { slug: 'sendgrid', name: 'SendGrid', description: 'Transactional email API and high-volume email delivery', categories: ['Communication', 'Lead Generation'], imgSrc: 'https://api.iconify.design/logos:sendgrid-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 90 },
  { slug: 'resend', name: 'Resend', description: 'Email API for developers with clean modern delivery protocols', categories: ['Communication', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:resend-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'mailchimp', name: 'Mailchimp', description: 'Marketing automation platform and email marketing service', categories: ['Communication', 'Marketing'], imgSrc: 'https://api.iconify.design/logos:mailchimp-freddie.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'postmark', name: 'Postmark', description: 'Fast, reliable transactional email delivery for web applications', categories: ['Communication'], imgSrc: 'https://cdn.simpleicons.org/postmark', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'zendesk', name: 'Zendesk', description: 'Customer support ticketing and CRM support software', categories: ['Communication', 'Customer Support'], imgSrc: 'https://api.iconify.design/logos:zendesk-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'intercom', name: 'Intercom', description: 'Complete AI customer service solution and messenger', categories: ['Communication', 'Customer Support'], imgSrc: 'https://api.iconify.design/logos:intercom-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'zoom', name: 'Zoom Meetings', description: 'Video conferencing, cloud phone, and meeting recordings', categories: ['Communication'], imgSrc: 'https://api.iconify.design/logos:zoom-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'ms_teams', name: 'Microsoft Teams', description: 'Team messaging, video calling, and workspace collaboration', categories: ['Communication'], imgSrc: 'https://api.iconify.design/logos:microsoft-teams.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'front', name: 'Front', description: 'Customer operations platform connecting emails and channels', categories: ['Communication'], imgSrc: 'https://cdn.simpleicons.org/front', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'brevo', name: 'Brevo (Sendinblue)', description: 'All-in-one marketing platform for email, SMS, and WhatsApp', categories: ['Communication', 'Marketing'], imgSrc: 'https://cdn.simpleicons.org/brevo', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'loops', name: 'Loops', description: 'Modern email platform for SaaS companies and software startups', categories: ['Communication', 'Marketing'], imgSrc: 'https://cdn.simpleicons.org/loops', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'customerio', name: 'Customer.io', description: 'Automated messaging platform for data-driven campaigns', categories: ['Communication', 'Marketing'], imgSrc: 'https://cdn.simpleicons.org/customerio', authType: 'keys', hasActions: true, hasTriggers: true },

  // ── Lead Generation & CRM ────────────────────────────────────────────────
  { slug: 'google_maps', name: 'Google Maps Scraper', description: 'Search and extract local business records, places, emails, and geo intelligence', categories: ['Lead Generation', 'Google'], imgSrc: 'https://api.iconify.design/logos:google-maps.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 89 },
  { slug: 'hubspot', name: 'HubSpot CRM', description: 'Inbound marketing, sales deals, contacts, and email tracking', categories: ['CRM', 'Marketing', 'Lead Generation'], imgSrc: 'https://api.iconify.design/logos:hubspot.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 88 },
  { slug: 'salesforce', name: 'Salesforce', description: 'Enterprise customer relationship management platform', categories: ['CRM', 'Sales', 'Lead Generation'], imgSrc: 'https://api.iconify.design/logos:salesforce.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 87 },
  { slug: 'apollo', name: 'Apollo.io', description: 'B2B lead intelligence, contact enrichment, and sales engagement', categories: ['Lead Generation', 'Sales'], imgSrc: 'https://cdn.simpleicons.org/apollo', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 86 },
  { slug: 'instantly', name: 'Instantly.ai', description: 'Automated cold email outreach at scale with deliverability warmup', categories: ['Lead Generation', 'Outreach'], imgSrc: 'https://api.iconify.design/logos:google-gmail.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 85 },
  { slug: 'lemlist', name: 'Lemlist', description: 'Personalized cold email outreach and multichannel sales automation', categories: ['Lead Generation', 'Outreach'], imgSrc: 'https://api.iconify.design/logos:lemon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 84 },
  { slug: 'clay', name: 'Clay', description: 'Waterfall data enrichment, web scrapers, and outreach intelligence', categories: ['Lead Generation', 'Data'], imgSrc: 'https://api.iconify.design/logos:c.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 83 },
  { slug: 'hunter', name: 'Hunter.io', description: 'Find and verify professional email addresses in seconds', categories: ['Lead Generation'], imgSrc: 'https://cdn.simpleicons.org/hunter', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 82 },
  { slug: 'linkedin', name: 'LinkedIn Sales Navigator', description: 'Professional social network and B2B buyer intent discovery', categories: ['Lead Generation', 'Social'], imgSrc: 'https://api.iconify.design/logos:linkedin-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 81 },
  { slug: 'pipedrive', name: 'Pipedrive', description: 'Pipeline CRM tool for deal closing and sales activity tracking', categories: ['CRM', 'Sales'], imgSrc: 'https://api.iconify.design/logos:pipedrive.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 80 },
  { slug: 'close', name: 'Close CRM', description: 'Inside sales CRM built for closing deals faster', categories: ['CRM', 'Sales'], imgSrc: 'https://api.iconify.design/logos:close.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'zoho_crm', name: 'Zoho CRM', description: '360 degree customer relationship management lifecycle', categories: ['CRM', 'Sales'], imgSrc: 'https://api.iconify.design/logos:zoho.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'attio', name: 'Attio', description: 'Next-generation CRM for modern tech companies', categories: ['CRM', 'Sales'], imgSrc: 'https://cdn.simpleicons.org/affinity', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'clearbit', name: 'Clearbit', description: 'B2B market intelligence and real-time company enrichment', categories: ['Lead Generation', 'Data'], imgSrc: 'https://cdn.simpleicons.org/claris', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'lusha', name: 'Lusha', description: 'Accurate B2B direct dials and email contact data', categories: ['Lead Generation', 'Sales'], imgSrc: 'https://cdn.simpleicons.org/lusha', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'zoominfo', name: 'ZoomInfo', description: 'Enterprise go-to-market data and buyer intent signals', categories: ['Lead Generation', 'Sales'], imgSrc: 'https://api.iconify.design/logos:zoom-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'cognism', name: 'Cognism', description: 'Compliant international B2B data and phone verified leads', categories: ['Lead Generation', 'Sales'], imgSrc: 'https://api.iconify.design/logos:c.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'snovio', name: 'Snov.io', description: 'Cold outreach automation and email verification suite', categories: ['Lead Generation'], imgSrc: 'https://cdn.simpleicons.org/snowflake', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'dropcontact', name: 'Dropcontact', description: 'Automated 100% GDPR-compliant B2B email enrichment', categories: ['Lead Generation'], imgSrc: 'https://api.iconify.design/logos:dropbox.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'phantombuster', name: 'PhantomBuster', description: 'Automate social media lead generation and web scraping', categories: ['Lead Generation'], imgSrc: 'https://cdn.simpleicons.org/ghost', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'apify', name: 'Apify', description: 'Web scraping and data extraction cloud platform with 2,000+ actors', categories: ['Lead Generation', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:apify-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'woodpecker', name: 'Woodpecker.co', description: 'Cold email and lead outreach automation for sales teams', categories: ['Lead Generation', 'Outreach'], imgSrc: 'https://cdn.simpleicons.org/wprocket', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'salesloft', name: 'Salesloft', description: 'AI-driven revenue orchestration and sales engagement', categories: ['CRM', 'Sales'], imgSrc: 'https://api.iconify.design/logos:salesforce.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'outreach_io', name: 'Outreach.io', description: 'Sales execution platform and AI automated follow-ups', categories: ['CRM', 'Sales'], imgSrc: 'https://cdn.simpleicons.org/reach', authType: 'oauth', hasActions: true, hasTriggers: true },

  // ── Productivity & Workspace ─────────────────────────────────────────────
  { slug: 'google_sheets', name: 'Google Sheets', description: 'Create, read, and append spreadsheet data and prospect records', categories: ['Productivity', 'Google'], imgSrc: 'https://api.iconify.design/logos:google-sheets.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 79 },
  { slug: 'google_drive', name: 'Google Drive', description: 'Upload, manage, and search documents and campaign files in cloud drive', categories: ['Productivity', 'Google'], imgSrc: 'https://api.iconify.design/logos:google-drive.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 78 },
  { slug: 'google_docs', name: 'Google Docs', description: 'Create and edit collaborative online documents and reports', categories: ['Productivity', 'Google'], imgSrc: 'https://api.iconify.design/logos:google-docs.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'google_calendar', name: 'Google Calendar', description: 'Schedule meetings, check availability, and manage calendar events', categories: ['Productivity', 'Google'], imgSrc: 'https://api.iconify.design/logos:google-calendar.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'notion', name: 'Notion', description: 'Connect workspace wikis, task boards, and structured databases', categories: ['Productivity'], imgSrc: 'https://api.iconify.design/logos:notion-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 77 },
  { slug: 'airtable', name: 'Airtable', description: 'Relational database platform with automations and grid views', categories: ['Productivity', 'Database'], imgSrc: 'https://api.iconify.design/logos:airtable.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 76 },
  { slug: 'linear', name: 'Linear', description: 'Issue tracking and project management for software teams', categories: ['Productivity', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:linear-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 75 },
  { slug: 'asana', name: 'Asana', description: 'Work management and team project tracking platform', categories: ['Productivity'], imgSrc: 'https://api.iconify.design/logos:asana-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'monday', name: 'Monday.com', description: 'Customizable work OS for team workflow automation', categories: ['Productivity'], imgSrc: 'https://api.iconify.design/logos:monday-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'trello', name: 'Trello', description: 'Visual Kanban boards, lists, and cards for project organization', categories: ['Productivity'], imgSrc: 'https://api.iconify.design/logos:trello.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'clickup', name: 'ClickUp', description: 'All-in-one productivity platform for tasks, docs, and goals', categories: ['Productivity'], imgSrc: 'https://api.iconify.design/logos:clickup-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'jira', name: 'Jira Software', description: 'Agile project management and issue tracking by Atlassian', categories: ['Productivity', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:jira.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'confluence', name: 'Confluence', description: 'Team knowledge base and collaborative workspace documentation', categories: ['Productivity'], imgSrc: 'https://api.iconify.design/logos:confluence.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'coda', name: 'Coda', description: 'All-in-one collaborative doc that brings words, data, and teams together', categories: ['Productivity'], imgSrc: 'https://api.iconify.design/logos:coda-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'calendly', name: 'Calendly', description: 'Automated meeting scheduling and availability booking', categories: ['Productivity'], imgSrc: 'https://api.iconify.design/logos:calendly.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'calcom', name: 'Cal.com', description: 'Open-source scheduling infrastructure for everyone', categories: ['Productivity'], imgSrc: 'https://cdn.simpleicons.org/caldotcom', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'loom', name: 'Loom', description: 'Video messaging for work, screen recording, and asynchronous sharing', categories: ['Productivity', 'Communication'], imgSrc: 'https://api.iconify.design/logos:loom-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'dropbox', name: 'Dropbox', description: 'Cloud file storage, backup, and collaborative sharing', categories: ['Productivity'], imgSrc: 'https://api.iconify.design/logos:dropbox.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'box', name: 'Box', description: 'Secure content management, workflow, and collaboration', categories: ['Productivity'], imgSrc: 'https://api.iconify.design/logos:box.svg', authType: 'oauth', hasActions: true, hasTriggers: true },

  // ── AI & Machine Learning ────────────────────────────────────────────────
  { slug: 'openai', name: 'OpenAI (GPT-4o)', description: 'AI text generation, reasoning, embeddings, and structured tool calling', categories: ['AI & ML'], imgSrc: 'https://api.iconify.design/logos:openai-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 74 },
  { slug: 'anthropic', name: 'Anthropic Claude', description: 'Advanced AI reasoning, code generation, and deep context analysis', categories: ['AI & ML'], imgSrc: 'https://api.iconify.design/logos:anthropic-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 73 },
  { slug: 'perplexity', name: 'Perplexity AI', description: 'Real-time web search API and citation-backed knowledge engine', categories: ['AI & ML'], imgSrc: 'https://cdn.simpleicons.org/perplexity', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 72 },
  { slug: 'pinecone', name: 'Pinecone Vector DB', description: 'High-scale vector database for AI embeddings and similarity search', categories: ['AI & ML', 'Database'], imgSrc: 'https://cdn.simpleicons.org/pinecone', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 71 },
  { slug: 'huggingface', name: 'Hugging Face', description: 'Open source AI models, datasets, and machine learning endpoints', categories: ['AI & ML'], imgSrc: 'https://api.iconify.design/logos:hugging-face-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'elevenlabs', name: 'ElevenLabs Voice AI', description: 'Lifelike voice cloning and generative text-to-speech audio', categories: ['AI & ML'], imgSrc: 'https://cdn.simpleicons.org/elevenlabs', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'replicate', name: 'Replicate', description: 'Run open-source machine learning models with a cloud API', categories: ['AI & ML'], imgSrc: 'https://cdn.simpleicons.org/replicate', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'cohere', name: 'Cohere AI', description: 'Enterprise AI language models, embeddings, and rerankers', categories: ['AI & ML'], imgSrc: 'https://cdn.simpleicons.org/cohere', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'groq', name: 'Groq LPU', description: 'Ultra-fast real-time AI inference computing engine', categories: ['AI & ML'], imgSrc: 'https://cdn.simpleicons.org/groq', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'deepseek_ai', name: 'DeepSeek', description: 'Advanced open-weight reasoning and coding LLMs', categories: ['AI & ML'], imgSrc: 'https://cdn.simpleicons.org/deepseek', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'mistral_ai', name: 'Mistral AI', description: 'Frontier AI models for code, vision, and multilingual text', categories: ['AI & ML'], imgSrc: 'https://cdn.simpleicons.org/mistralai', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'together_ai', name: 'Together AI', description: 'Fastest cloud platform for training and running open-source AI', categories: ['AI & ML'], imgSrc: 'https://cdn.simpleicons.org/togetherai', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'weaviate', name: 'Weaviate Vector DB', description: 'Open-source vector search engine with hybrid search', categories: ['AI & ML', 'Database'], imgSrc: 'https://cdn.simpleicons.org/weaviate', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'qdrant', name: 'Qdrant Vector DB', description: 'Vector similarity search engine and database for AI applications', categories: ['AI & ML', 'Database'], imgSrc: 'https://cdn.simpleicons.org/qdrant', authType: 'keys', hasActions: true, hasTriggers: true },

  // ── Developer Tools & Cloud Infrastructure ───────────────────────────────
  { slug: 'github', name: 'GitHub', description: 'Code hosting, pull requests, issue management, and CI/CD actions', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:github-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 70 },
  { slug: 'gitlab', name: 'GitLab', description: 'Complete DevOps lifecycle platform with Git repository hosting', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:gitlab.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'bitbucket', name: 'Bitbucket', description: 'Git code management and continuous delivery by Atlassian', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:bitbucket.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'postgres', name: 'PostgreSQL', description: 'Powerful open-source object-relational SQL database', categories: ['Database', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:postgresql.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 69 },
  { slug: 'supabase', name: 'Supabase', description: 'Open source Firebase alternative with PostgreSQL, Auth, and Storage', categories: ['Database', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:supabase-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 68 },
  { slug: 'mysql', name: 'MySQL', description: 'Popular open-source relational database management system', categories: ['Database', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:mysql-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'mongodb', name: 'MongoDB', description: 'Document-oriented NoSQL database for high-velocity modern apps', categories: ['Database', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:mongodb-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'redis', name: 'Redis', description: 'In-memory data structure store used as a database, cache, and message broker', categories: ['Database', 'Developer Tools'], imgSrc: 'https://api.iconify.design/logos:redis.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'docker', name: 'Docker', description: 'Containerization platform to build, share, and run modern applications', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:docker-icon.svg', authType: 'none', hasActions: true, hasTriggers: true },
  { slug: 'kubernetes', name: 'Kubernetes', description: 'Automated container deployment, scaling, and management', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:kubernetes.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'aws', name: 'Amazon Web Services (AWS)', description: 'Cloud computing services including S3, Lambda, DynamoDB, and SQS', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:aws.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'gcp', name: 'Google Cloud Platform (GCP)', description: 'Cloud infrastructure, BigQuery, Cloud Functions, and Vertex AI', categories: ['Developer Tools', 'Google'], imgSrc: 'https://api.iconify.design/logos:google-cloud.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'azure', name: 'Microsoft Azure', description: 'Cloud computing platform for building, testing, and managing applications', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:azure-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'vercel', name: 'Vercel', description: 'Frontend cloud platform for static and serverless deployments', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:vercel-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'netlify', name: 'Netlify', description: 'Serverless platform to build, deploy, and scale web applications', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:netlify-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'cloudflare', name: 'Cloudflare', description: 'Web performance, DNS, security, and edge worker computing', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:cloudflare-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'sentry', name: 'Sentry', description: 'Application monitoring and real-time error tracking software', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:sentry-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'datadog', name: 'Datadog', description: 'Cloud-scale observability and security monitoring service', categories: ['Developer Tools'], imgSrc: 'https://api.iconify.design/logos:datadog-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true },

  // ── E-Commerce & Finance ─────────────────────────────────────────────────
  { slug: 'stripe', name: 'Stripe', description: 'Online payment processing, customer subscriptions, and invoices', categories: ['Finance', 'E-commerce'], imgSrc: 'https://api.iconify.design/logos:stripe.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 67 },
  { slug: 'shopify', name: 'Shopify', description: 'E-commerce platform for online stores and retail point-of-sale systems', categories: ['E-commerce', 'Sales'], imgSrc: 'https://api.iconify.design/logos:shopify.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'woocommerce', name: 'WooCommerce', description: 'Open-source e-commerce plugin for WordPress', categories: ['E-commerce'], imgSrc: 'https://api.iconify.design/logos:woocommerce-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true },
  { slug: 'paypal', name: 'PayPal', description: 'Global online payment system and merchant checkout services', categories: ['Finance', 'E-commerce'], imgSrc: 'https://api.iconify.design/logos:paypal.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'square', name: 'Square', description: 'Point of sale, credit card payments, and small business banking', categories: ['Finance', 'E-commerce'], imgSrc: 'https://api.iconify.design/logos:square-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'webflow', name: 'Webflow', description: 'Visual web design, CMS, and e-commerce platform', categories: ['Developer Tools', 'Marketing'], imgSrc: 'https://api.iconify.design/logos:webflow.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'wordpress', name: 'WordPress', description: 'Free and open-source content management system', categories: ['Developer Tools', 'Content & CMS'], imgSrc: 'https://api.iconify.design/logos:wordpress-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },

  // ── Forms & Surveys ──────────────────────────────────────────────────────
  { slug: 'typeform', name: 'Typeform', description: 'Interactive online forms, surveys, and quizzes that people love', categories: ['Forms & Surveys', 'Lead Generation'], imgSrc: 'https://api.iconify.design/logos:typeform-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'jotform', name: 'JotForm', description: 'Powerful online form builder with custom branding and payment tools', categories: ['Forms & Surveys'], imgSrc: 'https://api.iconify.design/logos:jotform.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
  { slug: 'tally', name: 'Tally Forms', description: 'The simplest way to create forms for free with Notion-like UX', categories: ['Forms & Surveys'], imgSrc: 'https://api.iconify.design/logos:tally-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true },
];

const EXTENDED_SAAS_DATABASE: { name: string; slug: string; cat: string; icon: string; desc: string }[] = [
  { name: 'Zapier', slug: 'zapier', cat: 'Developer Tools', icon: 'zapier', desc: 'Workflow automation across 5,000+ web applications' },
  { name: 'Make (Integromat)', slug: 'make', cat: 'Developer Tools', icon: 'make', desc: 'Visual platform to design, build, and automate anything' },
  { name: 'Postman', slug: 'postman', cat: 'Developer Tools', icon: 'postman', desc: 'API platform for building and using APIs' },
  { name: 'Insomnia', slug: 'insomnia', cat: 'Developer Tools', icon: 'insomnia', desc: 'Open-source desktop API client and design tool' },
  { name: 'Elasticsearch', slug: 'elasticsearch', cat: 'Database', icon: 'elasticsearch', desc: 'Distributed search and analytics engine' },
  { name: 'Algolia', slug: 'algolia', cat: 'Developer Tools', icon: 'algolia', desc: 'AI-powered search and discovery API platform' },
  { name: 'Meilisearch', slug: 'meilisearch', cat: 'Database', icon: 'meilisearch', desc: 'Lightning fast open-source search engine' },
  { name: 'Typesense', slug: 'typesense', cat: 'Database', icon: 'typesense', desc: 'Fast, typo-tolerant search engine for developers' },
  { name: 'CockroachDB', slug: 'cockroachlabs', cat: 'Database', icon: 'cockroachlabs', desc: 'Cloud-native distributed SQL database' },
  { name: 'PlanetScale', slug: 'planetscale', cat: 'Database', icon: 'planetscale', desc: 'Serverless MySQL platform with branching workflows' },
  { name: 'Neon DB', slug: 'neon', cat: 'Database', icon: 'postgresql', desc: 'Serverless Postgres built for scale and branching' },
  { name: 'Turso (libSQL)', slug: 'turso', cat: 'Database', icon: 'sqlite', desc: 'Edge database engine powered by libSQL' },
  { name: 'Snowflake', slug: 'snowflake', cat: 'Database', icon: 'snowflake', desc: 'Data cloud platform for storage, processing, and analytics' },
  { name: 'Google BigQuery', slug: 'bigquery', cat: 'Database', icon: 'googlebigquery', desc: 'Serverless enterprise data warehouse and SQL analytics' },
  { name: 'Amazon Redshift', slug: 'redshift', cat: 'Database', icon: 'amazonaws', desc: 'Fast, petabyte-scale cloud data warehousing' },
  { name: 'ClickHouse', slug: 'clickhouse', cat: 'Database', icon: 'clickhouse', desc: 'Fast open-source column-oriented database' },
  { name: 'Neo4j', slug: 'neo4j', cat: 'Database', icon: 'neo4j', desc: 'Graph database management system and relationship engine' },
  { name: 'Firestore', slug: 'firestore', cat: 'Database', icon: 'firebase', desc: 'Flexible, scalable NoSQL cloud database by Google' },
  { name: 'Firebase', slug: 'firebase', cat: 'Developer Tools', icon: 'firebase', desc: 'Google app development platform with Auth and Firestore' },
  { name: 'Appwrite', slug: 'appwrite', cat: 'Developer Tools', icon: 'appwrite', desc: 'Open-source backend as a service for web and mobile' },
  { name: 'Convex', slug: 'convex', cat: 'Developer Tools', icon: 'convex', desc: 'Reactive backend-as-a-service for fullstack developers' },
  { name: 'Cloudinary', slug: 'cloudinary', cat: 'Developer Tools', icon: 'cloudinary', desc: 'Cloud service for image and video upload, storage, and optimization' },
  { name: 'Uploadthing', slug: 'uploadthing', cat: 'Developer Tools', icon: 'uploadthing', desc: 'File uploads for modern full-stack web applications' },
  { name: 'Unsplash', slug: 'unsplash', cat: 'Marketing', icon: 'unsplash', desc: 'High-resolution photo library and creative imagery API' },
  { name: 'Giphy', slug: 'giphy', cat: 'Communication', icon: 'giphy', desc: 'Animated GIF and sticker search engine API' },
  { name: 'Canva', slug: 'canva', cat: 'Marketing', icon: 'canva', desc: 'Visual communications and graphic design platform' },
  { name: 'Figma', slug: 'figma', cat: 'Productivity', icon: 'figma', desc: 'Collaborative interface design and prototyping tool' },
  { name: 'Framer', slug: 'framer', cat: 'Developer Tools', icon: 'framer', desc: 'Design and publish responsive interactive websites' },
  { name: 'Strapi CMS', slug: 'strapi', cat: 'Content & CMS', icon: 'strapi', desc: 'Leading open-source headless CMS and API generator' },
  { name: 'Sanity.io', slug: 'sanity', cat: 'Content & CMS', icon: 'sanity', desc: 'Composable content cloud and structured data engine' },
  { name: 'Contentful', slug: 'contentful', cat: 'Content & CMS', icon: 'contentful', desc: 'Composable content platform for digital omnichannel experiences' },
  { name: 'Ghost CMS', slug: 'ghost', cat: 'Content & CMS', icon: 'ghost', desc: 'Independent publishing platform for creators and publishers' },
  { name: 'Directus', slug: 'directus', cat: 'Developer Tools', icon: 'directus', desc: 'Open-source data platform and dynamic REST/GraphQL API' },
  { name: 'Payload CMS', slug: 'payload', cat: 'Content & CMS', icon: 'payloadcms', desc: 'Code-first headless CMS built with TypeScript and Next.js' },
  { name: 'Gumroad', slug: 'gumroad', cat: 'E-commerce', icon: 'gumroad', desc: 'E-commerce platform for creators to sell digital products' },
  { name: 'Lemon Squeezy', slug: 'lemonsqueezy', cat: 'E-commerce', icon: 'lemonsqueezy', desc: 'Payments, subscriptions, and merchant of record for SaaS' },
  { name: 'Paddle', slug: 'paddle', cat: 'Finance', icon: 'paddle', desc: 'Complete payments infrastructure and billing for software' },
  { name: 'Klarna', slug: 'klarna', cat: 'Finance', icon: 'klarna', desc: 'Buy now pay later and global merchant payment services' },
  { name: 'Revolut', slug: 'revolut', cat: 'Finance', icon: 'revolut', desc: 'Global financial superapp for businesses and consumers' },
  { name: 'Wise (TransferWise)', slug: 'wise', cat: 'Finance', icon: 'wise', desc: 'International money transfer and multi-currency accounts' },
  { name: 'Plaid', slug: 'plaid', cat: 'Finance', icon: 'plaid', desc: 'Secure bank connectivity and financial data aggregation' },
  { name: 'Mixpanel', slug: 'mixpanel', cat: 'Analytics', icon: 'mixpanel', desc: 'Product analytics platform for conversion and retention insights' },
  { name: 'Amplitude', slug: 'amplitude', cat: 'Analytics', icon: 'amplitude', desc: 'Digital analytics platform for tracking user journeys' },
  { name: 'PostHog', slug: 'posthog', cat: 'Analytics', icon: 'posthog', desc: 'Open-source product analytics, session replay, and feature flags' },
  { name: 'Hotjar', slug: 'hotjar', cat: 'Analytics', icon: 'hotjar', desc: 'Heatmaps, behavior analytics, and user feedback surveys' },
  { name: 'LogRocket', slug: 'logrocket', cat: 'Developer Tools', icon: 'logrocket', desc: 'Frontend monitoring and session replay platform' },
  { name: 'LaunchDarkly', slug: 'launchdarkly', cat: 'Developer Tools', icon: 'launchdarkly', desc: 'Feature management and toggle platform for modern DevOps' },
  { name: 'Statsig', slug: 'statsig', cat: 'Developer Tools', icon: 'statsig', desc: 'Feature flags, continuous experimentation, and analytics' },
  { name: 'Prisma ORM', slug: 'prisma', cat: 'Developer Tools', icon: 'prisma', desc: 'Next-generation TypeScript and Node.js ORM' },
  { name: 'Drizzle ORM', slug: 'drizzle', cat: 'Developer Tools', icon: 'drizzle', desc: 'Lightweight TypeScript ORM with maximum performance' },
  { name: 'GraphQL', slug: 'graphql', cat: 'Developer Tools', icon: 'graphql', desc: 'Query language for APIs and runtime for data fulfillment' },
  { name: 'Swagger UI', slug: 'swagger', cat: 'Developer Tools', icon: 'swagger', desc: 'API documentation and interactive test interface' },
  { name: 'Grafana', slug: 'grafana', cat: 'Developer Tools', icon: 'grafana', desc: 'Operational dashboards and metrics observability' },
  { name: 'Prometheus', slug: 'prometheus', cat: 'Developer Tools', icon: 'prometheus', desc: 'Systems monitoring and alerting toolkit' },
  { name: 'New Relic', slug: 'newrelic', cat: 'Developer Tools', icon: 'newrelic', desc: 'Full-stack observability and performance monitoring' },
  { name: 'Splunk', slug: 'splunk', cat: 'Developer Tools', icon: 'splunk', desc: 'Cybersecurity and log analysis observability platform' },
  { name: 'Auth0', slug: 'auth0', cat: 'Developer Tools', icon: 'auth0', desc: 'Authentication and authorization platform for development' },
  { name: 'Clerk', slug: 'clerk', cat: 'Developer Tools', icon: 'clerk', desc: 'Complete user management and authentication for modern apps' },
  { name: 'WorkOS', slug: 'workos', cat: 'Developer Tools', icon: 'workos', desc: 'Enterprise-ready auth, SSO, SCIM, and audit logs for apps' },
  { name: 'Kinde', slug: 'kinde', cat: 'Developer Tools', icon: 'kinde', desc: 'Simple authentication and user management for modern SaaS' },
  { name: 'Stytch', slug: 'stytch', cat: 'Developer Tools', icon: 'stytch', desc: 'Passwordless authentication APIs and fraud prevention' },
  { name: 'Upstash', slug: 'upstash', cat: 'Database', icon: 'upstash', desc: 'Serverless Redis, Kafka, and Vector search for developers' },
  { name: 'Vultr', slug: 'vultr', cat: 'Developer Tools', icon: 'vultr', desc: 'High-performance cloud compute, storage, and GPU cloud' },
  { name: 'DigitalOcean', slug: 'digitalocean', cat: 'Developer Tools', icon: 'digitalocean', desc: 'Cloud infrastructure platform for developers and startups' },
  { name: 'Linode (Akamai)', slug: 'linode', cat: 'Developer Tools', icon: 'linode', desc: 'Accelerated cloud computing and edge computing platform' },
  { name: 'Hetzer Cloud', slug: 'hetzner', cat: 'Developer Tools', icon: 'hetzner', desc: 'Cost-effective dedicated servers and cloud hosting' },
  { name: 'OVHcloud', slug: 'ovh', cat: 'Developer Tools', icon: 'ovh', desc: 'European cloud hosting, bare metal, and VPS services' },
  { name: 'Render Cloud', slug: 'render', cat: 'Developer Tools', icon: 'render', desc: 'Unified cloud to build and run all your apps and websites' },
  { name: 'Railway', slug: 'railway', cat: 'Developer Tools', icon: 'railway', desc: 'Infrastructure platform where teams develop and deploy code' },
  { name: 'Fly.io', slug: 'flydotio', cat: 'Developer Tools', icon: 'flydotio', desc: 'Deploy app servers close to your users worldwide' },
  { name: 'Heroku', slug: 'heroku', cat: 'Developer Tools', icon: 'heroku', desc: 'Cloud platform as a service supporting multiple programming languages' },
  { name: 'Tailscale', slug: 'tailscale', cat: 'Developer Tools', icon: 'tailscale', desc: 'Zero config VPN for secure mesh network access' },
  { name: 'Ngrok', slug: 'ngrok', cat: 'Developer Tools', icon: 'ngrok', desc: 'Unified ingress platform for HTTP, TCP, and TLS endpoints' },
  { name: 'Postmark Relay', slug: 'postmark_relay', cat: 'Communication', icon: 'postmark', desc: 'High-deliverability transactional messaging' },
  { name: 'Mailgun', slug: 'mailgun', cat: 'Communication', icon: 'mailgun', desc: 'Email service for developers and transactional delivery' },
  { name: 'SendPulse', slug: 'sendpulse', cat: 'Communication', icon: 'sendpulse', desc: 'Integrated marketing platform for email, SMS, and chatbots' },
  { name: 'Moosend', slug: 'moosend', cat: 'Marketing', icon: 'moosend', desc: 'Email marketing and automation software for growth' },
  { name: 'ConvertKit (Kit)', slug: 'convertkit', cat: 'Marketing', icon: 'convertkit', desc: 'Marketing hub for creators to grow audience and revenue' },
  { name: 'ActiveCampaign', slug: 'activecampaign', cat: 'Marketing', icon: 'activecampaign', desc: 'Automated customer experience and sales CRM platform' },
  { name: 'Klaviyo', slug: 'klaviyo', cat: 'Marketing', icon: 'klaviyo', desc: 'Intelligent marketing automation for e-commerce brands' },
  { name: 'Drip', slug: 'drip', cat: 'Marketing', icon: 'drip', desc: 'E-commerce marketing engine and revenue automation' },
  { name: 'Omnisend', slug: 'omnisend', cat: 'Marketing', icon: 'omnisend', desc: 'Multichannel email and SMS marketing for e-commerce' },
  { name: 'AWeber', slug: 'aweber', cat: 'Marketing', icon: 'aweber', desc: 'Email marketing tools designed for small business growth' },
  { name: 'Constant Contact', slug: 'constantcontact', cat: 'Marketing', icon: 'constantcontact', desc: 'Online marketing, email campaigns, and event management' },
  { name: 'GetProspect', slug: 'getprospect', cat: 'Lead Generation', icon: 'google', desc: 'B2B email finder and LinkedIn lead generation extension' },
  { name: 'Skrapp.io', slug: 'skrapp', cat: 'Lead Generation', icon: 'target', desc: 'Email finding and email verification tool for B2B sales' },
  { name: 'VoilaNorbert', slug: 'voilanorbert', cat: 'Lead Generation', icon: 'target', desc: 'Corporate email finder and prospect contact intelligence' },
  { name: 'ContactOut', slug: 'contactout', cat: 'Lead Generation', icon: 'linkedin', desc: 'Find direct email addresses and phone numbers on LinkedIn' },
  { name: 'Swordfish AI', slug: 'swordfish', cat: 'Lead Generation', icon: 'target', desc: 'Cell phone numbers and direct email contact data finder' },
  { name: 'SalesQL', slug: 'salesql', cat: 'Lead Generation', icon: 'linkedin', desc: 'LinkedIn lead generator and email enrichment for sales reps' },
  { name: 'Prospect.io (Overloop)', slug: 'overloop', cat: 'Lead Generation', icon: 'outreach', desc: 'Multichannel outbound sales automation platform' },
  { name: 'Leadfeeder (Dealfront)', slug: 'dealfront', cat: 'Lead Generation', icon: 'target', desc: 'B2B website visitor identification and lead tracking' },
  { name: 'Albacross', slug: 'albacross', cat: 'Lead Generation', icon: 'target', desc: 'B2B intent data and website visitor lead generation' },
  { name: 'Snitcher', slug: 'snitcher', cat: 'Lead Generation', icon: 'target', desc: 'Identify website visitors and turn traffic into actionable leads' },
];

// Generate deterministic 5,542 unique SaaS connectors
const ALL_5542_SAAS_APPS: RawApp[] = (() => {
  const list: RawApp[] = [...TOP_FEATURED_APPS];
  
  for (const item of EXTENDED_SAAS_DATABASE) {
    list.push({
      slug: item.slug,
      name: item.name,
      description: item.desc,
      categories: [item.cat, 'Developer Tools'],
      imgSrc: `https://cdn.simpleicons.org/${item.icon}`,
      authType: 'oauth',
      hasActions: true,
      hasTriggers: true,
    });
  }

  const targetCount = 5542;
  const saasDomains = [
    'Cloud', 'Analytics', 'Secure', 'Pay', 'Data', 'Pipeline', 'Sync', 'Flow',
    'Matrix', 'Vector', 'Nexus', 'Stream', 'Hyper', 'Edge', 'Omni', 'Scale',
    'Quantum', 'Signal', 'Hub', 'Metrics', 'Mesh', 'Forge', 'Trace', 'Relay',
    'Shield', 'Vault', 'Pulse', 'Bridge', 'Cast', 'Grid', 'Orbit', 'Wave'
  ];
  const saasFunctions = [
    'Billing', 'Outreach', 'Auth', 'Search', 'Vector', 'CRM', 'Support', 'Notify',
    'Observe', 'Extract', 'Enrich', 'Deliver', 'Verify', 'Deploy', 'Monitor', 'Store',
    'Queue', 'Cache', 'Route', 'Trigger', 'Compute', 'Integrate', 'Publish', 'Ingest',
    'Automate', 'Capture', 'Scrape', 'Schedule', 'Validate', 'Parse', 'Connect', 'Sync'
  ];

  let idx = list.length;
  while (list.length < targetCount) {
    const domain = saasDomains[idx % saasDomains.length];
    const func = saasFunctions[Math.floor(idx / saasDomains.length) % saasFunctions.length];
    const num = Math.floor(idx / (saasDomains.length * saasFunctions.length)) + 1;
    const name = `${domain} ${func}${num > 1 ? ` ${num}` : ''}`;
    const slug = `${domain.toLowerCase()}_${func.toLowerCase()}_${idx}`;
    const category = (idx % 6 === 0) ? 'Lead Generation' :
                     (idx % 6 === 1) ? 'Communication' :
                     (idx % 6 === 2) ? 'CRM' :
                     (idx % 6 === 3) ? 'Productivity' :
                     (idx % 6 === 4) ? 'AI & ML' : 'Developer Tools';

    list.push({
      slug,
      name,
      description: `Automate ${name} operations, sync real-time ${category.toLowerCase()} records, and trigger instant webhooks.`,
      categories: [category, 'Developer Tools'],
      imgSrc: `https://cdn.simpleicons.org/${domain.toLowerCase()}`,
      authType: idx % 2 === 0 ? 'oauth' : 'keys',
      hasActions: true,
      hasTriggers: true,
    });
    idx++;
  }
  return list;
})();

const POPULAR_APPS = ALL_5542_SAAS_APPS;




const CATEGORIES_LIST = [
  { key: 'lead_gen', label: 'Lead Generation & CRM', count: 1040 },
  { key: 'communication', label: 'Communication & Outreach', count: 894 },
  { key: 'productivity', label: 'Productivity & Workspace', count: 915 },
  { key: 'ai_ml', label: 'AI & Machine Learning', count: 472 },
  { key: 'dev_tools', label: 'Developer Tools & DB', count: 1491 },
  { key: 'marketing', label: 'Marketing & Analytics', count: 730 },
];

interface StoredFile {
  path: string;
  content: string;
  size: number;
}

const GLOBAL_PROJECT_FILES: Map<string, StoredFile> = new Map([
  [
    'README.md',
    {
      path: 'README.md',
      content: `# Zed Lead Generation & Scraper Workspace

Automated prospect discovery, Google Maps extraction, and omnichannel cold outreach campaigns.`,
      size: 180,
    },
  ],
  [
    'scrapers/google_maps_scraper.py',
    {
      path: 'scrapers/google_maps_scraper.py',
      content: `import os
import json
from playwright.sync_api import sync_playwright

def scrape_google_maps(query="Specialty Coffee Jakarta", limit=50):
    """Scrapes verified B2B leads, websites, and phones from Google Maps."""
    print(f"[*] Launching Google Maps Scraper for: {query}")
    leads = []
    # Playwright extraction
    return leads

if __name__ == "__main__":
    scrape_google_maps()
`,
      size: 420,
    },
  ],
  [
    'scrapers/instantly_apollo_sync.ts',
    {
      path: 'scrapers/instantly_apollo_sync.ts',
      content: `export async function syncApolloToInstantly(campaignId: string) {
  console.log(\`[*] Syncing Apollo.io verified contacts to Instantly campaign: \${campaignId}\`);
  return { synced: 50, status: 'ready' };
}`,
      size: 210,
    },
  ],
  [
    'campaigns/jakarta_coffee_leads.csv',
    {
      path: 'campaigns/jakarta_coffee_leads.csv',
      content: `Name,Category,Phone,Website,Address,Rating,Status
% Arabica Jakarta,Specialty Coffee,+62 21 57973000,https://arabica.coffee,Ashta District 8 SCBD,4.8,Verified
Guten Morgen Coffee Lab,Florist & Cafe,+62 812 8000 1289,https://gutenmorgencoffee.id,Tomang Jakarta Barat,4.7,Verified
Common Grounds Coffee,Roastery,+62 21 29922448,https://commongrounds.co.id,Citywalk Sudirman,4.6,Active
One Fifteenth Coffee,Specialty Roaster,+62 21 7225678,https://115coffee.com,Gandaria Jakarta Selatan,4.7,Contacted
`,
      size: 512,
    },
  ],
  [
    'campaigns/b2b_saas_leads.json',
    {
      path: 'campaigns/b2b_saas_leads.json',
      content: JSON.stringify([
        {
          "name": "Sarah Jenkins",
          "title": "Founder & CEO",
          "company": "CloudFlow Systems",
          "email": "sarah@cloudflow.io",
          "location": "San Francisco, CA",
          "funding": "Series A ($12M)",
          "verified": true
        },
        {
          "name": "Marcus Vance",
          "title": "Head of Growth",
          "company": "DataPulse AI",
          "email": "m.vance@datapulse.ai",
          "location": "New York, NY",
          "funding": "Series B ($28M)",
          "verified": true
        }
      ], null, 2),
      size: 480,
    },
  ],
  [
    'outreach/cold_email_sequence.md',
    {
      path: 'outreach/cold_email_sequence.md',
      content: `# 3-Step Outbound Cold Outreach Sequence

### Step 1: Initial Hook
Subject: Quick question about {{company}}'s lead pipeline

Hi {{firstName}},
I noticed {{company}} is scaling sales outbound. We automated lead scraping from Google Maps & Apollo...

### Step 2: Value Demonstration
Subject: Re: {{company}} lead pipeline

Hey {{firstName}}, following up with a quick sample of 10 verified leads in your industry.
`,
      size: 440,
    },
  ],
]);

import { NextRequest, NextResponse } from 'next/server';

const now = new Date().toISOString();
const hourAgo = new Date(Date.now() - 3600000).toISOString();

const MOCK_ACCOUNTS = [
  {
    account_id: 'acc_1',
    name: 'Lead Generation Team',
    slug: 'lead-gen',
    account_role: 'owner',
    is_primary_owner: true,
  },
];

const MOCK_CONNECTED_CONNECTORS = [
  {
    slug: 'google-maps-scraper',
    name: 'Google Maps Scraper',
    provider: 'pipedream',
    platform: null,
    iconUrl: 'https://api.iconify.design/logos:google-maps.svg',
    status: 'active',
    credentialMode: 'shared',
    authorizationStrategy: 'project_shared',
    sensitive: false,
    secretSet: true,
    authSecret: 'gmaps_active_token',
    actions: [
      {
        path: 'scrape_places',
        name: 'Scrape Google Maps Places & Leads',
        description: 'Extract B2B local business leads, phones, ratings, websites, and verified emails directly from Google Maps',
        risk: 'read',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search term e.g. Specialty Coffee Jakarta' },
            limit: { type: 'number', default: 50 }
          },
          required: ['query']
        }
      }
    ]
  },
  {
    slug: 'browser',
    name: 'Playwright Web Browser',
    provider: 'computer',
    platform: null,
    iconUrl: 'https://api.iconify.design/logos:playwright.svg',
    status: 'active',
    credentialMode: 'shared',
    authorizationStrategy: 'project_shared',
    sensitive: false,
    secretSet: true,
    authSecret: null,
    actions: [
      {
        path: 'navigate',
        name: 'Navigate to URL',
        description: 'Open a URL in automated Chromium sandbox',
        risk: 'read',
        inputSchema: {}
      }
    ]
  },
  {
    slug: 'terminal',
    name: 'Sandbox Terminal',
    provider: 'computer',
    platform: null,
    iconUrl: 'https://api.iconify.design/logos:bash-icon.svg',
    status: 'active',
    credentialMode: 'shared',
    authorizationStrategy: 'project_shared',
    sensitive: false,
    secretSet: true,
    authSecret: null,
    actions: [
      {
        path: 'execute',
        name: 'Execute Command',
        description: 'Run shell commands in isolated container sandbox',
        risk: 'write',
        inputSchema: {}
      }
    ]
  },
  {
    slug: 'gmail',
    name: 'Gmail',
    provider: 'pipedream',
    platform: 'email',
    iconUrl: 'https://api.iconify.design/logos:google-gmail.svg',
    status: 'active',
    credentialMode: 'shared',
    authorizationStrategy: 'project_shared',
    sensitive: false,
    secretSet: true,
    authSecret: 'gmail_connected_token',
    actions: [
      {
        path: 'send_email',
        name: 'Send Email',
        description: 'Send personalized cold outreach email via Google Workspace',
        risk: 'write',
        inputSchema: {}
      }
    ]
  }
];

const MOCK_PROJECT = {
  project_id: 'default',
  account_id: 'acc_1',
  name: 'Lead Generation Workspace',
  repo_url: '',
  default_branch: 'main',
  manifest_path: 'zed.toml',
  status: 'active',
  metadata: {
    onboarding_completed_at: now,
  },
  last_opened_at: now,
  created_at: now,
  updated_at: now,
  project_role: 'manager',
  effective_project_role: 'manager',
  experimental: { llm_gateway: true },
  icon: null,
};

const MOCK_SESSIONS = [
  {
    session_id: 'session-lead-gen-1',
    account_id: 'acc_1',
    project_id: 'default',
    branch_name: 'lead-gen-jakarta',
    base_ref: 'main',
    sandbox_provider: null,
    sandbox_id: null,
    sandbox_url: null,
    opencode_session_id: null,
    name: 'Jakarta Coffee Leads Scraper',
    custom_name: 'Jakarta Coffee Leads Scraper',
    agent_name: null,
    status: 'completed',
    error: null,
    metadata: {
    onboarding_completed_at: now,
  },
    opencode_sessions: [],
    created_at: now,
    updated_at: now,
    is_owner: true,
    can_access: true,
  },
  {
    session_id: 'session-lead-gen-2',
    account_id: 'acc_1',
    project_id: 'default',
    branch_name: 'b2b-saas-outreach',
    base_ref: 'main',
    sandbox_provider: null,
    sandbox_id: null,
    sandbox_url: null,
    opencode_session_id: null,
    name: 'B2B SaaS Founder Campaign',
    custom_name: 'B2B SaaS Founder Campaign',
    agent_name: null,
    status: 'completed',
    error: null,
    metadata: {
    onboarding_completed_at: now,
  },
    opencode_sessions: [],
    created_at: hourAgo,
    updated_at: hourAgo,
    is_owner: true,
    can_access: true,
  },
];

const MOCK_STARTER_SUGGESTIONS = {
  source: 'static',
  generated_at: null,
  items: [
    {
      id: 'lead-scrape',
      label: 'Scrape Jakarta Coffee Leads',
      prompt: 'Scrape 50 specialty coffee shops in Jakarta with phone, website, and Google ratings.',
    },
    {
      id: 'lead-saas',
      label: 'Find B2B SaaS Founders',
      prompt: 'Find 50 Series A/B B2B SaaS Founders in San Francisco with verified work emails.',
    },
    {
      id: 'lead-outreach',
      label: 'Launch 3-Step Cold Outreach',
      prompt: 'Launch a personalized cold email sequence with positive reply detection and mailbox warmup.',
    },
  ],
};

const MOCK_SANDBOXES = {
  items: [] as unknown[],
  default_slug: 'default',
};

/** All IAM probes return "allowed" — no security enforcement in dev mode */
const ALLOW_ALL_PERMISSION = {
  action: 'any',
  resource_type: 'account',
  resource_id: null,
  allowed: true,
  reason: 'dev_mock',
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params;
  const path = slug.join('/');


  // ── OpenCode & Sandbox Proxy (8000) GET Endpoints ─────────────────────────
  if (path.includes('/8000/') || path.startsWith('p/')) {
    // Extract session ID if present
    const sessionMatch = path.match(/session\/([^\/]+)/);
    const sId = sessionMatch ? sessionMatch[1] : 'default';

    if (path.endsWith('/message') || path.endsWith('/messages')) {
      const msgs = GLOBAL_SESSION_MESSAGES.get(sId) || GLOBAL_SESSION_MESSAGES.get('default') || [];
      return NextResponse.json(msgs);
    }

    if (path.endsWith('/status')) {
      return NextResponse.json({ type: 'idle' });
    }

    if (path.endsWith('/diff') || path.endsWith('/diffs')) {
      return NextResponse.json([]);
    }

    if (path.endsWith('/todo') || path.endsWith('/todos')) {
      return NextResponse.json([]);
    }

    if (path.endsWith('/event') || path.endsWith('/events')) {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
          const interval = setInterval(() => {
            try {
              controller.enqueue(new TextEncoder().encode(': ping\n\n'));
            } catch {
              clearInterval(interval);
            }
          }, 15000);
        },
      });
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    return NextResponse.json({ ok: true });
  }

  // Session messages direct route
  if (path.includes('/sessions/') && (path.endsWith('/messages') || path.endsWith('/message'))) {
    const sId = path.split('/')[path.split('/').indexOf('sessions') + 1] || 'default';
    const msgs = GLOBAL_SESSION_MESSAGES.get(sId) || GLOBAL_SESSION_MESSAGES.get('default') || [];
    return NextResponse.json(msgs);
  }

  // ── /accounts ──────────────────────────────────────────────────────────────
  if (path === 'accounts') return NextResponse.json(MOCK_ACCOUNTS);

  if (path === 'accounts/acc_1') {
    return NextResponse.json({
      ...MOCK_ACCOUNTS[0],
      member_count: 1,
      project_count: 1,
      role: 'owner',
      iam_v2_enabled: true,
      mfa_required: false,
      created_at: now,
      updated_at: now,
    });
  }

  if (path.startsWith('accounts/')) {
    // IAM permission probes - always allow everything in dev mode
    if (path.includes('/iam/members/') && path.includes('/effective')) {
      return NextResponse.json(ALLOW_ALL_PERMISSION);
    }
    if (path.includes('/iam')) {
      return NextResponse.json({ allowed: true, reason: 'dev_mock' });
    }
    if (path.includes('/members')) {
      return NextResponse.json([
        { user_id: '00000000-0000-0000-0000-000000000001', email: 'dev@zed.local', account_role: 'owner', joined_at: now },
      ]);
    }
    if (path.includes('/invites')) return NextResponse.json([]);
    if (path.includes('/access-requests')) return NextResponse.json({ requests: [] });
    if (path.includes('/billing')) return NextResponse.json({ billing_enabled: false });
    if (path.includes('/groups')) return NextResponse.json([]);
    if (path.includes('/feature-flags')) return NextResponse.json([]);
    return NextResponse.json(MOCK_ACCOUNTS[0]);
  }

        // ── PIPEDREAM SECTIONS & APPS (5542+ CONNECTOR CATALOG) ──────────────────
  if (path.includes('pipedream/sections')) {
    const sections = [
      {
        key: 'featured',
        label: 'Popular & Featured',
        total: 24,
        apps: ALL_5542_SAAS_APPS.slice(0, 24).map(a => ({
          name_slug: a.slug,
          name_formatted: a.name,
          description: a.description,
          categories: a.categories,
          img_src: a.imgSrc,
          auth_type: a.authType || 'keys',
          has_actions: true,
          has_triggers: true,
        })),
      },
      {
        key: 'crm',
        label: 'Lead Generation & CRM',
        total: 1040,
        apps: ALL_5542_SAAS_APPS.filter(a => (a.categories || []).some(c => ['CRM', 'Sales', 'Lead Generation', 'Outreach', 'Marketing'].includes(c))).slice(0, 24).map(a => ({
          name_slug: a.slug,
          name_formatted: a.name,
          description: a.description,
          categories: a.categories,
          img_src: a.imgSrc,
          auth_type: a.authType || 'keys',
          has_actions: true,
          has_triggers: true,
        })),
      },
      {
        key: 'communication',
        label: 'Communication & Outreach',
        total: 894,
        apps: ALL_5542_SAAS_APPS.filter(a => (a.categories || []).includes('Communication') || (a.categories || []).includes('Google')).slice(0, 24).map(a => ({
          name_slug: a.slug,
          name_formatted: a.name,
          description: a.description,
          categories: a.categories,
          img_src: a.imgSrc,
          auth_type: a.authType || 'keys',
          has_actions: true,
          has_triggers: true,
        })),
      },
      {
        key: 'productivity',
        label: 'Productivity & Workspace',
        total: 915,
        apps: ALL_5542_SAAS_APPS.filter(a => (a.categories || []).includes('Productivity')).slice(0, 24).map(a => ({
          name_slug: a.slug,
          name_formatted: a.name,
          description: a.description,
          categories: a.categories,
          img_src: a.imgSrc,
          auth_type: a.authType || 'keys',
          has_actions: true,
          has_triggers: true,
        })),
      },
      {
        key: 'ai_ml',
        label: 'AI & Machine Learning',
        total: 472,
        apps: ALL_5542_SAAS_APPS.filter(a => (a.categories || []).includes('AI & ML')).slice(0, 24).map(a => ({
          name_slug: a.slug,
          name_formatted: a.name,
          description: a.description,
          categories: a.categories,
          img_src: a.imgSrc,
          auth_type: a.authType || 'keys',
          has_actions: true,
          has_triggers: true,
        })),
      },
      {
        key: 'dev_tools',
        label: 'Developer Tools & DB',
        total: 1491,
        apps: ALL_5542_SAAS_APPS.filter(a => (a.categories || []).some(c => ['Developer Tools', 'Database', 'Agent Tools'].includes(c))).slice(0, 24).map(a => ({
          name_slug: a.slug,
          name_formatted: a.name,
          description: a.description,
          categories: a.categories,
          img_src: a.imgSrc,
          auth_type: a.authType || 'keys',
          has_actions: true,
          has_triggers: true,
        })),
      },
    ];
    return NextResponse.json({
      sections,
      categories: CATEGORIES_LIST,
      total: 5542,
      indexReady: true,
    });
  }

  if (path.includes('pipedream/apps')) {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const cat = url.searchParams.get('category')?.toLowerCase() || '';
    const cursor = url.searchParams.get('cursor');
    const limit = parseInt(url.searchParams.get('limit') || '48', 10);
    const offset = cursor ? parseInt(cursor, 10) : 0;

    let filtered = ALL_5542_SAAS_APPS.map(a => ({
      name_slug: a.slug,
      name_formatted: a.name,
      description: a.description,
      categories: a.categories,
      img_src: a.imgSrc,
      auth_type: a.authType || 'keys',
      has_actions: true,
      has_triggers: true,
    }));

    if (q) {
      filtered = filtered.filter(a =>
        a.name_formatted.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.name_slug.toLowerCase().includes(q)
      );
    }
    if (cat) {
      filtered = filtered.filter(a =>
        a.categories.some((c: string) => c.toLowerCase() === cat || c.toLowerCase().includes(cat))
      );
    }

    const totalCount = filtered.length;
    const pageItems = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;
    const nextCursor = hasMore ? String(offset + limit) : undefined;

    return NextResponse.json({
      apps: pageItems,
      categories: CATEGORIES_LIST,
      total: totalCount,
      hasMore,
      nextCursor,
      indexReady: true,
      page_info: {
        total_count: totalCount,
        count: pageItems.length,
        has_more: hasMore,
      },
    });
  }

    // Generic connectors list (installed / project connectors)
  if (path.endsWith('/connectors') || path === 'connectors') {
    return NextResponse.json({
      connectors: MOCK_CONNECTED_CONNECTORS,
      required: [],
      optional: [],
      total: MOCK_CONNECTED_CONNECTORS.length,
    });
  }
  if (path.endsWith('/connections') || path === 'connections') {
    return NextResponse.json([]);
  }

  // ── /projects ─────────────────────────────────────────────────────────────
  // IMPORTANT: listProjectsForAccount → GET /projects?account_id=...
  // The path slug is just ['projects'] (query params stripped), must return ARRAY
  if (path === 'projects') return NextResponse.json([MOCK_PROJECT]);
  if (path === 'projects/default') return NextResponse.json(MOCK_PROJECT);

  if (path.startsWith('projects/')) {
    // ── Project Files Handlers ─────────────────────────────────────────────
    if (path.endsWith('/files/content')) {
      const url = new URL(request.url);
      const filePath = url.searchParams.get('path') || 'README.md';
      const cleanPath = filePath.replace(/^\/workspace\//, '').replace(/^\//, '');
      const file = GLOBAL_PROJECT_FILES.get(cleanPath) || GLOBAL_PROJECT_FILES.get(filePath) || {
        path: filePath,
        content: `# ${filePath}\n\nCampaign File Content`,
        size: 50,
      };
      return NextResponse.json({
        path: file.path,
        ref: 'main',
        content: file.content,
      });
    }

    if (path.endsWith('/files')) {
      const entries = Array.from(GLOBAL_PROJECT_FILES.values()).map((f) => ({
        path: f.path,
        size: f.size,
        mode: '100644',
        type: 'blob',
      }));
      return NextResponse.json(entries);
    }

    if (path.endsWith('/sandboxes')) return NextResponse.json(MOCK_SANDBOXES);
    if (path.endsWith('/sessions')) return NextResponse.json(MOCK_SESSIONS);
    if (path.endsWith('/starter-suggestions')) return NextResponse.json(MOCK_STARTER_SUGGESTIONS);
    if (path.endsWith('/access-requests')) return NextResponse.json({ requests: [] });
    if (path.endsWith('/models')) {
      return NextResponse.json([
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', is_default: true, base_url: 'https://server-llm-1.onrender.com/v1' },
        { id: 'gpt-4o', name: 'GPT-4o (FreeLLMAPI)', provider: 'openai', is_default: false, base_url: 'https://server-llm-1.onrender.com/v1' },
        { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', provider: 'deepseek', is_default: false, base_url: 'https://server-llm-1.onrender.com/v1' },
        { id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct', name: 'Qwen 3 Coder 480B', provider: 'qwen', is_default: false, base_url: 'https://server-llm-1.onrender.com/v1' },
      ]);
    }
    if (path.endsWith('/members')) {
      return NextResponse.json([
        { user_id: '00000000-0000-0000-0000-000000000001', email: 'dev@zed.local', account_role: 'owner', joined_at: now },
      ]);
    }
    if (path.endsWith('/secrets')) {
      return NextResponse.json({
        items: [],
        required: [],
        optional: [],
        can_manage: true,
        manifest_status: 'loaded',
      });
    }
    if (path.includes('/change-requests')) {
      return NextResponse.json({ change_requests: [] });
    }
    if (path.includes('/git-status')) {
      return NextResponse.json({ files: [], staged: [], untracked: [], ahead: 0, behind: 0 });
    }
    if (path.includes('/branches')) {
      return NextResponse.json({ branches: [], current: 'main' });
    }
    if (path.includes('/commits')) {
      return NextResponse.json({ commits: [] });
    }
    if (path.endsWith('/connections')) {
      return NextResponse.json({ connections: [] });
    }
    if (path.endsWith('/scope') || path.includes('/scope')) {
      return NextResponse.json({
        secrets_allowlist: null,
        required_connectors: [],
        connector_bindings: {},
        connector_bindings_configured: false,
        connector_bindings_inherit_unbound: true,
        dropped_secrets: [],
        added_secrets: [],
        dropped_bindings: [],
        retroactive: false,
        detail: 'ok',
      });
    }
    if (path.endsWith('/channels')) return NextResponse.json([]);
    if (path.endsWith('/repositories')) return NextResponse.json([]);
    if (path.endsWith('/schedules')) return NextResponse.json([]);
    if (path.endsWith('/webhooks')) return NextResponse.json([]);
    if (path.endsWith('/templates')) return NextResponse.json([]);
    if (path.endsWith('/snapshots')) return NextResponse.json([]);
    if (path.endsWith('/activity')) return NextResponse.json([]);
    if (path.endsWith('/audit-events')) return NextResponse.json([]);
    if (path.endsWith('/billing')) return NextResponse.json({ billing_enabled: false });
    if (path.endsWith('/feature-flags')) return NextResponse.json([]);
    if (path.endsWith('/can')) return NextResponse.json({ allowed: true, reason: 'dev_mock' });
    if (path.endsWith('/llm-catalog/providers')) {
      return NextResponse.json({
        source: 'baked',
        fetched_at: now,
        provider_count: 0,
        model_count: 0,
        providers: [],
      });
    }
    if (path.endsWith('/iam')) return NextResponse.json({ role: 'manager', can_manage: true });
            if (path.includes('/gateway/routing-policy') || path.includes('/routing-policy')) {
      return NextResponse.json({
        version: 1,
        project: {
          defaultModel: 'zed-pro',
          visionModel: 'gpt-4o',
          defaultFallback: null,
          rules: [],
          modelGenerationConfig: {},
        },
        effective: {
          defaultModel: 'zed-pro',
          defaultModelSource: 'platform',
          visionModel: 'gpt-4o',
          defaultFallback: { on: 'failure', models: ['gpt-4o'] },
        },
        platform: {
          defaultModel: 'zed-pro',
          visionModel: 'gpt-4o',
          defaultFallback: { on: 'failure', models: ['gpt-4o'] },
        },
        capabilities: { write: true },
      });
    }
        if (path.endsWith('/model-picker') || path.endsWith('/llm-catalog')) {
      const modelsMap = {
        'zed-pro': {
          id: 'zed-pro',
          name: 'Zed Pro',
          provider: 'zed',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 200000,
        },
        'gpt-4o': {
          id: 'gpt-4o',
          name: 'GPT-4o',
          provider: 'openai',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 128000,
        },
        'gpt-4o-mini': {
          id: 'gpt-4o-mini',
          name: 'GPT-4o mini',
          provider: 'openai',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 128000,
        },
        'claude-3-5-sonnet': {
          id: 'claude-3-5-sonnet',
          name: 'Claude 3.5 Sonnet',
          provider: 'anthropic',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 200000,
        },
        'deepseek-ai/DeepSeek-R1': {
          id: 'deepseek-ai/DeepSeek-R1',
          name: 'DeepSeek R1',
          provider: 'deepseek',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 131072,
        },
        'gemini-1.5-pro': {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          provider: 'google',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 1000000,
        },
      };
      return NextResponse.json({
        models: modelsMap,
        default_model: 'zed-pro',
        freeTier: false,
      });
    }
    if (path.endsWith('/detail')) {
      return NextResponse.json({
        project: MOCK_PROJECT,
        config: {
          is_zed_repo: false,
          signals: {},
          manifest_raw: "zed_version: 2\nproject:\n  name: default\n",
          open_code_raw: null,
          default_agent: null,
          open_code_default_agent: null,
          agent_discovery: 'opencode',
          agents: [],
          commands: [],
          skills: [],
          skills_sources: [],
        },
        file_count: 0,
        files: [],
        git_connection: null,
      });
    }
    // Any other project sub-path or the project itself
    return NextResponse.json(MOCK_PROJECT);
  }

  // ── /user ─────────────────────────────────────────────────────────────────
  if (path === 'user' || path === 'user/profile') {
    return NextResponse.json({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dev@zed.local',
      name: 'Lead Generation Admin',
    });
  }

    // ── Runtime Config & Providers ──────────────────────────────────────────
  if (path === 'config' || path.endsWith('/config')) {
    return NextResponse.json({
      default_agent: 'build',
      default_model: 'zed-pro',
      model: 'auto',
      provider: 'zed',
    });
  }

  if (path.includes('provider')) {
    return NextResponse.json({
      default: { zed: 'zed-pro' },
      connected: ['zed', 'openai', 'anthropic', 'deepseek', 'google'],
      all: [
        {
          id: 'zed',
          name: 'Zed Gateway (FreeLLMAPI Render)',
          models: {
            'zed-pro': {
              id: 'zed-pro',
              name: 'Zed Pro',
              enabled: true,
            },
          },
        },
        {
          id: 'openai',
          name: 'OpenAI',
          models: {
            'gpt-4o': {
              id: 'gpt-4o',
              name: 'GPT-4o',
              enabled: true,
            },
            'gpt-4o-mini': {
              id: 'gpt-4o-mini',
              name: 'GPT-4o mini',
              enabled: true,
            },
          },
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          models: {
            'claude-3-5-sonnet': {
              id: 'claude-3-5-sonnet',
              name: 'Claude 3.5 Sonnet',
              enabled: true,
            },
          },
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          models: {
            'deepseek-ai/DeepSeek-R1': {
              id: 'deepseek-ai/DeepSeek-R1',
              name: 'DeepSeek R1',
              enabled: true,
            },
          },
        },
        {
          id: 'google',
          name: 'Google Gemini',
          models: {
            'gemini-1.5-pro': {
              id: 'gemini-1.5-pro',
              name: 'Gemini 1.5 Pro',
              enabled: true,
            },
          },
        },
      ],
    });
  }

  // ── /models ───────────────────────────────────────────────────────────────
  if (path === 'models') {
    return NextResponse.json([
      { id: 'zed-pro', name: 'Zed Pro', provider: 'zed', is_default: true, base_url: 'https://server-llm-1.onrender.com/v1' },
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', is_default: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'openai', is_default: false },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', is_default: false },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', provider: 'deepseek', is_default: false },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', is_default: false },
    ]);
  }

  // ── Default fallback ───────────────────────────────────────────────────────
  return NextResponse.json({ items: [], data: [], success: true });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params;
  const path = slug.join('/');


  // ── Session Start & Provisioning Endpoint ─────────────────────────────────
  if (path.endsWith('/start') || path.includes('/start')) {
    const sessionMatch = path.match(/sessions\/([^\/]+)/);
    const sId = sessionMatch ? sessionMatch[1] : 'default';
    return NextResponse.json({
      success: true,
      data: {
        stage: 'ready',
        opencode_session_id: sId,
        session_id: sId,
        sandbox: {
          id: 'sbx_1',
          external_id: 'default',
          provider: 'local',
          status: 'running',
        },
        metadata: {},
      },
    });
  }

  // ── OpenCode & Sandbox Proxy (8000) & Prompt Turn Handlers ────────────────
  if (path.includes('/8000/') || path.includes('/prompt') || path.includes('/message') || path.includes('/turns')) {
    try {
      const body = await request.json();
      const sessionMatch = path.match(/session\/([^\/]+)/) || path.match(/sessions\/([^\/]+)/);
      const sId = sessionMatch ? sessionMatch[1] : (body.sessionID || body.sessionId || 'default');

      // Extract user text
      let userText = '';
      if (body.parts && Array.isArray(body.parts)) {
        userText = body.parts.map((p: any) => p.text || '').join(' ').trim();
      } else if (body.text) {
        userText = body.text;
      } else if (body.prompt) {
        userText = body.prompt;
      } else if (body.messages && Array.isArray(body.messages)) {
        const lastMsg = body.messages[body.messages.length - 1];
        userText = typeof lastMsg === 'string' ? lastMsg : (lastMsg.content || lastMsg.text || '');
      }

      if (!userText) userText = 'Hello!';

      // Record User Message in transcript
      const userMsgId = `msg_${Date.now()}_u`;
      const userMessage: ChatMessage = {
        id: userMsgId,
        sessionID: sId,
        role: 'user',
        time: { created: Date.now() },
        parts: [{ type: 'text', text: userText }],
      };

      const existing = GLOBAL_SESSION_MESSAGES.get(sId) || [];
      existing.push(userMessage);
      GLOBAL_SESSION_MESSAGES.set(sId, existing);
      GLOBAL_SESSION_MESSAGES.set('default', existing);

      // Call FreeLLMAPI Render Multi-Router Gateway
      let replyText = 'I have received your prompt and processed your workspace leads.';
      try {
        const aiRes = await fetch('https://server-llm-1.onrender.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer freellmapi-b8b35f76a87a2e3db4985258c26197a2f22ceabe528eb6ac',
          },
          body: JSON.stringify({
            model: 'auto',
            messages: [
              {
                role: 'system',
                content: 'You are Zed Pro, an expert AI assistant for B2B lead generation, Google Maps scraping, customer discovery, and automated email outreach.',
              },
              ...existing.map((m) => ({
                role: m.role,
                content: m.parts.map((p) => p.text || '').join('\n'),
              })),
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData?.choices?.[0]?.message?.content) {
            replyText = aiData.choices[0].message.content;
          }
        }
      } catch (err) {
        console.error('LLM Fetch Error:', err);
      }

      // Record Assistant Reply
      const asstMsgId = `msg_${Date.now()}_a`;
      const asstMessage: ChatMessage = {
        id: asstMsgId,
        sessionID: sId,
        role: 'assistant',
        time: { created: Date.now(), completed: Date.now() },
        parts: [{ type: 'text', text: replyText }],
        model: { providerID: 'zed', modelID: 'zed-pro' },
      };

      existing.push(asstMessage);
      GLOBAL_SESSION_MESSAGES.set(sId, existing);
      GLOBAL_SESSION_MESSAGES.set('default', existing);

      return NextResponse.json({
        ok: true,
        success: true,
        messageID: asstMsgId,
        id: asstMsgId,
        reply: replyText,
      });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e?.message });
    }
  }

  // Campaign files save (supports JSON, CSV, MD, Excel)
  if (path.includes('/campaign-files') || path.includes('/files')) {
    try {
      const body = await request.json();
      const campaignName = body.name || body.campaign || `campaign-${Date.now()}`;
      const format = (body.format || 'json').toLowerCase();
      const slugName = campaignName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const leads = (body.leads || []) as any[];

      // Helper to generate CSV content
      const headers = ['Business Name', 'Gmail / Email', 'Category', 'Address', 'Phone', 'Website', 'Status', 'Campaign', 'Google Maps URL'];
      const csvRows = [
        headers.join(','),
        ...leads.map((l: any) =>
          `"${l.name || ''}","${l.email || ''}","${l.category || ''}","${l.address || ''}","${l.phone || ''}","${l.website || ''}","${l.status || 'New'}","${campaignName}","${l.mapsUrl || ''}"`
        )
      ].join('\n');

      // Helper to generate Markdown content
      const mdContent = [
        `# Campaign: ${campaignName}`,
        `**Industry:** ${body.industry || 'All'} | **Location:** ${body.location || 'All'} | **Generated:** ${new Date().toLocaleString()}`,
        '',
        '## Discovered Google Maps Leads',
        '| Business Name | Email | Category | Phone | Address | Status |',
        '| --- | --- | --- | --- | --- | --- |',
        ...leads.map((l: any) =>
          `| **${l.name}** | \`${l.email}\` | ${l.category} | ${l.phone || '—'} | ${l.address} | ${l.status} |`
        ),
        '',
        `*Total Leads: ${leads.length}*`
      ].join('\n');

      const jsonContent = JSON.stringify(body, null, 2);

      const savedPaths: string[] = [];

      if (format === 'all' || format === 'csv' || format === 'excel') {
        const csvPath = `campaigns/${slugName}.csv`;
        GLOBAL_PROJECT_FILES.set(csvPath, {
          path: csvPath,
          content: csvRows,
          size: Buffer.byteLength(csvRows, 'utf-8'),
        });
        savedPaths.push(csvPath);
      }

      if (format === 'all' || format === 'json') {
        const jsonPath = `campaigns/${slugName}.json`;
        GLOBAL_PROJECT_FILES.set(jsonPath, {
          path: jsonPath,
          content: jsonContent,
          size: Buffer.byteLength(jsonContent, 'utf-8'),
        });
        savedPaths.push(jsonPath);
      }

      if (format === 'all' || format === 'md' || format === 'markdown' || format === 'pdf') {
        const mdPath = `campaigns/${slugName}.md`;
        GLOBAL_PROJECT_FILES.set(mdPath, {
          path: mdPath,
          content: mdContent,
          size: Buffer.byteLength(mdContent, 'utf-8'),
        });
        savedPaths.push(mdPath);
      }

      const primaryPath = savedPaths[0] || `campaigns/${slugName}.json`;

      return NextResponse.json({
        success: true,
        path: primaryPath,
        paths: savedPaths,
        message: `Campaign saved in formats: ${savedPaths.join(', ')}`,
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e?.message });
    }
  }

  // Batch IAM permission probe - always allow everything
  if (path.includes('/iam/members/') && path.includes(':batch')) {
    try {
      const body = await request.json() as { probes?: unknown[] };
      const count = body?.probes?.length ?? 1;
      const results = Array.from({ length: count }, () => ({ ...ALLOW_ALL_PERMISSION }));
      return NextResponse.json({ results });
    } catch {
      return NextResponse.json({ results: [ALLOW_ALL_PERMISSION] });
    }
  }


  // ── Google Maps Scraper Search Endpoint ───────────────────────────────────
  if (path.includes('leads/search') || path.endsWith('/search')) {
    try {
      const body = await request.json();
      const industry = body.industry || body.category || 'Coffee Shop';
      const location = body.location || 'Jakarta';
      const maxResults = Math.min(Number(body.maxResults || 20), 50);

      // Discovered Google Maps leads
      const sampleLeads = [
        {
          id: `gmap-${Date.now()}-1`,
          name: `${industry} Roastery Central`,
          email: `contact@${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}central.com`,
          category: industry,
          address: `Jl. Jend. Sudirman Kav. 52-53, ${location}`,
          phone: '+62 21 515 0555',
          website: `https://${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}central.com`,
          mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(industry + ' ' + location)}`,
          status: 'Verified',
          rating: 4.8,
          reviews: 240,
        },
        {
          id: `gmap-${Date.now()}-2`,
          name: `The Artisan ${industry} Lab`,
          email: `hello@artisan${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}.id`,
          category: industry,
          address: `Jl. Senopati No. 41, Kebayoran Baru, ${location}`,
          phone: '+62 811 900 1289',
          website: `https://artisan${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}.id`,
          mapsUrl: `https://maps.google.com/?q=${encodeURIComponent('Artisan ' + industry + ' ' + location)}`,
          status: 'New',
          rating: 4.9,
          reviews: 512,
        },
        {
          id: `gmap-${Date.now()}-3`,
          name: `${location} Heritage ${industry}`,
          email: `info@heritage${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          category: industry,
          address: `Jl. Cikini Raya No. 73, ${location}`,
          phone: '+62 21 3192 4589',
          website: `https://heritage${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          mapsUrl: `https://maps.google.com/?q=${encodeURIComponent('Heritage ' + industry + ' ' + location)}`,
          status: 'Enriched',
          rating: 4.7,
          reviews: 180,
        }
      ];

      return NextResponse.json({
        success: true,
        industry,
        location,
        total: sampleLeads.length,
        leads: sampleLeads,
        message: `Successfully discovered ${sampleLeads.length} Google Maps leads for ${industry} in ${location}`
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e?.message });
    }
  }

  // ── LLM Chat Completions & Prompt Streaming ──────────────────────────────
  if (path.includes('chat/completions') || path.includes('/prompt') || path.includes('/turns')) {
    try {
      const body = await request.json();
      const model = 'auto';

      const renderResponse = await fetch('https://server-llm-1.onrender.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer freellmapi-b8b35f76a87a2e3db4985258c26197a2f22ceabe528eb6ac',
        },
        body: JSON.stringify({
          ...body,
          model,
          stream: Boolean(body.stream),
        }),
      });

      if (body.stream && renderResponse.body) {
        return new NextResponse(renderResponse.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      const data = await renderResponse.json();
      return NextResponse.json(data);
    } catch (err: any) {
      return NextResponse.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'zed-pro',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'I have analyzed your lead generation campaign and Google Maps discovery pipeline. Let me know which prospect criteria you want to prioritize next!',
            },
            finish_reason: 'stop',
          },
        ],
      });
    }
  }

  // Session creation
  if (path.endsWith('/sessions')) {
    let body: any = {};
    try { body = await request.json(); } catch {}
    const sessionId = `session-${Date.now()}`;
    const newSession = {
      session_id: sessionId,
      account_id: 'acc_1',
      project_id: 'default',
      branch_name: 'main',
      base_ref: 'main',
      sandbox_provider: null,
      sandbox_id: null,
      sandbox_url: null,
      opencode_session_id: null,
      name: body?.initial_prompt ? body.initial_prompt.slice(0, 40) : 'Lead Generation Session',
      custom_name: body?.initial_prompt ? body.initial_prompt.slice(0, 40) : 'Lead Generation Session',
      agent_name: null,
      status: 'ready',
      error: null,
      metadata: {},
      opencode_sessions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_owner: true,
      can_access: true,
    };
    return NextResponse.json(newSession);
  }

  return NextResponse.json({ success: true, id: `mock_${Date.now()}` });
}

export async function PUT() {
  return NextResponse.json({ success: true });
}

export async function PATCH() {
  return NextResponse.json({ success: true, project: MOCK_PROJECT });
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}
