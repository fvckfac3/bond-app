"""
Offline stand-in for the `anthropic` SDK (the ANTHROPIC_API_KEY client).

It mirrors the real async call shape exactly — `AsyncAnthropic(api_key=...).messages.create(
model=..., max_tokens=..., system=..., messages=[{"role": "user", "content": ...}])` — and has
no other methods, so code calling something the real library lacks fails in tests instead of
in production. No network is touched: `messages.create` returns a message wrapping
`AsyncAnthropic.response` as a single text block (or raises `AsyncAnthropic.error`), and every
call is recorded for assertions.
"""


class _TextBlock:
    type = "text"

    def __init__(self, text):
        self.text = text


class _Message:
    def __init__(self, text):
        self.content = [_TextBlock(text)]


class _Messages:
    def __init__(self, client):
        self._client = client

    async def create(self, *, model, max_tokens, system, messages):
        AsyncAnthropic.prompts.append(messages[0]["content"])
        AsyncAnthropic.system_messages.append(system)
        AsyncAnthropic.models.append(model)
        if AsyncAnthropic.error is not None:
            raise AsyncAnthropic.error
        return _Message(AsyncAnthropic.response)


class AsyncAnthropic:
    response = "{}"
    error = None  # set to an Exception instance to make messages.create raise
    prompts = []
    system_messages = []
    models = []

    def __init__(self, api_key):
        if not api_key:
            raise ValueError("api_key is required")
        self.api_key = api_key
        self.messages = _Messages(self)

    @classmethod
    def reset(cls):
        cls.response = "{}"
        cls.error = None
        cls.prompts = []
        cls.system_messages = []
        cls.models = []
