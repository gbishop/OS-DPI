export default {
  className: "PatternList",
  props: {
    direction: "",
    background: "",
    scale: 1,
    name: "Patterns",
    label: "",
  },
  children: [
    {
      className: "PatternManager",
      props: {
        Cycles: "2",
        Cue: "DefaultCue",
        Name: "None",
        Key: "idl83jg7qtj9wmyggtxf",
        Active: false,
      },
      children: [],
    },
    {
      className: "PatternManager",
      props: {
        Cycles: "2",
        Cue: "DefaultCue",
        Name: "Row Column",
        Key: "idl83jjo4z0ibii6748fx",
        Active: true,
      },
      children: [
        {
          className: "PatternSelector",
          props: {},
          children: [
            {
              className: "GroupBy",
              props: {
                GroupBy: "#row",
                Name: "Row #row",
                Cue: "DefaultCue",
                Cycles: "2",
              },
              children: [],
            },
          ],
        },
      ],
    },
    {
      className: "PatternManager",
      props: {
        Cycles: 2,
        Cue: "DefaultCue",
        Name: "Column Row",
        Key: "idlh6dwljzc1nwvfrrp9v",
        Active: false,
      },
      children: [
        {
          className: "PatternSelector",
          props: {},
          children: [
            {
              className: "GroupBy",
              props: {
                GroupBy: "#column",
                Name: "Column #column",
                Cue: "DefaultCue",
                Cycles: 2,
              },
              children: [],
            },
          ],
        },
      ],
    },
    {
      className: "PatternManager",
      props: {
        Cycles: "2",
        Cue: "DefaultCue",
        Name: "Controls and Rows",
        Key: "idl83jjo4z0ibii6748fx",
        Active: false,
      },
      children: [
        {
          className: "PatternGroup",
          props: { Name: "Controls", Cycles: "2", Cue: "DefaultCue" },
          children: [
            {
              className: "PatternSelector",
              props: {},
              children: [
                {
                  className: "Filter",
                  props: { Filter: "#controls" },
                  children: [],
                },
                {
                  className: "OrderBy",
                  props: { OrderBy: "#controls" },
                  children: [],
                },
              ],
            },
          ],
        },
        {
          className: "PatternSelector",
          props: {},
          children: [
            {
              className: "Filter",
              props: { Filter: "! #controls" },
              children: [],
            },
            {
              className: "GroupBy",
              props: {
                GroupBy: "#ComponentName",
                Name: " Component",
                Cue: "DefaultCue",
                Cycles: "2",
              },
              children: [],
            },
            {
              className: "GroupBy",
              props: {
                GroupBy: "#row",
                Name: "Row #row",
                Cue: "DefaultCue",
                Cycles: "2",
              },
              children: [],
            },
          ],
        },
      ],
    },
  ],
};
