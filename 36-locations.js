import go from "./go";

go("36-locations.json", [
  {
    origin: "TalkGrid",
    event: "press",
    conditions: [],
    updates: { $Display: "msg"},
  },
]);
