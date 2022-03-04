import db from "./db";

class Broadcast {
    /** @param {string=} name */
    constructor(name) {
        this.channel = new BroadcastChannel(name || "os-dpi");
    }

    /**
     *  @callback broadcastCallback
     *  @param  {Event} event 
     */
    /** @param {broadcastCallback} callback */
    onmessage(callback) {
        this.channel.onmessage = callback;
    }
}

export default new Broadcast();