export default {
  className: "MethodChooser",
  props: {},
  children: [
    {
      className: "Method",
      props: {
        Name: "2 switch",
        Key: "idl6e14meiwzjdcquhgk9",
        Active: "false",
        Pattern: "idl83jjo4z0ibii6748fx",
      },
      children: [
        {
          className: "KeyHandler",
          props: { Signal: "keyup", Debounce: "0.1" },
          children: [
            {
              className: "HandlerKeyCondition",
              props: { Key: " " },
              children: [],
            },
            {
              className: "HandlerKeyCondition",
              props: { Key: "ArrowRight" },
              children: [],
            },
            {
              className: "ResponderPatternNext",
              props: { Response: "ResponderPatternNext" },
              children: [],
            },
          ],
        },
        {
          className: "KeyHandler",
          props: { Signal: "keyup", Debounce: "0.1" },
          children: [
            {
              className: "HandlerKeyCondition",
              props: { Key: "Enter" },
              children: [],
            },
            {
              className: "HandlerKeyCondition",
              props: { Key: "ArrowLeft" },
              children: [],
            },
            {
              className: "ResponderPatternActivate",
              props: { Response: "ResponderPatternActivate" },
              children: [],
            },
          ],
        },
      ],
    },
    {
      className: "Method",
      props: {
        Name: "Pointer dwell",
        Key: "idl6wcdmjjkb48xmbxscn",
        Active: "false",
        Pattern: "idl84lw7z6km7dgni3tn",
      },
      children: [
        {
          className: "PointerHandler",
          props: { Signal: "pointerover", Debounce: "0.1" },
          children: [
            {
              className: "ResponderCue",
              props: { Response: "ResponderCue", Cue: "idl7qm4cs28fh2ogf4ni" },
              children: [],
            },
            {
              className: "ResponderStartTimer",
              props: {
                Response: "ResponderStartTimer",
                TimerName: "idl7yrtido633vxa1bb1v",
              },
              children: [],
            },
          ],
        },
        {
          className: "PointerHandler",
          props: { Signal: "pointerout", Debounce: "0.1" },
          children: [
            {
              className: "ResponderClearCue",
              props: { Response: "ResponderClearCue" },
              children: [],
            },
          ],
        },
        {
          className: "PointerHandler",
          props: { Signal: "pointerdown", Debounce: "0.1" },
          children: [
            {
              className: "ResponderActivate",
              props: { Response: "ResponderActivate" },
              children: [],
            },
          ],
        },
        {
          className: "Timer",
          props: {
            Interval: "1.5",
            Name: "dwell",
            Key: "idl7yrtido633vxa1bb1v",
          },
          children: [],
        },
        {
          className: "TimerHandler",
          props: { Signal: "timer", TimerName: "idl7yrtido633vxa1bb1v" },
          children: [
            {
              className: "ResponderActivate",
              props: { Response: "ResponderActivate" },
              children: [],
            },
          ],
        },
      ],
    },
    {
      className: "Method",
      props: {
        Name: "Mouse",
        Key: "idl84ljjeoebyl94sow87",
        Active: "true",
        Pattern: "idl83jg7qtj9wmyggtxf",
      },
      children: [
        {
          className: "PointerHandler",
          props: { Signal: "pointerdown", Debounce: "0.01" },
          children: [
            {
              className: "ResponderActivate",
              props: { Response: "ResponderActivate" },
              children: [],
            },
          ],
        },
        {
          className: "PointerHandler",
          props: { Signal: "pointerover", Debounce: "0.1" },
          children: [
            {
              className: "ResponderCue",
              props: { Response: "ResponderCue", Cue: "idl7qm4cs28fh2ogf4ni" },
              children: [],
            },
          ],
        },
        {
          className: "PointerHandler",
          props: { Signal: "pointerout", Debounce: "0.1" },
          children: [
            {
              className: "ResponderClearCue",
              props: { Response: "ResponderClearCue" },
              children: [],
            },
          ],
        },
      ],
    },
  ],
};
