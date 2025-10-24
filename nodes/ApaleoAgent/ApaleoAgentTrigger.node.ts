import {
	type IHookFunctions,
	type IWebhookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookResponseData,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import { startServer, stopServer } from './a2a-agent/server';
import { AgentCard, AgentSkill } from '@a2a-js/sdk';
import { agentCardProperties, agentCardAdditionalProperties, triggerInputFieldsProperties } from './description';
import { parseInputFields } from './utils/validation';

export class ApaleoAgentTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Apaleo Agent Trigger',
		name: 'apaleoAgentTrigger',
		icon: 'file:apaleo-agent.svg',
		group: ['trigger'],
		version: 1,
		description: 'Apaleo Agent Trigger',
		defaults: {
			name: 'Apaleo Agent Trigger',
		},
		eventTriggerDescription: 'Waiting for ApaleoAgent webhook events (A2A protocol)',
		activationMessage: 'Your ApaleoAgent webhook is now active and will trigger on the selected events.',
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'lastNode',
				path: 'webhook',
			},
		],
		properties: [
			...triggerInputFieldsProperties,
			...agentCardProperties,
			...agentCardAdditionalProperties,
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// For A2A agent, we just check if the server is already running
				const webhookData = this.getWorkflowStaticData('node');
				return webhookData.serverRunning === true;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');

				if (!webhookUrl) {
					throw new NodeOperationError(this.getNode(), 'Unable to get webhook URL');
				}

				try {

	const agentName = this.getNodeParameter('agentName') as string;
	const agentDescription = this.getNodeParameter('agentDescription') as string;
	const protocolVersion = this.getNodeParameter('protocolVersion') as string;
	const agentVersion = this.getNodeParameter('agentVersion') as string;
	const serverPort = this.getNodeParameter('serverPort') as number;

	// Parse skills from JSON
	const skillsJson = this.getNodeParameter('skills') as string;
	let skills: AgentSkill[] = [];
	try {
		skills = JSON.parse(skillsJson);
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to parse skills JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	const defaultInputModes = this.getNodeParameter('defaultInputModes') as string[];
	const defaultOutputModes = this.getNodeParameter('defaultOutputModes') as string[];

		// Parse input fields configuration
		const defineInputFields = this.getNodeParameter('defineInputFields') as string;
		const inputFieldsJson = defineInputFields === 'json' ? (this.getNodeParameter('inputFieldsJson') as string) : undefined;
		const inputFieldsConfig = defineInputFields === 'fields' ? (this.getNodeParameter('inputFields') as any) : undefined;

		const parsedInputFields = parseInputFields(defineInputFields, inputFieldsJson, inputFieldsConfig);
		console.log('[ApaleoAgentTrigger] Parsed input fields:', parsedInputFields);

		// Store input fields in webhook data for validation during webhook execution
		webhookData.inputFields = parsedInputFields;

			const agentCard: AgentCard = {
				name: agentName,
				description: agentDescription,
				protocolVersion: protocolVersion,
				version: agentVersion,
				url: `http://localhost:${serverPort}`,
				capabilities: {
				},
				skills: skills,
				defaultInputModes: defaultInputModes,
				defaultOutputModes: defaultOutputModes,
			};

		startServer(serverPort, agentCard, webhookUrl, parsedInputFields);
		webhookData.serverRunning = true;

					return true;
				} catch (error) {
					console.error(error);
					return false;
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				stopServer();
				webhookData.serverRunning = false;

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		try {
			const bodyData = this.getBodyData();
			const headers = this.getHeaderData();
			const query = this.getQueryData();

	// Ensure we have data to work with
	if (!bodyData) {
		const errorData = {
			error: 'No webhook data received',
			timestamp: new Date().toISOString(),
		};

		return {
			workflowData: [this.helpers.returnJsonArray(errorData)],
		};
	}

			// Handle Apaleo health check events - these should be acknowledged but not processed as workflow data
			if (bodyData.topic === 'system' && bodyData.type === 'healthcheck') {
				// Return empty workflow data for health checks to acknowledge receipt
				return {
					workflowData: [this.helpers.returnJsonArray([])],
				};
			}

			// Add metadata to the webhook data
			const enrichedData = {
				...bodyData,
				_metadata: {
					timestamp: new Date().toISOString(),
					source: 'apaleo-webhook',
					headers: headers,
					query: query,
				},
			};

		// Handle streaming response mode
		return {
			workflowData: [this.helpers.returnJsonArray(enrichedData)],
		}
		} catch (error) {
			// Re-throw configuration errors
			if (error instanceof NodeOperationError) {
				throw error;
			}

			// Even if there's an error, return a response so the trigger doesn't stop
			const errorData = {
				error: 'Error processing webhook',
				errorMessage: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			};

			return {
				workflowData: [this.helpers.returnJsonArray(errorData)],
			};
		}
	}
}
