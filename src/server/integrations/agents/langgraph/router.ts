import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage
} from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { ChatOpenAI } from '@langchain/openai'
import { StateGraph } from '@langchain/langgraph'
import { MemorySaver, Annotation, messagesStateReducer } from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { type CalendarCreateEventParams } from '~/server/integrations/agents/langgraph/agents/scheduler'
import { getMessageContent } from './utils'
import * as schedulerPrompts from './agents/scheduler'
import { type DBAgent } from '~/server/db/types'
import { getCustomAgents } from '~/server/integrations/agents/langgraph/agents/custom'
import { type EnabledAgentData } from '~/server/db/utils/queries'
import {
  findSimilarMessagesFromAgentKnowledge,
  getPreviousThreadContext
} from '~/server/db/utils/queries'
import * as openaiUtils from '~/server/integrations/openai'

// Combined params interface
export type AgentParams = {
  scheduling?: CalendarCreateEventParams
  schedulingStatus?: SchedulingStatus
  workspaceId: string
  agentsLoaded: boolean
  agents: EnabledAgentData[]
  agentIds: string[]
  threadId: string
}

type SchedulingStatus = 'pending' | 'completed' | 'failed'

function paramsReducer(current: AgentParams, next: Partial<AgentParams>): AgentParams {
  return {
    ...current,
    ...next,
    scheduling: {
      ...(current.scheduling || {}),
      ...(next.scheduling || {})
    }
  }
}

// Define our state schema
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer
  }),
  // Track which agent we're currently using
  currentAgent: Annotation<string>({
    reducer: (current: string, next: string) => next,
    default: () => ''
  }),
  // Track collected parameters for scheduling
  agentParams: Annotation<AgentParams>({
    reducer: paramsReducer,
    default: () => ({
      workspaceId: '',
      agentsLoaded: false,
      agents: [],
      agentIds: [],
      threadId: ''
    })
  }),
  schedulingStatus: Annotation<SchedulingStatus>({
    reducer: (
      current: SchedulingStatus,
      next: SchedulingStatus,
      action?: { statusUpdate?: SchedulingStatus }
    ) => {
      // If the tool returned a status update, use that
      if (action?.statusUpdate) {
        return action.statusUpdate
      }
      return next || current
    },
    default: () => 'pending'
  })
})

export type AgentThreadState = typeof StateAnnotation.State
// Define scheduling tools
const scheduleMeetingTool = tool(
  async ({ startTime, endTime, title, description, duration }, runManager) => {
    // Get the current state from the runManager
    const state = runManager.configurable?.state as AgentThreadState

    // Check if we've already scheduled this meeting
    if (state.schedulingStatus === 'completed') {
      return `Meeting "${title}" was already scheduled. No action taken.`
    }

    try {
      // Your actual scheduling logic here
      // e.g., call your calendar API
      // const result = await createCalendarEvent({
      //   startTime,
      //   endTime,
      //   title,
      //   description,
      //   duration
      // })

      return {
        statusUpdate: 'completed',
        message: `Successfully scheduled meeting "${title}" for ${startTime} to ${endTime}.`
      }
    } catch (error) {
      return {
        statusUpdate: 'failed',
        message: `Failed to schedule meeting: ${error}`
      }
    }
  },
  {
    name: 'scheduleMeeting',
    description: 'Schedule a meeting with the specified parameters',
    schema: z.object({
      startTime: z.string().describe('The start time (ISO 8601) for the meeting'),
      endTime: z.string().describe('The end time (ISO 8601) for the meeting'),
      title: z.string().describe('The title of the meeting'),
      description: z.string().describe('The description or agenda of the meeting'),
      duration: z.number().optional().describe('The duration of the meeting in minutes')
    })
  }
)

// Create tools array
const tools = [scheduleMeetingTool]
const toolNode = new ToolNode(tools)

// Initialize the model
export const model = new ChatOpenAI({
  model: 'gpt-4o-mini'
}).bindTools(tools)

// Agent router - determines which agent should handle the message
async function routeAgent(state: typeof StateAnnotation.State) {
  const messages = state.messages
  const lastMessage = messages.at(-1)
  if (!lastMessage) {
    return { currentAgent: state.currentAgent, messages: state.messages }
  }

  // load the custom agents if not loaded
  if (!state.agentParams.agentsLoaded) {
    const customAgents = await getCustomAgents(state.agentParams.workspaceId)
    state.agentParams.agents = customAgents ?? []
    state.agentParams.agentsLoaded = true
    state.agentParams.agentIds = state.agentParams.agents.map((agent) => agent.id)
  }

  const content = getMessageContent(lastMessage)

  const response = await model.invoke([
    new SystemMessage(`You are an agent router. Determine which agent should handle this request:
        custom agents (use id for response):
        ${JSON.stringify(
          state.agentParams.agents.map((agent) => {
            return { id: agent.id, description: agent.description }
          }),
          null,
          2
        )}

        default agents (use the name for response):
      - scheduler: For scheduling meetings or demo requests
      - greeter: For initial greetings and welcome messages
      
      If the agent is a default agent, respond with just the agent name, nothing else.
      If the agent is a custom agent, respond with the agent id, nothing else.
      `),
    new HumanMessage(content)
  ])

  const agent = response.content
  return { currentAgent: agent, messages: state.messages }
}

// Example node for collecting parameters based on current agent
async function collectParams(state: AgentThreadState) {
  const currentAgent = state.currentAgent

  if (currentAgent === 'scheduler') {
    const params = state.agentParams?.scheduling || {}

    // First check for datetime params
    if (!params.startTime || !params.endTime) {
      const result = await schedulerPrompts.promptForDateTime(state)
      // Preserve the updated params
      state = {
        ...state,
        agentParams: result.agentParams
      }
    }

    const lastMessage = state.messages.at(-1)
    if (!lastMessage) {
      return {
        messages: state.messages,
        agentParams: state.agentParams
      }
    }
    const content = getMessageContent(lastMessage)

    // check for title
    if (!params.title) {
      const response = await model.invoke([
        new SystemMessage(`You are a helpful scheduling assistant.
          Generate a natural follow-up question asking for the meeting title.
          Example: "What would you like to title this meeting?"`),
        new HumanMessage(content)
      ])

      const question = new AIMessage({
        content: typeof response.content === 'string' ? response.content : ''
      })

      return {
        messages: [...state.messages, question],
        agentParams: state.agentParams // Preserve existing params
      }
    }

    // Finally check for description
    if (!params.description) {
      const response = await model.invoke([
        new SystemMessage(`You are a helpful scheduling assistant.
          Generate a natural follow-up question asking for the meeting description or agenda.
          Example: "Could you provide a brief description or agenda for this meeting?"`),
        new HumanMessage(content)
      ])

      const question = new AIMessage({
        content: typeof response.content === 'string' ? response.content : ''
      })

      return {
        messages: [...state.messages, question],
        agentParams: state.agentParams
      }
    }

    return state
  }

  return state
}

// Main agent node that processes messages
async function processMessage(state: typeof StateAnnotation.State) {
  const messages = state.messages
  const currentAgent = state.currentAgent

  const lastMessage = messages.at(-1)
  if (!lastMessage) {
    return { currentAgent: state.currentAgent, messages: state.messages }
  }
  lastMessage.too
  // const lastMessageContent = getMessageContent(lastMessage)

  if (lastMessage) {
    const toolResults = []
    for (const toolCall of lastMessage?.additional_kwargs?.tool_calls ?? []) {
      // Execute the tool
      const result = await scheduleMeetingTool.call(JSON.parse(toolCall.function.arguments))

      // Create tool response message
      const toolResponse = new ToolMessage({
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
        name: toolCall.function.name
      })

      toolResults.push(toolResponse)
    }

    // Add tool responses to messages
    return {
      messages: [...messages, ...toolResults],
      schedulingStatus: state.schedulingStatus
    }
  }

  // If it's a non-scheduler agent, add the specific system prompt
  if (currentAgent && state.agentParams.agentIds.includes(currentAgent)) {
    const lastMessage = messages.at(-1)
    if (!lastMessage) {
      return { currentAgent: state.currentAgent, messages: state.messages }
    }
    const messageContent = getMessageContent(lastMessage)
    const messageContentEmbedding = await openaiUtils.generateEmbeddingFromText(messageContent)
    if (!messageContentEmbedding) {
      return { currentAgent: state.currentAgent, messages: state.messages }
    }

    const similarKnowledge = await findSimilarMessagesFromAgentKnowledge(
      currentAgent,
      messageContentEmbedding
    )

    const previousThreadMessages = await getPreviousThreadContext(state.agentParams.threadId, 3)

    const responseContext = `
    You are an AI assistant that generates a reply to a user's message. Your task is to generate a reply that is relevant to the message using the same tone and language as the similar messages provided to you. Use the knowledge provided to guide your reply. You should only generate one reply, and you should provide the reply ONLY as your response. You should also provide a response context that provides additional context to the reply so that our knowledge base can expand from the message context. The response context should include relevant information from the original message and the similar knowledge so that we can refer to it later if a user asks a similar question. For the response context, basically explain your reasoning for the reply based on the similar and previous messages. Do not use placeholders.
          
          Knowledge to refer to:
          ${JSON.stringify(similarKnowledge, null, 2)}

          You can refer to the previous messages for a better understanding of the context. The "customer" role is who you are replying to. The "agent" role contains messages from our organization. The previous messages are:
          ${(previousThreadMessages ?? []).join('\n')}
    
    `
    const response = await model.invoke([
      new SystemMessage(responseContext),
      new HumanMessage(messageContent)
    ])
    return { messages: [...messages, response] }
  }

  if (currentAgent === 'scheduler' && state.schedulingStatus === 'pending') {
    // Special handling for scheduler tool responses
    const response = await model.invoke([
      ...messages,
      new SystemMessage('Process the scheduling result and provide a natural response to the user.')
    ])
    return {
      messages: [...messages, response],
      schedulingStatus: state.schedulingStatus
    }
  }

  // Default handling for scheduler or unknown agents
  const response = await model.invoke(messages)
  return { messages: [...messages, response] }
}

// Decision function for next steps
function decideNextStep(state: typeof StateAnnotation.State) {
  const messages = state.messages
  const lastMessage = messages[messages.length - 1] as AIMessage
  const currentAgent = state.currentAgent

  console.log('Deciding next step:', {
    currentAgent,
    schedulingStatus: state.schedulingStatus,
    params: state.agentParams.scheduling
  })

  if (messages[messages.length - 2]?.getType() === 'human') {
    return '__end__'
  }

  if (currentAgent === 'scheduler') {
    // If scheduling is already completed, end the flow
    if (state.schedulingStatus === 'completed') {
      return '__end__'
    }

    const params = state.agentParams.scheduling
    const hasAllParams =
      (params?.startTime && params?.endTime && params?.title && params?.description) ?? false

    // Log the state of parameters
    console.log('Params check:', {
      hasAllParams,
      params
    })

    if (!hasAllParams) {
      return 'collect_params'
    }

    // If we have all params, route to tools to schedule
    if (hasAllParams && state.schedulingStatus === 'pending') {
      return 'tools'
    }

    return 'agent'
  }

  return '__end__'
}

// Create the graph
const workflow = new StateGraph(StateAnnotation)
  // Add nodes
  .addNode('router', routeAgent)
  .addNode('agent', processMessage)
  .addNode('tools', toolNode)
  .addNode('collect_params', collectParams)

  // Add edges
  .addEdge('__start__', 'router')
  .addEdge('router', 'agent')
  .addConditionalEdges('agent', decideNextStep)
  .addEdge('tools', 'agent')
  .addEdge('collect_params', 'agent')

// Initialize memory
const checkpointer = new MemorySaver()

// Compile the graph
const app = workflow.compile({ checkpointer })
export type AgentThreadStateCache = Awaited<ReturnType<typeof app.invoke>>

export async function handleAgentAutoReplyLangChain(
  workspaceId: string,
  threadId: string,
  messageContent: string,
  previousState?: AgentThreadState
) {
  try {
    const finalState = await app.invoke(
      {
        messages: previousState
          ? [...previousState.messages, new HumanMessage(messageContent)]
          : [new HumanMessage(messageContent)],
        currentAgent: previousState?.currentAgent || 'greeter',
        agentParams: previousState?.agentParams ?? {
          workspaceId: workspaceId,
          agentsLoaded: false,
          agents: [],
          agentIds: [],
          threadId: threadId
        },
        schedulingStatus: previousState?.schedulingStatus || 'pending'
      },
      {
        configurable: {
          thread_id: threadId,
          state: previousState, // Pass the previous state to the tool
          workspaceId: workspaceId
        }
      }
    )

    // Check the final scheduling status
    if (finalState.schedulingStatus === 'completed') {
      console.log('Scheduling completed')
      // Maybe update your database or send notifications
      // await notifyMeetingScheduled(threadId, finalState.agentParams.scheduling)
    } else if (finalState.schedulingStatus === 'failed') {
      // Handle the failure case
      // await handleSchedulingFailure(threadId, finalState)
    }

    // Get the last message
    // const lastMessage = finalState.messages[finalState.messages.length - 1]

    // Store the updated state for the next interaction
    // await saveState(threadId, finalState)

    // console.log('lastMessage', lastMessage)
    return finalState
  } catch (error) {
    console.error('handleAgentAutoReply error:', error)
    // throw error
  }
}
