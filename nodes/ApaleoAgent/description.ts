import type { INodeProperties } from 'n8n-workflow';

// Properties for defining trigger input fields
export const triggerInputFieldsProperties: INodeProperties[] = [
	{
		displayName: 'Define Input Fields',
		name: 'defineInputFields',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Using Fields Below',
				value: 'fields',
			},
			{
				name: 'Using JSON',
				value: 'json',
			},
		],
		default: 'fields',
		description: 'Choose how to define the input fields for the agent',
	},
	{
		displayName: 'Input Fields (JSON)',
		name: 'inputFieldsJson',
		type: 'json',
		typeOptions: {
			rows: 5,
		},
		default: '[\n  {\n    "fieldName": "query",\n    "fieldType": "text",\n    "required": true\n },\n  {\n    "fieldName": "context",\n    "fieldType": "text",\n    "required": false\n }\n]',
		description: 'Define input fields as JSON array',
		displayOptions: {
			show: {
				defineInputFields: ['json'],
			},
		},
	},
	{
		displayName: 'Input Fields',
		name: 'inputFields',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'Add Field',
		default: {},
		options: [
			{
				name: 'values',
				displayName: 'Field',
				values: [
					{
						displayName: 'Field Name',
						name: 'fieldName',
						type: 'string',
						default: '',
						placeholder: 'e.g. query',
						description: 'The name of the input field',
						required: true,
					},
					{
						displayName: 'Field Type',
						name: 'fieldType',
						type: 'options',
						default: 'text',
						options: [
							{
								name: 'Text',
								value: 'text',
							},
							{
								name: 'Number',
								value: 'number',
							},
							{
								name: 'Boolean',
								value: 'boolean',
							},
							{
								name: 'Date',
								value: 'date',
							},
							{
								name: 'JSON',
								value: 'json',
							},
							{
								name: 'Array',
								value: 'array',
							},
						],
						description: 'The type of the input field',
					},
					{
						displayName: 'Required',
						name: 'required',
						type: 'boolean',
						default: false,
						description: 'Whether this field is required',
					},
				],
			},
		],
		displayOptions: {
			show: {
				defineInputFields: ['fields'],
			},
		},
	},
];

export const agentCardProperties: INodeProperties[] = [
	{
		displayName: 'Agent Name',
		name: 'agentName',
		type: 'string',
		default: 'Poem Agent',
		description: 'The name of the A2A agent',
	},
	{
		displayName: 'Agent Description',
		name: 'agentDescription',
		type: 'string',
		default: 'Create, edit, or analyze poems in different styles and themes.',
		description: 'Description of what the agent does',
	},
	{
		displayName: 'Protocol Version',
		name: 'protocolVersion',
		type: 'string',
		default: '0.3.0',
		description: 'A2A protocol version',
	},
	{
		displayName: 'Agent Version',
		name: 'agentVersion',
		type: 'string',
		default: '0.1.0',
		description: 'Version of the agent',
	},
	{
		displayName: 'Server Port',
		name: 'serverPort',
		type: 'number',
		default: 4000,
		description: 'The port on which the A2A agent server will run',
	},
	{
		displayName: 'Skills',
		name: 'skills',
		type: 'json',
		typeOptions: {
			rows: 10,
		},
		default: '[{"id":"writing_poems","name":"Writing Poems","description":"Create, edit, or analyze poems in different styles and themes.","tags":["poetry","writing","literature"],"examples":["Write a poem about the ocean at sunset.","Create a haiku about loneliness.","Can you write a romantic poem in free verse?","Turn this paragraph into a poem about hope.","Explain the meaning of this poem.","Make this poem rhyme while keeping the same meaning."],"inputModes":["text"],"outputModes":["text","task-status"]}]',
		description: 'List of skills for the agent (JSON array)',
	},
];

export const agentCardAdditionalProperties: INodeProperties[] = [
	{
		displayName: 'Default Input Modes',
		name: 'defaultInputModes',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		default: ['text/plain'],
		description: 'Default input modes supported by the agent',
	},
	{
		displayName: 'Default Output Modes',
		name: 'defaultOutputModes',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		default: ['text/plain', 'application/json'],
		description: 'Default output modes supported by the agent',
	},
];
