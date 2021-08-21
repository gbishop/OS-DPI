import go from "./go";

go("contact.json", [
  {
    origin: "chatMenu",
    event: "press",
    conditions: [],
    updates: { $ChatTopic: "topic", $tab: "link" },
  },
  {
    origin: "taskMenu",
    event: "press",
    conditions: [],
    updates: { $TaskTopic: "topic", $tab: "link" },
  },
  {
    origin: "storyMenu",
    event: "press",
    conditions: [],
    updates: { $StoryTopic: "topic", $tab: "link" },
  },
  {
    origin: "TalkGrid",
    event: "press",
    conditions: [],
    updates: { $utterance: "msg" },
  },
  {
    origin: "QuickGrid",
    event: "press",
    conditions: ["$tab == 'Choose Quickfire'"],
    updates: { $Quick: "value" },
  },
  {
    origin: "QuickGrid",
    event: "press",
    conditions: [],
    updates: { $utterance: "msg", $Quick: "value" },
  },
]);
