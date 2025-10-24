import {
	IExecuteFunctions,
	IHttpRequestOptions,
	IDataObject,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

// Base URL for the API
const BASE_URL = 'http://localhost:3456';

// Type definitions
export interface Agent {
	id: number;
	name: string;
	description: string;
	protocolVersion: string;
	version: string;
	url: string;
	capabilities: string[];
	skills: string[];
	defaultInputModes: string[];
	defaultOutputModes: string[];
}

export interface User {
	id: number;
	username: string;
	email: string;
	name: string;
	roles?: string[];
}

export interface UserAgentAssignment {
	userId: number;
	agentId: number;
}

export interface TokenResponse {
	access_token: string;
	expires_in: number;
	token_type: string;
}

export interface AssignmentResponse {
	message: string;
	user: User;
	agent: Agent;
	assignment: UserAgentAssignment;
}

export interface RemoveAssignmentResponse {
	message: string;
	userId: number;
	agentId: number;
}

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
): Promise<any> {
	const credentials = await this.getCredentials('apaleoAgentApi');

	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${endpoint}`,
		headers: {
			'Authorization': `Bearer ${credentials.sessionToken}`,
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (body) {
		options.body = body;
	}

	return await this.helpers.httpRequest(options);
}

/**
 * Authentication Endpoints
 */

/**
 * POST /api/connect/token
 * OAuth2 token endpoint - generates access token from client credentials
 */
export async function getAccessToken(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	clientId: string,
	clientSecret: string,
): Promise<TokenResponse> {
	const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: `${BASE_URL}/api/connect/token`,
		headers: {
			'Authorization': `Basic ${basicToken}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: {
			grant_type: 'client_credentials',
		},
		json: true,
	};

	return await this.helpers.httpRequest(options);
}

/**
 * GET /account/v1/accounts/current
 * Get the authenticated user's information
 */
export async function getCurrentUser(this: IExecuteFunctions | ILoadOptionsFunctions): Promise<User> {
	return await makeAuthenticatedRequest.call(this, 'GET', '/account/v1/accounts/current');
}

/**
 * Agent Endpoints
 */

/**
 * GET /api/agents
 * Get all agents
 */
export async function getAllAgents(this: IExecuteFunctions | ILoadOptionsFunctions): Promise<Agent[]> {
	return await makeAuthenticatedRequest.call(this, 'GET', '/api/agents');
}

/**
 * POST /api/agents
 * Create a new agent
 */
export async function createAgent(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	agentData: {
		name: string;
		url: string;
		description?: string;
		protocolVersion?: string;
		version?: string;
		capabilities?: string[];
		skills?: string[];
		defaultInputModes?: string[];
		defaultOutputModes?: string[];
	},
): Promise<Agent> {
	return await makeAuthenticatedRequest.call(this, 'POST', '/api/agents', agentData as IDataObject);
}

/**
 * GET /api/agents/my
 * Get all agents for the authenticated user
 */
export async function getMyAgents(this: IExecuteFunctions | ILoadOptionsFunctions): Promise<Agent[]> {
	return await makeAuthenticatedRequest.call(this, 'GET', '/api/agents/my');
}

/**
 * GET /api/agents/:agentId
 * Get a specific agent by ID
 */
export async function getAgent(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	agentId: number,
): Promise<Agent> {
	return await makeAuthenticatedRequest.call(this, 'GET', `/api/agents/${agentId}`);
}

/**
 * GET /api/users/:userId/agents
 * Get all agents for a specific user
 */
export async function getUserAgents(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	userId: number,
): Promise<Agent[]> {
	return await makeAuthenticatedRequest.call(this, 'GET', `/api/users/${userId}/agents`);
}

/**
 * User-Agent Relationship Endpoints
 */

/**
 * POST /api/users/:userId/agents/:agentId
 * Assign an agent to a user
 */
export async function assignAgentToUser(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	userId: number,
	agentId: number,
): Promise<AssignmentResponse> {
	return await makeAuthenticatedRequest.call(
		this,
		'POST',
		`/api/users/${userId}/agents/${agentId}`,
	);
}

/**
 * DELETE /api/users/:userId/agents/:agentId
 * Remove an agent from a user
 */
export async function removeAgentFromUser(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	userId: number,
	agentId: number,
): Promise<RemoveAssignmentResponse> {
	return await makeAuthenticatedRequest.call(
		this,
		'DELETE',
		`/api/users/${userId}/agents/${agentId}`,
	);
}

/**
 * Health Check
 */

/**
 * GET /health
 * Health check endpoint
 */
export async function healthCheck(this: IExecuteFunctions | ILoadOptionsFunctions): Promise<{ status: string }> {
	const options: IHttpRequestOptions = {
		method: 'GET',
		url: `${BASE_URL}/health`,
		json: true,
	};

	return await this.helpers.httpRequest(options);
}

