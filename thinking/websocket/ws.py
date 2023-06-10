#!/usr/bin/env python

'''
An example of a trivial websocket server for use with OS-DPI.

Incoming messages are the OS-DPI state json encoded. Reply with a json encoded
message that will trigger the socket handler.

Gary Bishop June 2023
'''

import asyncio
import datetime
import websockets
import json

async def answer(websocket):
    try:
        async for message in websocket:
            print(message)
            event = json.loads(message)
            action = event.get("$socket", "none")
            if action == 'time':
                now = datetime.datetime.now()
                message = f'You said "{event["$Again"]}" at {now:%I:%M%p}'
            else:
                message = f'invalid action "{action}"'
            await websocket.send(json.dumps({
                "message": message
                }))
    finally:
        print("connection closed")

async def main():
    async with websockets.serve(answer, "0.0.0.0", 5678):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
