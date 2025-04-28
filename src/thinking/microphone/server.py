#!/usr/bin/env python

"""
An example of a trivial microphone server for use with OS-DPI.

Incoming messages are wav encoded audio

Gary Bishop April 2025
"""

import asyncio
import websockets
import sys

chunk = 0


async def getaudio(websocket):
    global chunk
    chunkName = f"/tmp/chunk{chunk}.webm"
    fp = open(chunkName, "wb")
    chunk += 1
    try:
        async for message in websocket:
            fp.write(message)
    except websockets.exceptions.ConnectionClosedError:
        fp.close()
        print("connection closed")
    except asyncio.exceptions.CancelledError:
        pass
    finally:
        fp.close()
        print("connection closed")


async def main():
    try:
        async with websockets.serve(getaudio, "0.0.0.0", 6789):
            print("serving")
            try:
                await asyncio.Future()  # run forever
            except KeyboardInterrupt:
                sys.exit(1)
    except asyncio.exceptions.CancelledError:
        pass
    except KeyboardInterrupt:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
