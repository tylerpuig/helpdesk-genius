import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { ChatOpenAI } from '@langchain/openai'
import { StateGraph } from '@langchain/langgraph'
import { MemorySaver, Annotation, messagesStateReducer } from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { type CalendarCreateEventParams } from '~/server/integrations/agents/langgraph/agents/scheduler'
import { getMessageContent } from './utils'
import * as schedulerPrompts from './agents/scheduler'

interface SupportParams {
  issue?: string
  severity?: string
  product?: string
}

// Combined params interface
export type AgentParams = {
  scheduling?: CalendarCreateEventParams
  support?: SupportParams
  schedulingStatus?: SchedulingStatus
  [key: string]: any
}

type SchedulingStatus = 'pending' | 'completed' | 'failed'

function paramsReducer(current: AgentParams, next: Partial<AgentParams>): AgentParams {
  return {
    ...current,
    ...next,
    // Merge nested objects properly
    scheduling: {
      ...(current.scheduling || {}),
      ...(next.scheduling || {})
    },
    support: {
      ...(current.support || {}),
      ...(next.support || {})
    }
  }
}

async function updateSchedulingParams(
  state: AgentThreadState,
  newParams: Partial<CalendarCreateEventParams>
) {
  return {
    agentParams: {
      ...state.agentParams,
      scheduling: {
        ...(state.agentParams.scheduling || {}),
        ...newParams
      }
    }
  }
}

// Example: Function to update support params
async function updateSupportParams(state: AgentThreadState, newParams: Partial<SupportParams>) {
  return {
    agentParams: {
      ...state.agentParams,
      support: {
        ...(state.agentParams.support || {}),
        ...newParams
      }
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
    default: () => ({})
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
  const lastMessage = messages[messages.length - 1]
  if (!lastMessage) {
    return { currentAgent: state.currentAgent, messages: state.messages }
  }

  const content = getMessageContent(lastMessage)

  const response = await model.invoke([
    new SystemMessage(`You are an agent router. Determine which agent should handle this request:
      - scheduler: For scheduling meetings or demo requests
      - technical: For technical support issues
      - billing: For billing and payment issues
      - sales: For product information and sales inquiries
      - security: For security and access issues
      - onboarding: For new user setup and guidance
      - account: For account management issues
      - greeter: For initial greetings and welcome messages
      
      Respond with just the agent name, nothing else.`),
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
      if (result.agentParams.scheduling?.startTime) {
        return result
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

    // Then check for title
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
        agentParams: state.agentParams
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

  // Define agent-specific system prompts
  const agentPrompts: Record<string, string> = {
    technical: `You are Technical Tom, a technical support specialist.
      Be helpful and thorough in addressing technical issues.
      Maintain a professional but friendly tone.`,

    billing: `You are Billing Betty, a billing support specialist.
      Help users with billing inquiries and payment issues.
      Be precise and clear with financial information.`,

    sales: `You are Sales Steve, a sales representative.
      Help users learn about our products and pricing.
      Be enthusiastic but not pushy.`,

    onboarding: `You are Onboarding Olivia, helping new users get started.
      Guide users through setup and initial platform usage.
      Be patient and encouraging.`,

    account: `You are Account Adam, managing account-related questions.
      Help with profile updates and user permissions.
      Be thorough and security-conscious.`,

    security: `You are Security Sarah, handling security concerns.
      Address security issues and account recovery.
      Be detail-oriented and cautious.`,

    greeter: `You are Gerald Greeter, the welcome specialist.
      Provide warm, friendly greetings to users.
      Make them feel welcome and point them in the right direction.`
  }

  // If it's a non-scheduler agent, add the specific system prompt
  if (currentAgent && currentAgent !== 'scheduler' && agentPrompts[currentAgent]) {
    const response = await model.invoke([
      new SystemMessage(agentPrompts[currentAgent]),
      ...messages
    ])
    return { messages: [...messages, response] }
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

  if (currentAgent === 'scheduler') {
    // If scheduling is already completed, end the flow
    if (state.schedulingStatus === 'completed') {
      return '__end__'
    }

    const params = state.agentParams.scheduling
    const hasAllParams = !!(
      params?.startTime &&
      params?.endTime &&
      params?.title &&
      params?.description
    )

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
// Example usage
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
        currentAgent: previousState?.currentAgent || '',
        agentParams: previousState?.agentParams || {},
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
    const lastMessage = finalState.messages[finalState.messages.length - 1]

    // Store the updated state for the next interaction
    // await saveState(threadId, finalState)

    // console.log('lastMessage', lastMessage)
    return finalState
  } catch (error) {
    console.error('handleAgentAutoReply error:', error)
    throw error
  }
}
