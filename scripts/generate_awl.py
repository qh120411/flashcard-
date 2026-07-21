"""Generate the complete 570-card AWL dataset used by the flashcard app."""

from __future__ import annotations

import html
import json
import re
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path


AWL_URL = "https://www.eapfoundation.com/vocab/academic/awllists/"
TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
OUTPUT = Path(__file__).resolve().parents[1] / "app" / "awl.generated.ts"


def clean_html(value: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", value)).strip()


def fetch_awl() -> list[dict[str, object]]:
    request = urllib.request.Request(AWL_URL, headers={"User-Agent": "Wordly-AWL-Builder/1.0"})
    source = urllib.request.urlopen(request, timeout=45).read().decode("utf-8")
    rows: list[dict[str, object]] = []
    for row in re.findall(r"<tr><td>.*?</tr>", source, flags=re.S):
        cells = re.findall(r"<td>(.*?)</td>", row, flags=re.S)
        if len(cells) != 3:
            continue
        sublist = clean_html(cells[1])
        head_match = re.search(r"<b>([^<]+)</b>", cells[0])
        if not head_match or not sublist.isdigit():
            continue
        word = unicodedata.normalize("NFC", html.unescape(head_match.group(1)).strip())
        forms = []
        for form in re.findall(r"dic7\.php\?word=([^'\"]+)", cells[2]):
            decoded = urllib.parse.unquote(html.unescape(form)).strip()
            if decoded and decoded not in forms:
                forms.append(decoded)
        rows.append({"word": word, "sublist": int(sublist), "forms": forms})
    if len(rows) != 570:
        raise RuntimeError(f"Expected 570 AWL rows, found {len(rows)}")
    return rows


def translate_batch(words: list[str]) -> list[str]:
    payload = urllib.parse.urlencode(
        {"client": "gtx", "sl": "en", "tl": "vi", "dt": "t", "q": "\n".join(words)}
    ).encode()
    request = urllib.request.Request(TRANSLATE_URL, data=payload, headers={"User-Agent": "Mozilla/5.0"})
    response = json.load(urllib.request.urlopen(request, timeout=60))
    translated = "".join(segment[0] for segment in response[0]).strip().splitlines()
    if len(translated) != len(words):
        raise RuntimeError(f"Translation count mismatch: {len(words)} words, {len(translated)} translations")
    return [unicodedata.normalize("NFC", item.strip()) for item in translated]


def main() -> None:
    rows = fetch_awl()
    meanings: list[str] = []
    words = [str(row["word"]) for row in rows]
    for start in range(0, len(words), 60):
        meanings.extend(translate_batch(words[start : start + 60]))

    cards = []
    for index, (row, meaning) in enumerate(zip(rows, meanings), start=1):
        word = str(row["word"])
        sublist = int(row["sublist"])
        family = list(row["forms"])[:8]
        cards.append(
            {
                "id": index,
                "word": word,
                "phonetic": "",
                "type": f"AWL {sublist}",
                "meaning": meaning,
                "note": f"Từ học thuật thuộc nhóm AWL {sublist}; nhóm 1 có tần suất cao nhất.",
                "family": family or [word],
                "example": f'The term "{word}" is frequently used in academic writing.',
                "exampleVi": f'Từ "{word}" thường xuất hiện trong văn viết học thuật.',
                "topic": f"Nhóm {sublist}",
            }
        )

    content = (
        'import type { WordCard } from "./data";\n\n'
        "// Generated from the complete Coxhead Academic Word List.\n"
        "// Vietnamese meanings are stored as NFC UTF-8 text.\n"
        f"export const awlCards: WordCard[] = {json.dumps(cards, ensure_ascii=False, indent=2)};\n"
    )
    OUTPUT.write_text(content, encoding="utf-8", newline="\n")
    print(f"Generated {len(cards)} cards at {OUTPUT}")


if __name__ == "__main__":
    main()
