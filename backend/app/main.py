from __future__ import annotations

import re
from collections import Counter

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

_STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "has",
    "have",
    "he",
    "her",
    "his",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "me",
    "my",
    "not",
    "of",
    "on",
    "or",
    "our",
    "she",
    "so",
    "that",
    "the",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "to",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "who",
    "will",
    "with",
    "you",
    "your",
}


class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    summary: str
    insights: list[str]


_WORD_RE = re.compile(r"[A-Za-z0-9']+")
_URL_RE = re.compile(r"https?://\S+", re.IGNORECASE)


def _tokenize(text: str) -> list[str]:
    return [t.lower() for t in _WORD_RE.findall(text)]


def _sentences(text: str) -> list[str]:
    # Very lightweight sentence splitting; good enough for heuristics.
    parts = re.split(r"[.!?]+\s+", text.strip())
    return [p for p in (p.strip() for p in parts) if p]


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    text = (req.text or "").strip()
    char_count = len(text)

    tokens = _tokenize(text)
    word_count = len(tokens)

    sentences = _sentences(text)
    sentence_count = len(sentences)

    alpha_tokens = [t for t in tokens if re.search(r"[a-z]", t)]
    unique_alpha = set(alpha_tokens)

    avg_word_len = (
        sum(len(t) for t in alpha_tokens) / len(alpha_tokens) if alpha_tokens else 0.0
    )
    lexical_diversity = (
        len(unique_alpha) / len(alpha_tokens) if alpha_tokens else 0.0
    )

    # Keywords: drop stopwords + very short tokens
    keyword_tokens = [
        t
        for t in alpha_tokens
        if t not in _STOPWORDS and len(t) >= 4
    ]
    top_keywords = [w for (w, _) in Counter(keyword_tokens).most_common(5)]

    digit_token_count = sum(1 for t in tokens if any(ch.isdigit() for ch in t))
    question_count = text.count("?")
    url_count = len(_URL_RE.findall(text))

    reading_time_min = word_count / 200 if word_count else 0.0  # ~200 wpm heuristic

    insights: list[str] = [
        f"Word count: {word_count}",
        f"Character count: {char_count}",
    ]

    if sentence_count:
        insights.append(f"Sentence count: {sentence_count}")
        insights.append(f"Avg words/sentence: {word_count / sentence_count:.1f}")

    if alpha_tokens:
        insights.append(f"Avg word length: {avg_word_len:.1f} chars")
        insights.append(f"Lexical diversity: {lexical_diversity:.2f} (unique/total)")

    if top_keywords:
        insights.append(f"Top keywords: {', '.join(top_keywords)}")

    if digit_token_count:
        insights.append(f"Contains {digit_token_count} token(s) with digits (potential data points).")

    if url_count:
        insights.append(f"Contains {url_count} URL(s) (may reference sources).")

    if question_count:
        insights.append(f"Contains {question_count} question(s) — likely seeking an answer or decision.")

    if word_count:
        insights.append(f"Estimated reading time: {reading_time_min:.1f} min (@200 wpm)")

    # Conditional insight (short vs long text) + next-best action
    if word_count <= 8:
        summary = "Too little context for deep analysis"
        insights.append("This is short text; include a full paragraph for stronger, more reliable insights.")
    elif word_count <= 60:
        summary = "Quick, data-driven snapshot"
        insights.append("This is moderate-length text; insights focus on keywords, structure, and signals (numbers/questions/links).")
    else:
        summary = "Deeper signals detected"
        insights.append("This is longer text; next step is extracting claims, evidence, and a concise structured summary.")

    return AnalyzeResponse(summary=summary, insights=insights)
