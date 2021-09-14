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
    event: "alt-press",
    conditions: ["slots.hasSlots(msg)"],
    updates: {
      $Display: "slots.init(msg)",
      $SlotsPopup: "1",
    },
  },
  {
    origin: "TalkGrid",
    event: "alt-press",
    conditions: [],
    updates: { $tab: "'Keyboard'", $Display: "msg" },
  },
  {
    origin: "TalkGrid",
    event: "press",
    conditions: [],
    updates: { $Display: "msg", $Speak: "msg" },
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
    updates: { $Speak: "msg", $Quick: "value" },
  },
  {
    origin: "cancelSlot",
    event: "press",
    conditions: [],
    updates: { $Display: "slots.cancel()", $SlotsPopup: "0" },
  },
  {
    origin: "nextSlot",
    event: "press",
    conditions: [],
    updates: { $Display: "slots.nextSlot()" },
  },
  {
    origin: "okSlot",
    event: "press",
    conditions: [],
    updates: { $SlotsPopup: "0", $Speak: "$Display" },
  },
  {
    origin: "duplicateSlot",
    event: "press",
    conditions: [],
    updates: { $Display: "slots.duplicate()" },
  },
  {
    origin: "SlotGrid",
    event: "press",
    conditions: [],
    updates: { $Display: "slots.update(msg)" },
  },
]);
