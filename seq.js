import go from "./go";

go(
  "./seq.json",
  [
    {
      origin: "seq",
      event: "press",
      conditions: ["typeof(say) == 'string'"],
      updates: { $utterance: "say", $tokens: "empty()" },
    },
    {
      origin: "seq",
      event: "press",
      conditions: [],
      updates: { $tokens: "append(msg)" },
    },
  ],
  { $tokens: [] }
);
