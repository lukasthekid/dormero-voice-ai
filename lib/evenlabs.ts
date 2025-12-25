import "dotenv/config";
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { GetAgentResponseModel } from "@elevenlabs/elevenlabs-js/api";
import { log } from './logger';

const elevenlabs = new ElevenLabsClient({
  apiKey: `${process.env.ELEVENLABS_API_KEY}`,
  environment: "https://api.elevenlabs.io"
});

async function getAgent(agentId: string): Promise<GetAgentResponseModel | null> {
  try {
    // Use the existing client instance instead of creating a new one
    const response = await elevenlabs.conversationalAi.agents.get(agentId);
    // The response has a data property containing the GetAgentResponseModel
    log.debug('Agent fetched successfully', { agentId, agentName: response.name });
    return response;
  } catch (error) {
    log.error(`Failed to fetch agent ${agentId}`, error, { agentId });
    return null;
  }
}

export { getAgent };


