import go from "./go";

go(
  "60-locations.json",
  [
    {
      origin: "TalkGrid",
      event: "press",
      conditions: [],
      updates: {
        $Display: "increment(' '+msg)",
        $last_token: "msg"
      },
    },
    {
      origin: "morph",
      event: "press",
      conditions: [],
      updates: {
        $modalOpen: "1",
      },
    },
    {
      origin: "CancelConjugate",
      event: "press",
      conditions: [],
      updates: {
        $modalOpen: "0",
      },
    },
    {
      origin: "ConjugateGrid",
      event: "press",
      conditions: [],
      updates: {
        $modalOpen: "0",
        $Display: "insert_conjugate(msg)",
      },
    },
  ],
  { $last_token: "" }
);
