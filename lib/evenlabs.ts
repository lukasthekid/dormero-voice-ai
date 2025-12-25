import "dotenv/config";
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { GetAgentResponseModel } from "@elevenlabs/elevenlabs-js/api";


const elevenlabs = new ElevenLabsClient({
  apiKey: `${process.env.ELEVENLABS_API_KEY}`,
  environment: "https://api.elevenlabs.io"
});

async function getAgent(agentId: string): Promise<GetAgentResponseModel | null> {
  try {
    const client = new ElevenLabsClient({
      apiKey: `${process.env.ELEVENLABS_API_KEY}`,
      environment: "https://api.elevenlabs.io",
    });
    const response = await client.conversationalAi.agents.get(agentId);
    // The response has a data property containing the GetAgentResponseModel
    return response;
  } catch (error) {
    console.error(`Failed to fetch agent ${agentId}:`, error);
    return null;
  }
}

export { getAgent };


