// server.ts
import { v4 as uuidv4 } from "uuid";
import type { Message, Task, TaskState, TaskStatusUpdateEvent, TextPart } from "@a2a-js/sdk";
import { AgentExecutor, RequestContext, ExecutionEventBus } from "@a2a-js/sdk/server";
import { ai } from "./genkit";
import { MessageData } from "genkit";


if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable is required")
  process.exit(1);
}

// Simple store for contexts
const contexts: Map<string, Message[]> = new Map();

// Store for webhook URL and trigger inputs - accessible to the agent
export let agentWebhookUrl: string = '';
export let agentInputFields: any = {};

// Function to set agent configuration
export function setAgentConfig(webhookUrl: string, inputFields: any = {}) {
	agentWebhookUrl = webhookUrl;
	agentInputFields = inputFields;
	console.log('[ApaleoAgentExecutor] Agent configuration updated:', { webhookUrl, inputFields });
	console.log('[ApaleoAgentExecutor] Agent input fields:', agentInputFields);
}

// Import the workflow tool
import { callN8nWorkflow } from "./tools";

// Load the Genkit prompt
const apaleoAgentPrompt = ai.prompt('apaleo_agent');

// 2. Implement the agent's logic.
export class ApaleoAgentExecutor implements AgentExecutor {
  private cancelledTasks = new Set<string>();

  public cancelTask = async (
        taskId: string,
        eventBus: ExecutionEventBus,
    ): Promise<void> => {
        this.cancelledTasks.add(taskId);
        // The execute loop is responsible for publishing the final state
    };

		async execute(
			requestContext: RequestContext,
			eventBus: ExecutionEventBus
		): Promise<void> {
			console.log('[ApaleoAgentExecutor] Request context:', requestContext);
			const userMessage = requestContext.userMessage;
			const existingTask = requestContext.task;

			// Determine IDs for the task and context
			const taskId = requestContext.taskId;
			const contextId = requestContext.contextId;

			console.log(
				`[ApaleoAgentExecutor] Processing message ${userMessage.messageId} for task ${taskId} (context: ${contextId})`
			);

			// 1. Publish initial Task event if it's a new task
			if (!existingTask) {
				const initialTask: Task = {
					kind: 'task',
					id: taskId,
					contextId: contextId,
					status: {
						state: 'submitted',
						timestamp: new Date().toISOString(),
					},
					history: [userMessage], // Start history with the current user message
					metadata: userMessage.metadata, // Carry over metadata from message if any
				};
				eventBus.publish(initialTask);
			}

			// 2. Publish "working" status update
			const workingStatusUpdate: TaskStatusUpdateEvent = {
				kind: 'status-update',
				taskId: taskId,
				contextId: contextId,
				status: {
					state: 'working',
					message: {
						kind: 'message',
						role: 'agent',
						messageId: uuidv4(),
						parts: [{ kind: 'text', text: 'Processing your question, hang tight!' }],
						taskId: taskId,
						contextId: contextId,
					},
					timestamp: new Date().toISOString(),
				},
				final: false,
			};
			eventBus.publish(workingStatusUpdate);

			// 3. Prepare messages for Genkit prompt
			const historyForGenkit = contexts.get(contextId) || [];
			if (!historyForGenkit.find(m => m.messageId === userMessage.messageId)) {
				historyForGenkit.push(userMessage);
			}
			contexts.set(contextId, historyForGenkit)

			console.log('[ApaleoAgentExecutor] User message parts:', JSON.stringify(userMessage.parts, null, 2));

			const messages: MessageData[] = historyForGenkit
				.map((m) => {
					// Filter text parts
					const textParts = m.parts.filter((p): p is TextPart => p.kind === 'text' && !!(p as TextPart).text);

					const partsToUse = m.role === 'user' ? textParts.slice(0, 1) : textParts;

					console.log(`[ApaleoAgentExecutor] Processing ${m.role} message with ${textParts.length} text parts, using ${partsToUse.length}`);
					partsToUse.forEach((p, idx) => {
						console.log(`[ApaleoAgentExecutor] Part ${idx}:`, (p as TextPart).text);
					});

					return {
						role: (m.role === 'agent' ? 'model' : 'user') as 'user' | 'model',
						content: partsToUse.map((p) => ({
							text: (p as TextPart).text,
						})),
					};
				})
				.filter((m) => m.content.length > 0);

			if (messages.length === 0) {
				console.warn(
					`[ApaleoAgentExecutor] No valid text messages found in history for task ${taskId}.`
				);
				const failureUpdate: TaskStatusUpdateEvent = {
					kind: 'status-update',
					taskId: taskId,
					contextId: contextId,
					status: {
						state: 'failed',
						message: {
							kind: 'message',
							role: 'agent',
							messageId: uuidv4(),
							parts: [{ kind: 'text', text: 'No message found to process.' }],
							taskId: taskId,
							contextId: contextId,
						},
						timestamp: new Date().toISOString(),
					},
					final: true,
				};
				eventBus.publish(failureUpdate);
				return;
			}

			const goal = existingTask?.metadata?.goal as string | undefined || userMessage.metadata?.goal as string | undefined;

			try {
				// 4. Run the Genkit prompt with the callN8nWorkflow tool and webhook URL
				console.log('[ApaleoAgentExecutor] ========== PROMPT CONTEXT ==========');
				console.log('[ApaleoAgentExecutor] Input fields:', JSON.stringify(agentInputFields, null, 2));
				console.log('[ApaleoAgentExecutor] Input fields type:', typeof agentInputFields);
				console.log('[ApaleoAgentExecutor] Input fields is array:', Array.isArray(agentInputFields));
				console.log('[ApaleoAgentExecutor] Input fields length:', agentInputFields?.length);
				console.log('[ApaleoAgentExecutor] Webhook URL:', agentWebhookUrl);
				console.log('[ApaleoAgentExecutor] Messages count:', messages.length);
				console.log('[ApaleoAgentExecutor] ========================================');
				const response = await apaleoAgentPrompt(
					{
						goal: goal,
						now: new Date().toISOString(),
						webhookUrl: agentWebhookUrl,
						inputFields: agentInputFields,
					},
					{
						messages,
						tools: [callN8nWorkflow]
					}
				);

				// Check if the request has been cancelled
				if (this.cancelledTasks.has(taskId)) {
					console.log(`[ApaleoAgentExecutor] Request cancelled for task: ${taskId}`);

					const cancelledUpdate: TaskStatusUpdateEvent = {
						kind: 'status-update',
						taskId: taskId,
						contextId: contextId,
						status: {
							state: 'canceled',
							timestamp: new Date().toISOString(),
						},
						final: true, // Cancellation is a final state
					};
					eventBus.publish(cancelledUpdate);
					return;
				}

				console.log('[ApaleoAgentExecutor] Response:', response);
				const responseText = response.text;
				console.info(`[ApaleoAgentExecutor] Prompt response: ${responseText}`);
				const lines = responseText.trim().split('\n');
				const finalStateLine = lines[lines.length - 1]?.trim().toUpperCase() || '';
				const agentReplyText = lines.slice(0, lines.length - 1).join('\n').trim();

				let finalA2AState: TaskState = "unknown";

				if (finalStateLine === 'COMPLETED') {
					finalA2AState = 'completed';
				} else if (finalStateLine === 'AWAITING_USER_INPUT') {
					finalA2AState = 'input-required';
				} else {
					console.warn(
						`[ApaleoAgentExecutor] Unexpected final state line from prompt: ${finalStateLine}. Defaulting to 'completed'.`
					);
					finalA2AState = 'completed'; // Default if LLM deviates
				}

				// 5. Publish final task status update
				const agentMessage: Message = {
					kind: 'message',
					role: 'agent',
					messageId: uuidv4(),
					parts: [{ kind: 'text', text: agentReplyText || "Completed." }], // Ensure some text
					taskId: taskId,
					contextId: contextId,
				};
				historyForGenkit.push(agentMessage);
				contexts.set(contextId, historyForGenkit)

				const finalUpdate: TaskStatusUpdateEvent = {
					kind: 'status-update',
					taskId: taskId,
					contextId: contextId,
					status: {
						state: finalA2AState,
						message: agentMessage,
						timestamp: new Date().toISOString(),
					},
					final: true,
				};
				eventBus.publish(finalUpdate);

				console.log(
					`[ApaleoAgentExecutor] Task ${taskId} finished with state: ${finalA2AState}`
				);

			} catch (error: any) {
				console.error(
					`[ApaleoAgentExecutor] Error processing task ${taskId}:`,
					error
				);
				const errorUpdate: TaskStatusUpdateEvent = {
					kind: 'status-update',
					taskId: taskId,
					contextId: contextId,
					status: {
						state: 'failed',
						message: {
							kind: 'message',
							role: 'agent',
							messageId: uuidv4(),
							parts: [{ kind: 'text', text: `Agent error: ${error.message}` }],
							taskId: taskId,
							contextId: contextId,
						},
						timestamp: new Date().toISOString(),
					},
					final: true,
				};
				eventBus.publish(errorUpdate);
			}
		}
	}


