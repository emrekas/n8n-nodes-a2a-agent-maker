import { googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";

export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model("gemini-2.0-flash"),
  promptDir: __dirname,
});

export { z } from "genkit";

// Export ai instance for tools to use
export default ai;
