import go from "./go";

go("./vsd.json", [
  {
    origin: "vsd",
    event: "press",
    conditions: [],
    updates: { $utterance: "msg", $Speak: "msg" },
  },
]);
