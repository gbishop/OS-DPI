import go from "./go";

go("contact.json", [
  {
    origin: "chatMenu",
    event: "press",
    restrictions: [],
    actions: ["$ChatTopic=topic", "$tab = link"],
  },
  {
    origin: "taskMenu",
    event: "press",
    restrictions: [],
    actions: ["$TaskTopic=topic", "$tab = link"],
  },
  {
    origin: "storyMenu",
    event: "press",
    restrictions: [],
    actions: ["$StoryTopic=topic", "$tab = link"],
  },
  {
    origin: "TalkGrid",
    event: "press",
    restrictions: [],
    actions: ["$utterance=msg"],
  },
  {
    origin: "QuickGrid",
    event: "press",
    restrictions: ["$tab == 'Choose Quickfire'"],
    actions: ["$Quick = value"],
  },
  {
    origin: "QuickGrid",
    event: "press",
    restrictions: [],
    actions: ["$utterance = msg", "$Quick = value"],
  },
]);
