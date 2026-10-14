export interface Issue { readonly code: string; readonly path: string; readonly message: string }
export interface Failure { readonly ok: false; readonly issues: readonly Issue[] }
export interface ActionHandle { readonly kind: 'inform-action'; readonly id: string }
export interface BindingHandle { readonly kind: 'inform-binding'; readonly id: string; readonly name: string }
export interface ElementNode {
  readonly type: 'element'; readonly typeName: string; readonly partial: boolean;
  readonly props: Readonly<Record<string, unknown>>;
  readonly bindings?: Readonly<Record<string, BindingHandle>>;
}
export interface Snapshot {
  readonly phase: 'ready'; readonly revision: number; readonly tree: ElementNode;
  readonly state: Readonly<Record<string, unknown>>;
}
export interface Preview {
  readonly phase: 'preview'; readonly tree: ElementNode | null;
  readonly interactive: false; readonly incomplete: boolean; readonly issues: readonly Issue[];
}
export type CommitResult = {readonly ok: true; readonly snapshot: Snapshot} | Failure;
declare const generationBrand: unique symbol;
export interface Generation { readonly [generationBrand]: true }
export interface Selection { readonly select: readonly string[]; readonly viewNames: readonly string[] }
export interface AgentSession {
  readonly prompt: string;
  readonly selection: Selection;
  beginGeneration(): Generation;
  append(token: Generation, delta: string): {readonly ok: true; readonly characters: number} | Failure;
  preview(token: Generation): {readonly ok: true; readonly preview: Preview} | Failure;
  finish(token: Generation): CommitResult;
  cancelGeneration(token: Generation): {readonly ok: true} | Failure;
  getSnapshot(): Snapshot | null;
  getDocument(): (Selection & {readonly source: string}) | null;
  setState(patch: unknown): CommitResult;
  setBinding(handle: BindingHandle, value: unknown): CommitResult;
  dispatchLocal(handle: ActionHandle): CommitResult;
  dispose(): void;
}
export function createAgentSession(options: {
  select: readonly string[]; viewNames?: readonly string[]; maxSourceChars?: number;
}): AgentSession;
