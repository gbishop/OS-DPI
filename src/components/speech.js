import { TreeBase } from "./treebase";
import { html } from "uhtml";
import Globals from "app/globals";
import * as Props from "./props";
import { toString } from "./slots";

class Speech extends TreeBase {
  stateName = new Props.String("$Speak");
  voiceURI = new Props.Voice("", { label: "Voice" });
  pitch = new Props.Float(1);
  rate = new Props.Float(1);
  volume = new Props.Float(1);

  async speak() {
    const { state } = Globals;
    const voiceURI = this.voiceURI.value;
    const message = toString(state.get(this.stateName.value));
    const voices = await getVoices();
    const voice =
      voiceURI && voices.find((voice) => voice.voiceURI == voiceURI);
    const utterance = new SpeechSynthesisUtterance(message);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.pitch = this.pitch.value;
    utterance.rate = this.rate.value;
    utterance.volume = this.volume.value;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  template() {
    const { state } = Globals;
    if (state.hasBeenUpdated(this.stateName.value)) {
      this.speak();
    }
    return [];
  }
}
TreeBase.register(Speech, "Speech");

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
  }
  connectedCallback() {
    this.addVoices();
  }

  async addVoices() {
    const voices = await getVoices();
    const current = this.getAttribute("value");
    for (const voice of voices) {
      const item = html.node`<option value=${voice.voiceURI} ?selected=${
        voice.voiceURI == current
      }>${voice.name}</option>`;
      this.add(/** @type {HTMLOptionElement} */ (item));
    }
  }
}
customElements.define("select-voice", VoiceSelect, { extends: "select" });
