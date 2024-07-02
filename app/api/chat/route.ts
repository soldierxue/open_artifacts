import { z } from 'zod'
import {
  type CoreMessage,
  type ImagePart,
  type TextPart,
  type UserContent,
  StreamingTextResponse,
  StreamData,
  streamText,
  tool,
  convertToCoreMessages,
} from 'ai'
// import { anthropic } from '@ai-sdk/anthropic'
import { bedrock } from '@ai-sdk/amazon-bedrock';
import {
  runPython,
  runJs
} from '@/lib/local-sandbox'
import {type FileData} from '@/components/chat';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
// import { ToolResult } from 'ai/generate-text/tool-result';


export interface ServerMessage {
  role: 'user' | 'assistant' | 'function';
  content: string;
}

interface ToolResult<NAME extends string, ARGS, RESULT> {
  /**
ID of the tool call. This ID is used to match the tool call with the tool result.
 */
  toolCallId: string;
  /**
Name of the tool that was called.
 */
  toolName: NAME;
  /**
Arguments of the tool call. This is a JSON-serializable object that matches the tool's input schema.
   */
  args: ARGS;
  /**
Result of the tool call. This is the result of the tool's execution.
   */
  result: RESULT;
}

type initMessages ={
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: Array<ToolResult<string, unknown, unknown>>;
};

const  saveFile = async (file:File,result:string) => {
  // 备份CSV文件到临时目录
  try {
    const tempDir = tmpdir();
    const tempFilePath = join(tempDir, `backup_${file.name}`);
    await writeFile(tempFilePath, result);
    console.log(`CSV file backed up to: ${tempFilePath}`);
  } catch (error) {
    console.error('Error backing up CSV file:', error);
  }
};

export async function POST(req: Request) {
  const { messages, userID, data }: { messages: CoreMessage[], userID: string, data:string } = await req.json()
  // console.log('userID', userID)
  // console.log(messages)
  // console.log(data)
  const initialMessages = messages.slice(0, -1) as initMessages [];
  // const coreMessages = convertToCoreMessages(initialMessages) 
  const currentMessage = messages[messages.length - 1];
  const fileData =  data?JSON.parse(data):null;
  let imageData : string []= [];
  let textData : string []= [];
  if (fileData&& fileData.length> 0) {
    fileData.map((it:FileData) => {
      if (it.type === 'image') {
        imageData.push(it.content);
      }else if (it.type === 'text' || it.type === 'csv') {
        textData.push(it.content);
      }else {
        console.log(`${it.type} not supported yet`)
      }
    })
  }
  const imageMessages = imageData.length>0? 
                    (imageData as []).map(it => ({ type: 'image', image: it})) as ImagePart[]:
                    (textData.length>0 ? textData.map(it => ({ type: 'text', text: `Attached:\n${it}`})) as TextPart[]:[])
  const userContent = [
    { type: 'text', text: currentMessage.content as string },
    ...imageMessages
  ]
  const newMessages =[
    ...initialMessages,
    {
      role: 'user',
      content: userContent as UserContent,
    },
  ];
  // console.log(newMessages)
  let streamData: StreamData = new StreamData()

  const result = await streamText({
     model: bedrock(process.env.MODEL_ID || 'anthropic.claude-3-5-sonnet-20240620-v1:0',
       {
      additionalModelRequestFields: { top_k: 250},
    }),
    tools: {
      runPython: tool({
        description: 'Runs Python code.',
        parameters: z.object({
          title: z.string().describe('Short title (5 words max) of the artifact.'),
          description: z.string().describe('Short description (10 words max) of the artifact.'),
          code: z.string().describe('The code to run in its own context'),
        }),
        async execute({ code }) {
          streamData.append({
            tool: 'runPython',
            state: 'running',
          })

          const execOutput = await runPython(userID, code)
          const stdout = execOutput.logs.stdout
          const stderr = execOutput.logs.stderr
          const runtimeError = execOutput.error
          const results = execOutput.results
          streamData.append({
            tool: 'runPython',
            state: 'complete',
          })
          return {
            stdout,
            stderr,
            runtimeError,
            cellResults: results,
          }
        },
      }),
      runJs: tool({
        description: 'Runs HTML or Javascript code.',
        parameters: z.object({
          title: z.string().describe('Short title (5 words max) of the artifact.'),
          description: z.string().describe('Short description (10 words max) of the artifact.'),
          code: z.string().describe('The code to run. can be a html and js code'),
        }),
        async execute({ code }) {
          // console.log(code)
          streamData.append({
            tool: 'runJs',
            state: 'running',
          })

          const execOutput = await runJs(userID, code)
          const stdout = execOutput.logs.stdout
          const stderr = execOutput.logs.stderr
          const runtimeError = execOutput.error
          const results = execOutput.results

          streamData.append({
            tool: 'runJs',
            state: 'complete',
          })
          // console.log(data)
          return {
            stdout,
            stderr,
            runtimeError,
            cellResults: results,
          }
        },
      }),
    },
    toolChoice: 'auto',
    system: `
    You are a skilled Python and Javascript developer.
    You are also expert of data science and data analysis, and you are also expert of solution architecture of AWS, Google Cloud, Azure, etc.
    You are very familiar with the following tools and libraries:
    For Python:
    <python_libraries>
    pandas, numpy, matplotlib, seaborn, scikit-learn, diagrams, etc.
    </python_libraries>

    For JavaScript:
    <js_libraries>
    d3, react, canvas, threejs, cannonjs, etc.
    </js_libraries>

    You have the ability to choose the appropriate tools and run Python or JavaScript code to solve the user's task. Code for each programming language runs in its own context and can reference previous definitions and variables.
    Your code will be run in a seperate sandbox, so you don't write the code that contains code to read the data or file locally.
    `,
    messages:newMessages as CoreMessage[],
  })

  const stream = result.toAIStream({
    async onFinal() {
      await streamData.close()
    }
  })

  return new StreamingTextResponse(stream, {}, streamData);
}
