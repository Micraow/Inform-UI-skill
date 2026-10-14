import {createProfile, createRuntime} from '../../assets/runtime/node.mjs';

const failure = (code, message) => ({ok:false, issues:[{code,path:'',message}]});

// Provider-neutral example adapter. The trusted host selects capabilities;
// generated text supplies only DSL, never module lists, callbacks or JS.
export function createAgentSession({select, viewNames = [], maxSourceChars = 64_000}) {
  if (!Array.isArray(select) || !select.length || !select.includes('base/layout')) {
    throw new TypeError('Select explicit modules including base/layout');
  }
  if (!Array.isArray(viewNames)) throw new TypeError('viewNames must be an array');
  if (!Number.isSafeInteger(maxSourceChars) || maxSourceChars < 1 || maxSourceChars > 200_000) {
    throw new TypeError('maxSourceChars must be an integer from 1 to 200000 UTF-16 code units');
  }
  const selection = Object.freeze({select:Object.freeze([...select]),viewNames:Object.freeze([...viewNames])});
  const profile = createProfile(selection);
  const runtime = createRuntime(profile);
  const prompt = profile.prompt({bindings:true,builtinFunctions:true});
  let pending = null;
  let source = null;
  let disposed = false;
  const live = () => disposed ? failure('SESSION_DISPOSED', 'The answer session is disposed') : null;
  const current = token => live() ?? (pending && pending.token === token
    ? null : failure('STALE_GENERATION', 'This generation was replaced, cancelled or finalized'));

  return Object.freeze({
    prompt,
    selection,
    beginGeneration() {
      if (disposed) throw new Error('The answer session is disposed');
      const token = Object.freeze({});
      pending = {token,buffer:''};
      return token;
    },
    append(token, delta) {
      const error = current(token);
      if (error) return error;
      if (typeof delta !== 'string') return failure('DELTA_TYPE', 'Each model delta must be a string');
      if (pending.buffer.length + delta.length > maxSourceChars) {
        pending = null;
        return failure('SOURCE_LIMIT', 'The generated answer exceeds the source budget');
      }
      pending.buffer += delta;
      return {ok:true,characters:pending.buffer.length};
    },
    preview(token) {
      const error = current(token);
      if (error) return error;
      return {ok:true,preview:runtime.preview(pending.buffer)};
    },
    finish(token) {
      const error = current(token);
      if (error) return error;
      const candidate = pending.buffer;
      pending = null;
      const result = runtime.commit(candidate);
      if (result.ok) source = candidate;
      return result;
    },
    cancelGeneration(token) {
      const error = current(token);
      if (error) return error;
      pending = null;
      return {ok:true};
    },
    getSnapshot: () => disposed ? null : runtime.getSnapshot(),
    getDocument: () => disposed || source === null ? null : Object.freeze({source,...selection}),
    setState: patch => live() ?? runtime.setState(patch),
    setBinding: (handle, value) => live() ?? runtime.setBinding(handle, value),
    dispatchLocal: handle => live() ?? runtime.dispatchLocal(handle),
    dispose() {
      if (disposed) return;
      disposed = true;
      pending = null;
      source = null;
      runtime.dispose();
    },
  });
}
