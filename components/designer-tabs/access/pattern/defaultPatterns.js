export default {
  className: "PatternList",
  props: {},
  children: [
    {
      className: "PatternManager",
      props: {
        Cycles: "2",
        Cue: "idl7qm4cs28fh2ogf4ni",
        Name: "None",
        Key: "idl83jg7qtj9wmyggtxf",
      },
      children: [],
    },
    {
      className: "PatternManager",
      props: {
        Cycles: "2",
        Cue: "idl7qm4cs28fh2ogf4ni",
        Name: "Controls and Rows",
        Key: "idl83jjo4z0ibii6748fx",
      },
      children: [
        {
          className: "PatternGroup",
          props: { Name: "Controls", Cycles: "2", Cue: "idl7w16hghqop9hcgn95" },
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
                Cue: "idl7qm4cs28fh2ogf4ni",
                Cycles: "2",
              },
              children: [],
            },
            {
              className: "GroupBy",
              props: {
                GroupBy: "#row",
                Name: "Row #row",
                Cue: "idl7qm4cs28fh2ogf4ni",
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
        Cycles: "5",
        Cue: "idl7ysqw4agxg63qvx4j5",
        Name: "Fill page order",
        Key: "idl84lw7z6km7dgni3tn",
      },
      children: [],
    },
  ],
};
