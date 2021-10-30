import { log } from "../log";
import { State } from "../state";
import { strip } from "./display";

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
 * Initialize speech and default voice
 */
/** @param {State} state */
export async function initSpeech(state) {
  let voices = await getVoices();
  /**
   * Speak a message
   */
  function speak() {
    const message = strip(state.get("$Speak"));
    const voiceURI = state.get("$VoiceURI");
    const voice = voices.find((voice) => voice.voiceURI == voiceURI);
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    log("speak", { message, voiceURI });
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

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
