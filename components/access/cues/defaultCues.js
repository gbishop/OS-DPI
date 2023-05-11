export default {
  className: "CueList",
  props: {
    direction: "",
    background: "",
    scale: 1,
    name: "Cues",
    label: "",
  },
  children: [
    {
      className: "CueOverlay",
      props: {
        Name: "red overlay",
        Key: "idl7w16hghqop9hcgn95",
        CueType: "CueOverlay",
        Default: true,
        Color: "red",
        Opacity: "0.2",
      },
      children: [],
    },
    {
      className: "CueFill",
      props: {
        Name: "fill",
        Key: "idl7ysqw4agxg63qvx4j5",
        CueType: "CueFill",
        Default: false,
        Color: "#7BAFD4",
        Opacity: "0.3",
        Direction: "top",
        Repeat: false,
      },
      children: [],
    },
    {
      className: "CueCircle",
      props: {
        Name: "circle",
        Key: "idl7ythslqew02w4pom29",
        CueType: "CueCircle",
        Default: false,
        Color: "#7BAFD4",
        Opacity: 0.7,
      },
      children: [],
    },
    {
      className: "CueCss",
      props: {
        Name: "yellow overlay using CSS",
        Key: "idl7qm4cs28fh2ogf4ni",
        CueType: "CueCss",
        Default: false,
        Code: `button[cue="$Key"] {
  position: relative;
  border-color: yellow;
}
button[cue="$Key"]:after {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: yellow;
  opacity: 0.3;
  z-index: 10;
}`,
      },
      children: [],
    },
  ],
};
