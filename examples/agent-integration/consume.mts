import type {AgentSession, CommitResult} from './session.mjs';

// Feed text chunks from any provider. The caller owns model/network transport.
export async function consumeModelText(
  session: AgentSession,
  chunks: AsyncIterable<string>,
  signal?: AbortSignal,
): Promise<CommitResult> {
  const generation = session.beginGeneration();
  try {
    if (signal?.aborted) throw new Error('Generation cancelled');
    for await (const chunk of chunks) {
      if (signal?.aborted) throw new Error('Generation cancelled');
      const appended = session.append(generation, chunk);
      if (!appended.ok) return appended;
    }
    if (signal?.aborted) throw new Error('Generation cancelled');
    return session.finish(generation);
  } finally {
    // A completed or replaced generation safely rejects this cleanup token.
    // It cannot cancel a newer concurrent generation in the same session.
    session.cancelGeneration(generation);
  }
}
