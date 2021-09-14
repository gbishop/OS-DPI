import { state } from "../state";
import { strip } from "./a-display";
import ABase from "./a-base";

/** @type{SpeechSynthesisVoice[]} */
let voices = [];

/**
 * Promise to return voices
 *
 * @return {Promise<SpeechSynthesisVoice[]>} Available voices
 */
function getVoices() {
  return new Promise(function (resolve) {
    function f() {
      voices = (voices.length && voices) || speechSynthesis.getVoices();
      if (voices.length) resolve(voices);
      else setTimeout(f, 100);
    }
    f();
  });
}

/**
 * Speak a message
 * @param {String} message
 */
function speak(message) {
  message = strip(message);
  const voiceURI = state("$VoiceURI");
  const voice = voices.find((voice) => voice.voiceURI == voiceURI);
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  speechSynthesis.speak(utterance);
}

/**
 * Initialize speech and default voice
 */
async function init() {
  let voices = await getVoices();
  state.define(
    "$VoiceURI",
    voices.filter((voice) => voice.lang.startsWith("en"))[0].voiceURI
  );
  state.observe(speak, "$Speak");
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = function () {
      voices = speechSynthesis.getVoices();
    };
  }
}

init();

class AVoiceSelect extends ABase {
  lang = "en";
}

customElements.define("a-voice-select", AVoiceSelect);
