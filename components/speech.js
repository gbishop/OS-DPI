// speech.js
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { TreeBase } from "./treebase";
import { html } from "uhtml";
import Globals from "app/globals";
import * as Props from "./props";

/**
 * Speech component using Microsoft Cognitive Services Speech SDK.
 */
class Speech extends TreeBase {
  // Define properties with default values
  stateName = new Props.String("$Speak");
  voiceURI = new Props.String("$VoiceURI", "en-US-DavisNeural"); // Default to DavisNeural
  expressStyle = new Props.String("$ExpressStyle", "friendly"); // Default expression style
  isSpeaking = false; // Track if currently speaking

  constructor() {
    super();
    this.initSynthesizer();
  }

  /**
   * Logs messages with a timestamp for debugging purposes.
   * @param {string} message - The message to log.
   */
  logWithTimestamp(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  /**
   * Initializes the Speech Synthesizer with the Microsoft SDK.
   */
  initSynthesizer() {
    // Initialize Speech Configuration with your subscription key and region
    this.speechConfig = sdk.SpeechConfig.fromSubscription(
      'c7d8e36fdf414cbaae05819919fd416d', // Replace with your actual subscription key
      'eastus'            // Replace with your service region, e.g., 'eastus'
    );

    // Set desired synthesis output format
    this.speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    // Initialize Audio Config to output to default speaker
    this.audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();

    // Create a Speech Synthesizer instance
    this.synthesizer = new sdk.SpeechSynthesizer(
      this.speechConfig,
      this.audioConfig
    );

    // Attach event handlers for synthesis events
    this.synthesizer.synthesisStarted = (s, e) =>
      this.logWithTimestamp("Synthesis started");
    this.synthesizer.synthesisCompleted = (s, e) => {
      this.logWithTimestamp("Synthesis completed");
      this.isSpeaking = false;
      this.initSynthesizer(); // Re-initialize after completion
    };
    this.synthesizer.synthesisCanceled = (s, e) => {
      this.logWithTimestamp(`Synthesis canceled: ${e.reason}`);
      this.isSpeaking = false;
      this.initSynthesizer(); // Re-initialize after cancellation
    };
  }

  /**
   * Initiates speech synthesis for the given message.
   */
  async speak() {
    if (this.isSpeaking) {
      this.logWithTimestamp("Cancelling current speech synthesis.");
      this.synthesizer.close();
      this.isSpeaking = false;
    }

    this.isSpeaking = true;

    const { state } = Globals;
    const message = state.get(this.stateName.value);
    const voice = state.get(this.voiceURI.value) || "en-US-DavisNeural"; // Default voice
    const style = state.get(this.expressStyle.value) || "friendly";

    if (!message) {
      this.logWithTimestamp("No message to speak.");
      this.isSpeaking = false;
      return;
    }

    this.logWithTimestamp(`Using voice: ${voice}, style: ${style}, message: ${message}`);

    // Construct SSML for speech synthesis
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
        <voice name="${voice}">
          <mstts:express-as style="${style}">
            ${this.escapeSSML(message)}
          </mstts:express-as>
        </voice>
      </speak>`;

    try {
      this.synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            this.logWithTimestamp("Speech synthesized successfully");
          } else if (result.reason === sdk.ResultReason.Canceled) {
            const cancellationDetails = sdk.SpeechSynthesisCancellationDetails.fromResult(result);
            this.logWithTimestamp(
              `Speech synthesis canceled: ${cancellationDetails.reason}, ${cancellationDetails.errorDetails}`
            );
          }
          this.isSpeaking = false;
          this.initSynthesizer();
        },
        (error) => {
          this.logWithTimestamp(`An error occurred: ${error}`);
          this.isSpeaking = false;
          this.initSynthesizer();
        }
      );
    } catch (error) {
      this.logWithTimestamp(`Error in speak method: ${error}`);
      this.isSpeaking = false;
      this.initSynthesizer();
    }
  }

  /**
   * Escapes special characters in SSML.
   * @param {string} text - The text to escape.
   * @returns {string} - Escaped text.
   */
  escapeSSML(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * Handles component disconnection by closing the synthesizer if speaking.
   */
  disconnectedCallback() {
    if (this.isSpeaking) {
      this.synthesizer.close();
      this.isSpeaking = false;
      this.logWithTimestamp("Synthesizer stopped on component disconnect");
    }
  }

  /**
   * Renders the component's template.
   * @returns {TemplateResult} - The HTML template.
   */
  template() {
    const { state } = Globals;
    if (state.hasBeenUpdated(this.stateName.value)) {
      this.speak();
    }
    return html`<div />`;
  }
}

// Register the Speech class with the component framework
TreeBase.register(Speech, "Speech");

/**
 * Optional: VoiceSelect component for Microsoft Voices
 * Note: Microsoft Speech SDK manages voices differently. 
 * You may need to fetch available voices from a server or predefined list.
 * Below is a basic implementation assuming a predefined list.
 */

class VoiceSelect extends HTMLSelectElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addVoices();
  }

  async addVoices() {
    // Define available Microsoft voices
    const voices = [
      { name: "en-US-DavisNeural", lang: "en-US" },
      { name: "en-US-JennyNeural", lang: "en-US" },
      { name: "en-GB-RyanNeural", lang: "en-GB" },
      // Add more voices as needed
    ];

    const current = this.getAttribute("value") || "en-US-DavisNeural";

    // Clear existing options
    this.innerHTML = '';

    // Populate select with voices
    for (const voice of voices) {
      const option = document.createElement("option");
      option.value = voice.name;
      if (voice.name === current) option.selected = true;
      option.textContent = `${voice.name} (${voice.lang})`;
      this.appendChild(option);
    }
  }
}

// Define the custom element for voice selection
customElements.define("select-voice", VoiceSelect, { extends: "select" });

// **Add this line to export Speech as default**
export default Speech;
