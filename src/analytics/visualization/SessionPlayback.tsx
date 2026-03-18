interface SessionPlaybackProps {
  sessionId?: string;
}

export function SessionPlayback({ sessionId }: SessionPlaybackProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Session Playback</h3>
      <div className="h-64 bg-muted rounded flex items-center justify-center">
        {sessionId ? (
          <span>Playing session: {sessionId}</span>
        ) : (
          <span className="text-muted-foreground">Select a session</span>
        )}
      </div>
    </div>
  );
}
