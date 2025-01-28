import { defaultFunctionMap } from '~/server/integrations/agents/functions/functionsSchemas'
import { db } from '~/server/db'
import * as schema from '~/server/db/schema'
import { and, eq, desc, sql, cosineDistance } from 'drizzle-orm'

export async function getMostRelevantFunctionSchema(
  agentId: string,
  userMessageEmbedding: number[]
) {
  try {
    const similarity = sql<number>`1 - (${cosineDistance(schema.agentFunctionEmbeddingsTable.embedding, userMessageEmbedding)})`

    const [result] = await db
      .select({
        id: schema.agentFunctionEmbeddingsTable,
        functionName: schema.agentFunctionsTable.functionName,
        functionCategory: schema.agentFunctionsTable.functionCategory,
        similarity: similarity
      })
      .from(schema.agentFunctionEmbeddingsTable)
      .innerJoin(
        schema.agentFunctionsTable,
        eq(schema.agentFunctionsTable.id, schema.agentFunctionEmbeddingsTable.functionId)
      )
      .where(and(eq(schema.agentFunctionsTable.agentId, agentId)))
      .orderBy(desc(similarity))
      .limit(1)

    if (!result) {
      throw new Error('No result found')
    }

    const functionToCall = defaultFunctionMap[result.functionCategory][result.functionName]
    console.log('getMostRelevantFunctionSchema', {
      functionToCall,
      functionName: result.functionName,
      functionCategory: result.functionCategory,
      similarity: result.similarity
    })

    return {
      functionToCall,
      functionName: result.functionName,
      functionCategory: result.functionCategory,
      similarity: result.similarity
    }
  } catch (error) {
    console.error('findMostRelevantFunction', error)
  }
}
