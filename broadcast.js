class Broadcast {
    /** @param {string=} name */
    constructor(name) {
        this.channel = new BroadcastChannel(name || "os-dpi");
    }

    /**
     *  @callback broadcastCallback
     *  @param  {MessageEvent} event 
     */
    /** @param {broadcastCallback} callback */
    onmessage(callback) {
        this.channel.onmessage = callback;
    }
}

export default new Broadcast();