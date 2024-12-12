import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.REACT_APP_AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
  }
});

export async function getFarmingAdvice(gameState, message) {
  try {
    const gameContext = `You are a friendly AI farm advisor. Here are the current farming conditions:
      - Weather: ${gameState.weather}
      - Temperature: ${gameState.temperature}°F
      - Moisture: ${gameState.moisture}%
      - Available Money: $${gameState.money}
      - Current Day: ${gameState.day}

      The player asks: "${message}"

      Provide brief, practical farming advice based on these conditions.`;

    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        messages: [
          {
            role: "user",
            content: gameContext
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    console.log('Making Bedrock request...', {
      modelId: command.input.modelId,
      region: bedrockClient.config.region,
      request: gameContext
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Bedrock response:', responseBody);

    // Return the message content from the response
    if (responseBody.messages && responseBody.messages[0]) {
      return responseBody.messages[0].content;
    }
    
    // Fallback response if we don't get what we expect
    return "I understand you're asking about farming. What specifically would you like to know about your crops or conditions?";

  } catch (error) {
    console.error('Bedrock error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      requestId: error.$metadata?.requestId
    });
    
    return "I'm having trouble connecting right now. Ask me about the current weather or crop conditions instead.";
  }
}
