"use client";

import type { Attachment, UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "sonner";
import Link from "next/link";

import { ChatHeader } from "@/components/chat-header";
import { ChatHome } from "@/components/chat-home";
import { InlineSpacePanel } from "@/components/inline-space-panel";
import type { Vote } from "@/lib/db/schema";
import { fetcher, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { VisibilityType } from "./visibility-selector";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useActiveSpace } from "@/hooks/use-active-space";
import { useEffectiveSession } from "@/hooks/use-effective-session";
import { APP_NAME } from "@/lib/constants";
import { ToolRunLog } from "@/components/tool-run-log";

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
  hasAPIKeys,
  spaceId,
  onSpaceUpdated,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  hasAPIKeys?: boolean;
  spaceId?: string;
  onSpaceUpdated?: () => void;
}) {
  const spaceMode = Boolean(spaceId);
  const { mutate } = useSWRConfig();
  const { data: session } = useEffectiveSession();
  const isSignedIn = !!session?.user;
  const { spaceId: activeSpaceId, setActiveSpace } = useActiveSpace();

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    body: {
      id,
      selectedChatModel,
      ...(spaceId ? { spaceId } : {}),
    },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate("/api/history");
      onSpaceUpdated?.();
    },
    onError: (error) => {
      stop();
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();
      if (
        message.includes("401") ||
        lower.includes("unauthorized") ||
        lower.includes("authentication required") ||
        lower.includes("redirecttoauth")
      ) {
        toast.error("Sign in to send messages.");
        return;
      }
      if (lower.includes("api key")) {
        toast.error("AI provider is not configured. Check server environment keys.");
        return;
      }
      toast.error(message.length < 120 ? message : "Something went wrong. Try again.");
    },
  });

  // Run playbook prompt from /playbooks page
  useEffect(() => {
    const pending = sessionStorage.getItem("agentops_pending_prompt");
    if (!pending || messages.length > 0) return;
    sessionStorage.removeItem("agentops_pending_prompt");
    append({ role: "user", content: pending });
  }, [append, messages.length]);

  // Auto-open Space preview when agent creates/updates a space
  useEffect(() => {
    if (spaceMode) return;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "assistant") continue;
      for (const part of msg.parts ?? []) {
        if (part.type !== "tool-invocation" || part.toolInvocation.state !== "result") {
          continue;
        }
        const { toolName, result } = part.toolInvocation;
        if (
          (toolName === "createSpace" || toolName === "updateSpaceFiles") &&
          result &&
          typeof result === "object" &&
          "spaceId" in result &&
          typeof (result as { spaceId: string }).spaceId === "string"
        ) {
          const r = result as { spaceId: string; title?: string };
          setActiveSpace(r.spaceId, r.title);
          return;
        }
      }
    }
  }, [messages, setActiveSpace, spaceMode]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const showInlineSpace = !spaceMode && Boolean(activeSpaceId);

  if (hasAPIKeys === false) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-2xl space-y-4 rounded-xl border p-6 text-center">
          <h2 className="text-xl font-semibold">AI keys required</h2>
          <p className="text-muted-foreground">
            Add at least one of OPENAI_API_KEY, ANTHROPIC_API_KEY, or
            GOOGLE_GENERATIVE_AI_API_KEY to your environment.
          </p>
        </div>
      </div>
    );
  }

  const inputBlock = !isReadonly && (
    <form className="border-t bg-background px-4 py-4">
      <div className={showInlineSpace ? "w-full" : "mx-auto w-full max-w-3xl"}>
        <MultimodalInput
          chatId={id}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          status={status}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          messages={messages}
          setMessages={setMessages}
          append={append}
          selectedModelId={selectedChatModel}
        />
      </div>
    </form>
  );

  const signedOutHome = (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="mb-8 max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Run your stack with {APP_NAME}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Sign in to connect your tools, automate operations, and build Spaces.
        </p>
        <button
          type="button"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 underline"
          onClick={() => {
            window.location.assign('/sign-in');
          }}
        >
          Get started
        </button>
      </div>
      <div className="w-full max-w-3xl">{inputBlock}</div>
    </div>
  );

  const chatColumn = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {!spaceMode && isSignedIn && (
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />
      )}

      {!spaceMode && isSignedIn && messages.length > 0 && (
        <ToolRunLog
          messages={messages}
          isStreaming={status === 'streaming' || status === 'submitted'}
        />
      )}

      {messages.length === 0 && isSignedIn && !spaceMode ? (
        <ChatHome append={append} chatId={id} />
      ) : (
        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={spaceMode ? false : isArtifactVisible}
          append={append}
          isSignedIn={isSignedIn}
        />
      )}

      {inputBlock}
    </div>
  );

  if (!isSignedIn) {
    return (
      <>
        <div className="flex h-dvh min-w-0 flex-col bg-background">
          {messages.length === 0 ? signedOutHome : (
            <>
              <Messages
                chatId={id}
                status={status}
                votes={votes}
                messages={messages}
                setMessages={setMessages}
                reload={reload}
                isReadonly={isReadonly}
                isArtifactVisible={isArtifactVisible}
                append={append}
                isSignedIn={false}
              />
              {inputBlock}
            </>
          )}
        </div>
        <Artifact
          chatId={id}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          status={status}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          append={append}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          votes={votes}
          isReadonly={isReadonly}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`flex min-w-0 bg-background ${spaceMode ? "h-full min-h-0" : "h-dvh"}`}
      >
        {showInlineSpace ? (
          <PanelGroup direction="horizontal" className="h-full min-h-0 w-full">
            <Panel defaultSize={45} minSize={30}>
              {chatColumn}
            </Panel>
            <PanelResizeHandle className="w-px bg-border transition-colors hover:bg-indigo-400/50" />
            <Panel defaultSize={55} minSize={25}>
              <InlineSpacePanel />
            </Panel>
          </PanelGroup>
        ) : (
          chatColumn
        )}
      </div>

      {!spaceMode && !showInlineSpace && (
        <Artifact
          chatId={id}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          status={status}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          append={append}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          votes={votes}
          isReadonly={isReadonly}
        />
      )}
    </>
  );
}
