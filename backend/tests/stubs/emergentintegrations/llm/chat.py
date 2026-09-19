"""
Offline stand-in for emergentintegrations' LLM gateway (the EMERGENT_LLM_KEY
client). No network is ever touched: `LlmChat.chat` returns whatever
`LlmChat.response` holds, and every prompt sent is recorded in `LlmChat.prompts`
so tests can assert on what would have left the process.
"""

import json


class UserMessage:
    def __init__(self, text):
        self.text = text


class LlmChat:
    response = json.dumps({})
    prompts = []

    def __init__(self, api_key="", *args, **kwargs):
        self.api_key = api_key

    async def chat(self, prompt):
        LlmChat.prompts.append(prompt)
        return LlmChat.response

    async def send_message(self, message):
        LlmChat.prompts.append(message.text)
        return LlmChat.response
