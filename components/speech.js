import { log } from "../log";
import { strip } from "./display";
import { Base, componentMap } from "./base";
import { html } from "uhtml";
import { Globals } from "../start";

class Speech extends Base {
  static defaultProps = {
    stateName: "$Speak",
    voiceURI: "",
    pitch: 1,
    rate: 1,
    volume: 1,
  };

  async speak() {
    const { state } = Globals;
    const { stateName, voiceURI, pitch, rate, volume } = this.props;
    const message = strip(state.get(stateName));
    const voices = await getVoices();
    const voice =
      voiceURI && voices.find((voice) => voice.voiceURI == voiceURI);
    const utterance = new SpeechSynthesisUtterance(message);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;
    log("speak", { message, voiceURI });
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  template() {
    const { stateName } = this.props;
    const { state } = Globals;
    if (state.hasBeenUpdated(stateName)) {
      this.speak();
    }
    return html``;
  }
}
componentMap.addMap("speech", Speech);

/** @type{SpeechSynthesisVoice[]} */
let voices = [];

/**
 * Promise to return voices
 *
 * @return {Promise<SpeechSynthesisVoice[]>} Available voices
 */
function getVoices() {
  return new Promise(function (resolve) {
    // iOS won't fire the voiceschanged event so we have to poll for them
    function f() {
      voices = (voices.length && voices) || speechSynthesis.getVoices();
      if (voices.length) resolve(voices);
      else setTimeout(f, 100);
    }
    f();
  });
}

class VoiceSelect extends HTMLSelectElement {
  constructor() {
    super();
    console.log("construct select-voice");
  }
  connectedCallback() {
    console.log(this, "connected");
    this.addVoices();
  }

  async addVoices() {
    const voices = await getVoices();
    const current = this.getAttribute("value");
    console.log("voices", voices, current);
    for (const voice of voices) {
      const item = html.node`<option value=${voice.voiceURI} ?selected=${
        voice.voiceURI == current
      }>${voice.name}</option>`;
      this.add(/** @type {HTMLOptionElement} */ (item));
    }
  }
}
customElements.define("select-voice", VoiceSelect, { extends: "select" });
