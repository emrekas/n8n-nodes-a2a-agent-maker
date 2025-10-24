import { ai, z } from "./genkit";
import { validateInputFields, formatValidationErrors, type InputFieldConfig } from "../utils/validation";
import { agentInputFields } from "./index";

export const triggerWorkflow = async (webhookUrl: string, requestContext: any) => {
	console.log('[triggerWorkflow] Sending request to:', webhookUrl);
	console.log('[triggerWorkflow] Request context:', JSON.stringify(requestContext, null, 2));

	// Validate requestContext against agentInputFields before triggering workflow
	if (agentInputFields && Array.isArray(agentInputFields) && agentInputFields.length > 0) {
		console.log('[triggerWorkflow] Validating request context against input fields...');
		console.log('[triggerWorkflow] agentInputFields:', JSON.stringify(agentInputFields, null, 2));
		console.log('[triggerWorkflow] requestContext type:', typeof requestContext);
		console.log('[triggerWorkflow] requestContext keys:', requestContext ? Object.keys(requestContext) : 'null/undefined');

		// Check if requestContext is provided when fields are required
		if (!requestContext || typeof requestContext !== 'object') {
			const requiredFields = (agentInputFields as InputFieldConfig[])
				.filter(f => f.required)
				.map(f => f.fieldName)
				.join(', ');
			throw new Error(
				`Request context is ${requestContext === null ? 'null' : typeof requestContext}, but workflow requires input fields. ` +
				`Required fields: ${requiredFields}. ` +
				`Please provide a valid request context object with the required fields.`
			);
		}

		const validation = validateInputFields(requestContext, agentInputFields as InputFieldConfig[]);

		if (!validation.valid) {
			const errorMessage = formatValidationErrors(validation.errors || []);
			console.error('[triggerWorkflow] Validation failed:', errorMessage);
			console.error('[triggerWorkflow] Validation errors:', JSON.stringify(validation.errors, null, 2));
			throw new Error(`Input validation failed: ${errorMessage}`);
		}

		console.log('[triggerWorkflow] Validation passed');
	}

	const triggerResponse = await fetch(webhookUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			requestContext,
		}),
	});

	console.log('[triggerWorkflow] Response status:', triggerResponse.status);
	console.log('[triggerWorkflow] Response headers:', Object.fromEntries(triggerResponse.headers.entries()));

	if (!triggerResponse.ok) {
		const errorText = await triggerResponse.text();
		console.error('[triggerWorkflow] Error response:', errorText);
		throw new Error(`Workflow request failed with status ${triggerResponse.status}: ${errorText}`);
	}

	const contentType = triggerResponse.headers.get('content-type');
	console.log('[triggerWorkflow] Content-Type:', contentType);

	// Try to parse as JSON if content-type indicates JSON
	if (contentType && contentType.includes('application/json')) {
		const responseText = await triggerResponse.text();
		console.log('[triggerWorkflow] Raw response text:', responseText);

		if (!responseText || responseText.trim() === '') {
			console.log('[triggerWorkflow] Empty response body received');
			return {};
		}

		try {
			const workflowData = JSON.parse(responseText);
			console.log('[triggerWorkflow] Parsed JSON data:', JSON.stringify(workflowData, null, 2));
			return workflowData;
		} catch (error) {
			console.error('[triggerWorkflow] Failed to parse JSON:', error);
			return { rawText: responseText };
		}
	}

	// Otherwise return as text
	const workflowData = await triggerResponse.text();
	console.log('[triggerWorkflow] Text response:', workflowData);
	return workflowData;
}

export const callN8nWorkflow = ai.defineTool(
  {
    name: "callN8nWorkflow",
    description: "Call an n8n workflow by sending a request to the webhook URL with the request context. The requestContext parameter MUST be a valid object with the required field names and values extracted from the user's message.",
    inputSchema: z.object({
      webhookUrl: z.string().describe("The webhook URL to send the request to"),
      requestContext: z.record(z.string(), z.any()).describe("REQUIRED: A JSON object containing the input fields with exact field names as keys and extracted values. Example: { \"fieldName\": \"extracted value\" }. NEVER pass undefined or null."),
    }),
  },

	async ({ webhookUrl, requestContext }) => {
    try {
			console.log('[callN8nWorkflow] ========== START WORKFLOW CALL ==========');
			console.log('[callN8nWorkflow] Webhook URL:', webhookUrl);
			console.log('[callN8nWorkflow] Request context:', JSON.stringify(requestContext, null, 2));

      const data = await triggerWorkflow(webhookUrl, requestContext);

			console.log('[callN8nWorkflow] ========== WORKFLOW RESPONSE ==========');
			console.log('[callN8nWorkflow] Data type:', typeof data);
			console.log('[callN8nWorkflow] Data value:', data);
			console.log('[callN8nWorkflow] Data JSON:', JSON.stringify(data, null, 2));

			// If data is already an object, stringify it for the tool output
			// This ensures the LLM gets the full response
			const output = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

			console.log('[callN8nWorkflow] Final output:', output);
			console.log('[callN8nWorkflow] Output length:', output.length);
			console.log('[callN8nWorkflow] ========== END WORKFLOW CALL ==========');

			return { output };
    } catch (error) {
      console.error("[callN8nWorkflow] ========== ERROR IN WORKFLOW CALL ==========");
      console.error("[callN8nWorkflow] Error:", error);
      console.error("[callN8nWorkflow] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      // Re-throwing allows Genkit/the caller to handle it appropriately
      throw error;
    }
  }
);
