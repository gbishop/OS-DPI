import { log } from "../log";
import { strip } from "./display";
import { Base, componentMap } from "./base";
import { html } from "uhtml";

class Audio extends Base {
  static defaultProps = {
    stateName: "$Audio",
  };

  async playAudio() {
    const { state } = this.context;
    const { stateName } = this.props;
    const message = strip(state.get(stateName));
    //log("play audio", { message, voiceURI });
  }

  template() {
    const { stateName } = this.props;
    const { state } = this.context;
    console.log("called!");
    if (state.hasBeenUpdated(stateName)) {
      console.log("playing audio!", stateName);
    }
    return html``;
  }
}
componentMap.addMap("audio", Audio);