from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    summary: str
    insights: list[str]


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    text = req.text or ""
    words = [w for w in text.split() if w]

    insights: list[str] = [
        f"Word count: {len(words)}",
        f"Character count: {len(text)}",
    ]

    # Conditional insight (short vs long)
    if len(words) <= 3:
        insights.append("This is short text; add more context for deeper insights.")
        summary = "Short text analyzed"
    else:
        insights.append("This is longer text; key themes and structure can be analyzed.")
        summary = "Text analyzed"

    return AnalyzeResponse(summary=summary, insights=insights)
