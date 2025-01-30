import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage
} from '@langchain/core/messages'
import { MemorySaver, Annotation, messagesStateReducer } from '@langchain/langgraph'
import { StateGraph } from '@langchain/langgraph'
import { type EnabledAgentData } from '~/server/db/utils/queries'
import {
  findSimilarMessagesFromAgentKnowledge,
  getPreviousThreadContext
} from '~/server/db/utils/queries'
import { type CalendarCreateEventParams } from '~/server/integrations/agents/knowledge/requests'
import { getCustomAgents } from '~/server/integrations/agents/langgraph/agents/custom'
import * as openaiRequests from '~/server/integrations/agents/knowledge/requests'
import * as knowledgeHelpers from '~/server/integrations/agents/knowledge/helpers'

type SchedulingStatus = 'pending' | 'completed' | 'failed'

export type AgentParams = {
  scheduling: CalendarCreateEventParams
  schedulingStatus: SchedulingStatus
  workspaceId: string
  agentsLoaded: boolean
  agents: EnabledAgentData[]
  agentIds: string[]
  pendingAgentIds: string[]
  selectedAgentIdIndex: number
  threadId: string
}

function agentParamsReducer(current: AgentParams, next: Partial<AgentParams>): AgentParams {
  return {
    ...current,
    ...next
  }
}

export type AgentThreadState = typeof StateAnnotation.State
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => []
  }),
  // Track which agent we're currently using
  currentAgent: Annotation<string>({
    reducer: (current: string, next: string) => next,
    default: () => ''
  }),
  // Track collected parameters for scheduling
  agentParams: Annotation<AgentParams>({
    reducer: agentParamsReducer,
    default: () => ({
      workspaceId: '',
      agentsLoaded: false,
      agents: [],
      agentIds: [],
      schedulingStatus: 'pending',
      threadId: '',
      pendingAgentIds: [],
      selectedAgentIdIndex: 0,
      scheduling: {
        startTime: '',
        endTime: '',
        title: '',
        description: '',
        duration: 0
      }
    })
  }),
  schedulingStatus: Annotation<SchedulingStatus>({
    reducer: (
      current: SchedulingStatus,
      next: SchedulingStatus,
      action?: { statusUpdate?: SchedulingStatus }
    ) => {
      console.log('schedulingStatus reducer', current, next, action)
      // If the tool returned a status update, use that
      if (action?.statusUpdate) {
        return action.statusUpdate
      }
      return next || current
    },
    default: () => 'pending'
  })
})

async function routeAgent(state: typeof StateAnnotation.State): Promise<Partial<AgentThreadState>> {
  const messages = state.messages

  // load the custom agents if not loaded
  if (!state.agentParams.agentsLoaded || state.agentParams.agents.length === 0) {
    const customAgents = await getCustomAgents(state.agentParams.workspaceId)
    state.agentParams.agents = customAgents ?? []
    state.agentParams.agentsLoaded = true
    state.agentParams.agentIds = state.agentParams.agents.map((agent) => agent.id)
  }

  const messageContent = messages
    .map((message) => {
      return `
    message: ${message.content} 
    from: ${message.getType() === 'ai' ? 'agent' : 'customer'}
    `
    })
    .join('\n')
    .slice(1)

  const suggestAgentsForMessage = await openaiRequests.getSuggestedAgentsFromMessageContent(
    messageContent,
    state.agentParams.agents,
    state
  )
  console.log('suggestAgentsForMessage', suggestAgentsForMessage)

  return {
    agentParams: {
      ...state.agentParams,
      pendingAgentIds: suggestAgentsForMessage,
      selectedAgentIdIndex: 0
    },
    messages: state.messages
  }
}

function decideNextStep(state: typeof StateAnnotation.State) {
  const { selectedAgentIdIndex, pendingAgentIds } = state.agentParams

  // If we have more agents to process
  if (selectedAgentIdIndex < pendingAgentIds.length - 1) {
    return 'agent' // Continue to next agent
  }

  // Clear the pending agents when we're done
  state.agentParams.pendingAgentIds = []
  state.agentParams.selectedAgentIdIndex = 0

  return 'end' // No more agents to process
}

async function processMessage(
  state: typeof StateAnnotation.State
): Promise<Partial<AgentThreadState>> {
  const { selectedAgentIdIndex, pendingAgentIds } = state.agentParams
  console.log('selectedAgentIdIndex', selectedAgentIdIndex, 'pendingAgentIds', pendingAgentIds)
  const currentAgentId = pendingAgentIds[selectedAgentIdIndex]
  console.log('currentAgentId', currentAgentId)
  if (!currentAgentId) {
    return state
  }

  let aiReply: AIMessage | undefined = undefined
  if (currentAgentId === 'scheduler') {
    const { event, responseContent } = await openaiRequests.tryGetCalendarEventFromMessage(state)

    if (knowledgeHelpers.eventHasRequiredFields(event)) {
      console.log('event details confirmed', event)
    }

    console.log('event partial details', event)

    aiReply = new AIMessage({
      content: responseContent
    })
  } else if (currentAgentId === 'greeter') {
    // Generate a greeting message
    const messageReply = await openaiRequests.generateGreetingMessage(state)
    aiReply = new AIMessage({
      content: messageReply
    })
  } else {
    // Generate a response for the current agent
    const messageReply = await openaiRequests.respondToUserMessage(state, currentAgentId)
    aiReply = new AIMessage({
      content: messageReply
    })
  }

  return {
    messages: [...state.messages, aiReply ?? new AIMessage({ content: '' })],
    agentParams: {
      ...state.agentParams,
      selectedAgentIdIndex: selectedAgentIdIndex + 1
    }
  }
}

const workflow = new StateGraph(StateAnnotation)
  // Add nodes
  .addNode('router', routeAgent)
  .addNode('agent', processMessage)

  // Add edges
  .addEdge('__start__', 'router')
  .addEdge('router', 'agent')
  .addConditionalEdges('agent', decideNextStep)

const checkpointer = new MemorySaver()

// Compile the graph
const app = workflow.compile({ checkpointer })
export type AgentThreadStateCache = Awaited<ReturnType<typeof app.invoke>>

export async function handleAgentAutoReply(
  workspaceId: string,
  threadId: string,
  messageContent: string,
  previousState?: AgentThreadState
) {
  try {
    let messages: BaseMessage[] = []

    if (previousState?.messages?.length) {
      messages = [...previousState.messages, new HumanMessage(messageContent)]
    } else {
      messages = await knowledgeHelpers.formatInitialMessage(messageContent)
    }

    const result = await app.invoke(
      {
        messages: messages,
        agentParams: {
          scheduling: previousState?.agentParams?.scheduling ?? {
            startTime: '',
            endTime: '',
            title: '',
            description: '',
            duration: 0
          },
          workspaceId: previousState?.agentParams?.workspaceId ?? workspaceId,
          threadId: previousState?.agentParams?.threadId ?? threadId,
          agentsLoaded: previousState?.agentParams?.agentsLoaded ?? false,
          agents: previousState?.agentParams?.agents ?? [],
          agentIds: previousState?.agentParams?.agentIds ?? [],
          schedulingStatus: previousState?.agentParams?.schedulingStatus ?? 'pending',
          pendingAgentIds: previousState?.agentParams?.pendingAgentIds ?? [],
          selectedAgentIdIndex: previousState?.agentParams?.selectedAgentIdIndex ?? 0
        }
      },
      {
        configurable: {
          thread_id: previousState?.agentParams?.threadId ?? threadId,
          state: previousState // Pass the previous state to the tool
        }
      }
    )

    return result
  } catch (error) {
    console.error('generateAutoReplyMessage', error)
  }
}
