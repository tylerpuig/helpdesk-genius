import { db } from '~/server/db'
import * as dbQueryUtils from '~/server/db/utils/queries'

export async function getCustomAgents(workspaceId: string) {
  try {
    const agents = await dbQueryUtils.getEnabledAgentsForWorkspace(workspaceId)
    if (!agents?.length) {
      return []
    }

    return agents
  } catch (error) {
    console.error('getCustomAgents', error)
  }
}
