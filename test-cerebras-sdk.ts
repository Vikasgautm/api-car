import dotenv from 'dotenv';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

dotenv.config();

const client = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

async function testModel(modelName: string) {
  console.log(`\n--- Testing model: ${modelName} ---`);
  try {
    const response = await client.chat.completions.create({
      model: modelName,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Hello, what model are you?',
        },
      ],
    });

    const resAny = response as any;
    console.log(`Success! Response for ${modelName}:`, resAny.choices[0]?.message?.content);
    return true;
  } catch (error: any) {
    console.log(`Failed for ${modelName}:`, error?.message || error);
    return false;
  }
}

async function testTools(modelName: string) {
  console.log(`\n--- Testing tools with model: ${modelName} ---`);
  try {
    const response = await client.chat.completions.create({
      model: modelName,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: 'Is the Maruti Alto budget friendly? Call the set_flag_verdicts tool to save your verdict.',
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'set_flag_verdicts',
            description: 'Record your verdict',
            parameters: {
              type: 'object',
              properties: {
                budget_friendly: {
                  type: 'object',
                  properties: {
                    verdict: { type: 'boolean' },
                    rationale: { type: 'string' },
                  },
                  required: ['verdict', 'rationale'],
                },
              },
              required: ['budget_friendly'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'set_flag_verdicts' } },
    });

    const resAny = response as any;
    const toolCall = resAny.choices[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      console.log('Tool call found!');
      console.log('Arguments type:', typeof toolCall.function.arguments);
      console.log('Arguments value:', toolCall.function.arguments);
    } else {
      console.log('No tool call found in the response.');
    }
  } catch (error: any) {
    console.log(`Tools failed for ${modelName}:`, error?.message || error);
  }
}

async function run() {
  const models = ['gpt-oss-120b', 'llama-3.3-70b', 'llama3.1-8b', 'llama-3.1-8b', 'llama-3.1-70b'];
  for (const model of models) {
    const success = await testModel(model);
    if (success) {
      await testTools(model);
    }
  }
}

run();
