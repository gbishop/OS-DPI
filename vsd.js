import go from "./go";

go("./vsd.json", [
  {
    origin: "vsd",
    event: "press",
    restrictions: [],
    actions: ["$utterance = msg"],
  },
]);
