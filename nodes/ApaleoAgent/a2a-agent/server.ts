import { AgentCard } from "@a2a-js/sdk";
import { ApaleoAgentExecutor, setAgentConfig } from "./index";
import { DefaultRequestHandler } from "@a2a-js/sdk/server";
import { InMemoryTaskStore } from "@a2a-js/sdk/server";
import { A2AExpressApp } from "@a2a-js/sdk/server/express";
import express from "express";

let serverInstance: any = null;

export const startServer = (port: number = 4000, agentCard: AgentCard, webhookUrl: string, inputFields: any = {}) => {
	// Set agent configuration so it's available to the executor and tools
	setAgentConfig(webhookUrl, inputFields);

	const agentExecutor = new ApaleoAgentExecutor();
	const requestHandler = new DefaultRequestHandler(
		agentCard,
		new InMemoryTaskStore(),
		agentExecutor
	);

	const expressAppInstance = express();

	// Log all incoming requests BEFORE setting up routes
	expressAppInstance.use((req, res, next) => {
		console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
		console.log('Headers:', req.headers);
		console.log('Body:', req.body);
		next();
	});

	const appBuilder = new A2AExpressApp(requestHandler);
	const expressApp = appBuilder.setupRoutes(expressAppInstance);

	if (!serverInstance) {
		serverInstance = expressApp.listen(port, () => {
			console.log(`Server started on http://localhost:${port}`);
			console.log(`Webhook URL configured: ${webhookUrl}`);
		});
		console.log('Server started');
	}
	return serverInstance;
};

export const stopServer = () => {
  if (serverInstance) {
    serverInstance.close();
    serverInstance = null;
  }
	console.log('Server stopped');
};
