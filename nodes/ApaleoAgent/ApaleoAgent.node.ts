import type {
	IExecuteFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { getMyAgents } from './utils/api-call';
import { A2AClient} from "@a2a-js/sdk/client";
import { v4 as uuidv4 } from "uuid";

export class ApaleoAgent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Apaleo Agent',
		name: 'apaleoAgent',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:apaleo-agent.svg',
		group: ['input'],
		version: 1,
		description: '={{ $parameter.agentName.parseJson().description }}',
		defaults: {
			name: 'Apaleo Agent',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'apaleoAgentApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Agent Name or ID',
				name: 'agentName',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getAllAgents',
				},
				default: '',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'The message to send to the agent',
			},
			{
				displayName: 'Agent Card',
				name: 'agentCard',
				type: 'hidden',
				default: '={{ $parameter.agentName }}',
			},
		],
	};

	methods = {
		loadOptions: {
			// Get all the available agents to display them to user so that they can
			// select them easily
			async getAllAgents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const agents = await getMyAgents.call(this);
				for (const agent of agents) {
					const agentCard = {
						id: agent.id,
						name: agent.name,
						description: agent.description,
						protocolVersion: agent.protocolVersion,
						version: agent.version,
						url: agent.url,
						capabilities: agent.capabilities,
						skills: agent.skills,
						defaultInputModes: agent.defaultInputModes,
						defaultOutputModes: agent.defaultOutputModes,
					};

					returnData.push({
						name: `${agent.name} (ID: ${agent.id})`,
						value: JSON.stringify(agentCard),
						description: agent.description,
					});
				}

				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// const items = this.getInputData();
		const returnData: IDataObject[] = [];

		const agentCard = this.getNodeParameter('agentCard', 0) as string;
		const message = this.getNodeParameter('message', 0) as string;
  // Create a client pointing to the agent's Agent Card URL.
  const client = await A2AClient.fromCardUrl(JSON.parse(agentCard as string).url+'/.well-known/agent-card.json');

  const sendParams: any = {
    message: {
      messageId: uuidv4(),
      role: "user",
      parts: [{ kind: "text", text: message }],
      kind: "message",
    },
  };

  const response = await client.sendMessage(sendParams);
	console.log('response', response);

  if ("error" in response) {
    console.error("Error:", response.error.message);
	}
	else {
		const result = response.result as any;
		console.log("Agent response:", JSON.stringify(result));
		returnData.push({
			json: {
				response: JSON.stringify(result),
			}
		});
	}

	return [this.helpers.returnJsonArray(returnData)];
	}
}
