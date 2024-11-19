import { TreeBase } from "./treebase";
import { html } from "uhtml";
import Globals from "app/globals";
import * as Props from "./props";
import { toString } from "./slots";
import { cursor } from "./notes";

/**
 * @param {string} message
 * @param {string} voiceURI
 * @param {number} pitch
 * @param {number} rate
 * @param {number} volume
 */
export async function speak(message, voiceURI, pitch, rate, volume) {
  if (!message) return;
  const voices = await getVoices();
  const voice = voiceURI && voices.find((voice) => voice.voiceURI == voiceURI);
  const utterance = new SpeechSynthesisUtterance(message);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  utterance.pitch = pitch;
  utterance.rate = rate;
  utterance.volume = volume;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

class Speech extends TreeBase {
  stateName = new Props.String("$Speak");
  voiceURI = new Props.Voice("", { label: "Voice" });
  pitch = new Props.Float(1);
  rate = new Props.Float(1);
  volume = new Props.Float(1);

  async speak() {
    const { state } = Globals;
    const voiceURI = this.voiceURI.value;
    const message = toString(state.get(this.stateName.value)).replace(
      cursor,
      "",
    );
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
    utterance.addEventListener("boundary", (event) => {
      document.dispatchEvent(
        new SpeechSynthesisEvent("boundary", {
          utterance: event.utterance,
          charIndex: event.charIndex,
        }),
      );
    });
    utterance.addEventListener("end", (event) => {
      document.dispatchEvent(
        new SpeechSynthesisEvent("end", {
          utterance: event.utterance,
          charIndex: event.charIndex,
        }),
      );
    });
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  template() {
    const { state } = Globals;
    if (state.hasBeenUpdated(this.stateName.value)) {
      const message = toString(state.get(this.stateName.value));
      speak(
        message,
        this.voiceURI.value,
        this.pitch.value,
        this.rate.value,
        this.volume.value,
      );
    }
    return html`<div />`;
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
    /** @param {SpeechSynthesisVoice} a
     * @param {SpeechSynthesisVoice} b
     */
    function compareVoices(a, b) {
      return a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name);
    }
    voices.sort(compareVoices);
    const current = this.getAttribute("value");
    for (const voice of voices) {
      const item = document.createElement("option");
      item.value = voice.voiceURI;
      if (voice.voiceURI == current) item.setAttribute("selected", "");
      item.innerText = `${voice.name} ${voice.lang}`;
      this.add(item);
    }
  }
}
customElements.define("select-voice", VoiceSelect, { extends: "select" });
