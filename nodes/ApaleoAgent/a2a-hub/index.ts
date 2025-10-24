import express from 'express';
import { json, urlencoded } from 'express';
const a2aHubApp = express();
const PORT = process.env.PORT || 3456;

// Middleware to parse JSON bodies
a2aHubApp.use(json());

// Middleware to parse URL-encoded bodies (for form data)
a2aHubApp.use(urlencoded({ extended: true }));

// In-memory storage for agents
// In production, you would use a database
const agents: any[] = [];
let nextAgentId = 1;

// In-memory storage for users
const users: any[] = [];
let nextUserId = 1;

// In-memory storage for user-agent relationships
// Each entry: { userId, agentId }
const userAgents: any[] = [];

// Seed data function
function seedData() {
  // Seed agents
  const seedAgents = [
    {
      id: nextAgentId++,
      name: "GPT Assistant",
      description: "A general-purpose AI assistant powered by OpenAI",
      protocolVersion: "1.0.0",
      version: "4.0.0",
      url: "https://api.openai.com/v1/agents/gpt-assistant",
      capabilities: ["chat", "code-generation", "analysis", "translation"],
      skills: ["coding", "writing", "math", "reasoning"],
      defaultInputModes: ["text", "image"],
      defaultOutputModes: ["text", "code"]
    },
    {
      id: nextAgentId++,
      name: "Code Reviewer",
      description: "Specialized agent for reviewing and analyzing code quality",
      protocolVersion: "1.0.0",
      version: "2.1.0",
      url: "https://api.example.com/agents/code-reviewer",
      capabilities: ["code-review", "static-analysis", "security-audit"],
      skills: ["code-quality", "security", "best-practices"],
      defaultInputModes: ["text", "code"],
      defaultOutputModes: ["text", "markdown"]
    },
    {
      id: nextAgentId++,
      name: "Data Analyst",
      description: "Agent specialized in data analysis and visualization",
      protocolVersion: "1.0.0",
      version: "1.5.0",
      url: "https://api.example.com/agents/data-analyst",
      capabilities: ["data-analysis", "visualization", "statistical-modeling"],
      skills: ["statistics", "data-science", "reporting"],
      defaultInputModes: ["text", "csv", "json"],
      defaultOutputModes: ["text", "chart", "table"]
    },
    {
      id: nextAgentId++,
      name: "Language Tutor",
      description: "Interactive language learning and tutoring agent",
      protocolVersion: "1.0.0",
      version: "3.2.0",
      url: "https://api.example.com/agents/language-tutor",
      capabilities: ["language-teaching", "translation", "pronunciation"],
      skills: ["education", "linguistics", "conversation"],
      defaultInputModes: ["text", "audio"],
      defaultOutputModes: ["text", "audio"]
    },
    {
      id: nextAgentId++,
      name: "Personal Assistant",
      description: "Custom personal assistant for daily tasks",
      protocolVersion: "1.0.0",
      version: "1.0.0",
      url: "https://localhost:8080/my-assistant",
      capabilities: ["task-management", "scheduling", "reminders"],
      skills: ["organization", "planning", "productivity"],
      defaultInputModes: ["text", "voice"],
      defaultOutputModes: ["text", "notification"]
    },
    {
      id: nextAgentId++,
      name: "Research Helper",
      description: "Custom agent for academic research and paper analysis",
      protocolVersion: "1.0.0",
      version: "0.9.0",
      url: "https://localhost:8080/research-helper",
      capabilities: ["research", "summarization", "citation"],
      skills: ["academic-writing", "literature-review", "analysis"],
      defaultInputModes: ["text", "pdf"],
      defaultOutputModes: ["text", "markdown", "bibliography"]
    },
    {
      id: nextAgentId++,
      name: "Poem Agent",
      description: "Compose original poems or assist with writing, analyzing, or improving poetry in various styles and themes.",
      protocolVersion: "0.3.0",
      version: "0.1.0",
      url: "http://localhost:4000",
      capabilities: {},
      skills: [
        {
          id: "poem_writer",
          name: "Poem Writer",
          description: "Compose original poems or assist with writing, analyzing, or improving poetry in various styles and themes.",
          tags: [
            "poetry",
            "creative-writing",
            "literature",
            "art"
          ],
          examples: [
            "Write a short poem about the sea at night.",
            "Create a romantic poem in the style of Shakespeare.",
            "Turn this paragraph into a haiku about nature.",
            "Help me improve the rhythm of my poem.",
            "Write a motivational poem for a friend's birthday.",
            "Explain the symbolism in this poem I wrote."
          ],
          inputModes: [
            "text"
          ],
          outputModes: [
            "text",
            "task-status"
          ]
        }
      ],
      defaultInputModes: [
        "text/plain"
      ],
      defaultOutputModes: [
        "text/plain",
        "a2aHubApplication/json"
      ]
    }
  ];

  agents.push(...seedAgents);

  // Seed some users
  const seedUsers = [
    {
      id: nextUserId++,
      username: "john_doe",
      email: "john@example.com",
      name: "John Doe"
    },
    {
      id: nextUserId++,
      username: "jane_smith",
      email: "jane@example.com",
      name: "Jane Smith"
    },
    {
      id: nextUserId++,
      username: "bob_wilson",
      email: "bob@example.com",
      name: "Bob Wilson"
    }
  ];

  users.push(...seedUsers);

  // Seed user-agent relationships
  // John has GPT Assistant and Code Reviewer
  userAgents.push(
    { userId: 1, agentId: 1 }, // John -> GPT Assistant
    { userId: 1, agentId: 2 },  // John -> Code Reviewer
    { userId: 1, agentId: 3 },  // John -> Data Analyzer
    { userId: 1, agentId: 4 },  // John -> Language Tutor
    { userId: 1, agentId: 5 },  // John -> Personal Assistant
    { userId: 1, agentId: 6 },  // John -> Research Helper
    { userId: 1, agentId: 7 }  // John -> Poem Agent
  );

  // Jane has Data Analyst, Language Tutor, and Personal Assistant
  userAgents.push(
    { userId: 2, agentId: 3 }, // Jane -> Data Analyst
    { userId: 2, agentId: 4 }, // Jane -> Language Tutor
    { userId: 2, agentId: 5 }  // Jane -> Personal Assistant
  );

  // Bob has GPT Assistant and Research Helper
  userAgents.push(
    { userId: 3, agentId: 1 }, // Bob -> GPT Assistant
    { userId: 3, agentId: 6 }  // Bob -> Research Helper
  );

  console.log(`✅ Seeded ${seedAgents.length} agents`);
  console.log(`✅ Seeded ${seedUsers.length} users with ${userAgents.length} agent assignments`);
}

// Initialize seed data
seedData();

/**
 * GET /api/agents
 * Get all agents
 */
a2aHubApp.get('/api/agents', (req: any, res: any) => {
  try {
    res.json(agents as any);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve agents' });
  }
});

/**
 * POST /api/agents
 * Create a new agent
 */
a2aHubApp.post('/api/agents', (req: any, res: any) => {
  try {
    const {
      name,
      description,
      protocolVersion,
      version,
      url,
      capabilities,
      skills,
      defaultInputModes,
      defaultOutputModes
    } = req.body;

    // Validate required fields
    if (!name || !url) {
      return res.status(400).json({
        error: 'Missing required fields: name and url are required'
      });
    }

    // Create new agent with auto-generated ID
    const newAgent = {
      id: nextAgentId++,
      name,
      description: description || '',
      protocolVersion: protocolVersion || '1.0.0',
      version: version || '1.0.0',
      url,
      capabilities: capabilities || [],
      skills: skills || [],
      defaultInputModes: defaultInputModes || [],
      defaultOutputModes: defaultOutputModes || []
    };

    agents.push(newAgent);
    res.status(201).json(newAgent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

/**
 * GET /api/agents/my
 * Get all agents for the authenticated user
 * Headers: { 'Authorization': 'Bearer <access_token>' }
 * NOTE: Must be defined BEFORE /api/agents/:agentId to avoid "my" being treated as an ID
 */
a2aHubApp.get('/api/agents/my', (req: any, res: any) => {
  try {
    const authenticatedUser = getAuthenticatedUser(req);

    if (!authenticatedUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }

    // Find all agent IDs for this user
    const userAgentIds = userAgents
      .filter(ua => ua.userId === authenticatedUser.id)
      .map(ua => ua.agentId);

    // Get the full agent objects
    const userAgentsList = agents.filter(agent => userAgentIds.includes(agent.id));

    res.json(userAgentsList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user agents' });
  }
});

/**
 * GET /api/agents/:agentId
 * Get a specific agent by ID
 * NOTE: Must be defined AFTER /api/agents/my to avoid matching "my" as an ID
 */
a2aHubApp.get('/api/agents/:agentId', (req: any, res: any) => {
  try {
    const agentId = parseInt(req.params.agentId);

    const agent = agents.find(a => a.id === agentId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve agent' });
  }
});

/**
 * POST /api/connect/token
 * OAuth2 token endpoint - generates access token from client credentials
 * Body: { grant_type: 'client_credentials' }
 * Headers: { 'Authorization': 'Basic <base64(clientId:clientSecret)>', 'Content-Type': 'a2aHubApplication/x-www-form-urlencoded' }
 */
a2aHubApp.post('/api/connect/token', (req: any, res: any) => {
  try {
    const { grant_type } = req.body;
    const authHeader = req.headers.authorization;

    // Validate grant_type
    if (grant_type !== 'client_credentials') {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Only client_credentials grant type is supported'
      });
    }

    // Validate Authorization header
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Missing or invalid Authorization header'
      });
    }

    // Extract and decode Basic token
    const basicToken = authHeader.substring(6); // Remove 'Basic ' prefix
    let clientId, clientSecret;

    try {
      const decoded = Buffer.from(basicToken, 'base64').toString('utf-8');
      [clientId, clientSecret] = decoded.split(':');
    } catch (error) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid Basic authentication token'
      });
    }

    // Validate credentials (in production, check against database)
    if (!clientId || !clientSecret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    // Generate access token (in production, generate a real JWT)
    const access_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiY2xpZW50SWQiOiInICsgY2xpZW50SWQgKyAnIn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
    const expires_in = 36000; // 10 hours in seconds

    res.json({
      access_token,
      expires_in,
      token_type: 'Bearer'
    });
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      error_description: 'Token generation failed'
    });
  }
});

// Helper function to extract and validate authenticated user from token
function getAuthenticatedUser(req: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  if (!token) {
    return null;
  }

  // In production, you would verify and decode the JWT token
  // For now, return a mock authenticated user (user with id: 1)
  return {
    id: 1,
    username: 'john_doe',
    email: 'john@example.com',
    name: 'John Doe',
    roles: ['user', 'admin']
  };
}

/**
 * GET /account/v1/accounts/current
 * Get the authenticated user's information
 * Headers: { 'Authorization': 'Bearer <access_token>' }
 */
a2aHubApp.get('/account/v1/accounts/current', (req: any, res: any) => {
  try {
    const authenticatedUser = getAuthenticatedUser(req);

    if (!authenticatedUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }

    res.json(authenticatedUser);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user information'
    });
  }
});

/**
 * GET /api/users/:userId/agents
 * Get all agents for a specific user
 */
a2aHubApp.get('/api/users/:userId/agents', (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.userId);

    // Check if user exists
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all agent IDs for this user
    const userAgentIds = userAgents
      .filter(ua => ua.userId === userId)
      .map(ua => ua.agentId);

    // Get the full agent objects
    const userAgentsList = agents.filter(agent => userAgentIds.includes(agent.id));

    res.json(userAgentsList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user agents' });
  }
});

/**
 * POST /api/users/:userId/agents/:agentId
 * Assign an agent to a user
 */
a2aHubApp.post('/api/users/:userId/agents/:agentId', (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.userId);
    const agentId = parseInt(req.params.agentId);

    // Check if user exists
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if agent exists
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Check if assignment already exists
    const existingAssignment = userAgents.find(
      ua => ua.userId === userId && ua.agentId === agentId
    );
    if (existingAssignment) {
      return res.status(409).json({
        error: 'Agent is already assigned to this user'
      });
    }

    // Create the assignment
    const assignment = { userId, agentId };
    userAgents.push(assignment);

    res.status(201).json({
      message: 'Agent successfully assigned to user',
      user,
      agent,
      assignment
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign agent to user' });
  }
});

/**
 * DELETE /api/users/:userId/agents/:agentId
 * Remove an agent from a user
 */
a2aHubApp.delete('/api/users/:userId/agents/:agentId', (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.userId);
    const agentId = parseInt(req.params.agentId);

    // Find the assignment
    const assignmentIndex = userAgents.findIndex(
      ua => ua.userId === userId && ua.agentId === agentId
    );

    if (assignmentIndex === -1) {
      return res.status(404).json({
        error: 'Agent assignment not found for this user'
      });
    }

    // Remove the assignment
    userAgents.splice(assignmentIndex, 1);

    res.json({
      message: 'Agent successfully removed from user',
      userId,
      agentId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove agent from user' });
  }
});


// Health check endpoint
a2aHubApp.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok' });
});

a2aHubApp.listen(PORT as number, () => {
    console.log(`🚀 A2A Hub server is running on http://localhost:${PORT}`);
    console.log(`\n🔐 Authentication Endpoints:`);
    console.log(`   POST   /api/connect/token                      - Get access token (OAuth2)`);
    console.log(`   GET    /account/v1/accounts/current            - Get authenticated user`);
    console.log(`\n📋 Agent Endpoints:`);
    console.log(`   GET    /api/agents                             - Get all agents`);
});

let serverInstance: any = null;

export const startServer = () => {
  if (!serverInstance) {
    serverInstance = a2aHubApp.listen(PORT as number, () => {
      console.log(`🚀 A2A Hub server is running on http://localhost:${PORT}`);
      console.log(`\n🔐 Authentication Endpoints:`);
      console.log(`   POST   /api/connect/token                      - Get access token (OAuth2)`);
      console.log(`   GET    /account/v1/accounts/current            - Get authenticated user`);
      console.log(`\n📋 Agent Endpoints:`);
      console.log(`   GET    /api/agents                             - Get all agents`);
    });
  }
};
