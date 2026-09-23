"""
Offline stand-in for emergentintegrations' LLM gateway (the EMERGENT_LLM_KEY client).

It mirrors the real call shape exactly — `LlmChat(api_key, session_id, system_message)
.with_model(provider, model)` then `await chat.send_message(UserMessage(text=...))` — and has no
other methods, so code calling something the real library lacks (e.g. `.chat()`) fails in tests
instead of in production. No network is touched: `send_message` returns `LlmChat.response` (or
raises `LlmChat.error`), and every call is recorded for assertions.
"""

import json


class UserMessage:
    def __init__(self, text):
        self.text = text


class LlmChat:
    response = json.dumps({})
    error = None  # set to an Exception instance to make send_message raise
    prompts = []
    system_messages = []
    session_ids = []

    def __init__(self, api_key, session_id, system_message):
        if not api_key:
            raise ValueError("api_key is required")
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.model = None

    def with_model(self, provider, model):
        self.model = (provider, model)
        return self

    async def send_message(self, message):
        LlmChat.prompts.append(message.text)
        LlmChat.system_messages.append(self.system_message)
        LlmChat.session_ids.append(self.session_id)
        if LlmChat.error is not None:
            raise LlmChat.error
        return LlmChat.response

    @classmethod
    def reset(cls):
        cls.response = json.dumps({})
        cls.error = None
        cls.prompts = []
        cls.system_messages = []
        cls.session_ids = []
