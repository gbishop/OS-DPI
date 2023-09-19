export default {
  className: "MethodChooser",
  props: {},
  children: [
    {
      className: "Method",
      props: {
        Name: "2 switch",
        Key: "idl6e14meiwzjdcquhgk9",
        KeyDebounce: 0.1,
        PointerEnterDebounce: 0,
        PointerDownDebounce: 0,
        Active: "false",
        Pattern: "DefaultPattern",
      },
      children: [
        {
          className: "KeyHandler",
          props: { Signal: "keyup" },
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
              className: "ResponderNext",
              props: { Response: "ResponderNext" },
              children: [],
            },
          ],
        },
        {
          className: "KeyHandler",
          props: { Signal: "keyup" },
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
        Name: "Pointer dwell",
        Key: "idl6wcdmjjkb48xmbxscn",
        KeyDebounce: 0,
        PointerEnterDebounce: 0.1,
        PointerDownDebounce: 0.1,
        Active: "false",
        Pattern: "idl83jg7qtj9wmyggtxf",
      },
      children: [
        {
          className: "PointerHandler",
          props: { Signal: "pointerover" },
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
          props: { Signal: "pointerout" },
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
          props: { Signal: "pointerdown" },
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
        KeyDebounce: 0,
        PointerEnterDebounce: 0,
        PointerDownDebounce: 0,
        Key: "idl84ljjeoebyl94sow87",
        Active: "true",
        Pattern: "idl83jg7qtj9wmyggtxf",
      },
      children: [
        {
          className: "PointerHandler",
          props: { Signal: "pointerdown" },
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
          props: { Signal: "pointerover" },
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
          props: { Signal: "pointerout" },
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
