import os
import time

from groq import Groq
from huggingface_hub import InferenceClient

IMAGES = {
    "black_tshirt": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=500&q=80",
    "cargo_pants": "https://images.unsplash.com/photo-1511794322962-129ddbd0af38?auto=format&fit=crop&w=700&q=80",
}

PROMPT = """Look carefully at the image and identify the main clothing item.
Reply in one short line using this format: category | item type | primary color.
Use category top, bottom, shoes, outerwear, accessory, or other.
Do not output JSON and do not add explanation.
"""

GROQ_MODELS = [
    "qwen/qwen3.6-27b",
    "qwen/qwen3.8-27b",
]

HF_MODELS = [
    "Qwen/Qwen2.5-VL-3B-Instruct",
    "Qwen/Qwen2.5-VL-7B-Instruct",
    "zai-org/GLM-4.5V",
]


def run_groq(model: str, name: str, image_url: str, client: Groq) -> bool:
    started = time.perf_counter()
    try:
        out = client.chat.completions.create(
            model=model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }],
            temperature=0,
            max_completion_tokens=80,
        )
        elapsed_ms = (time.perf_counter() - started) * 1000
        answer = out.choices[0].message.content
        print(f"PASS | GROQ | {model} | {name} | {elapsed_ms:.0f} ms | {answer!r}")
        return True
    except Exception as exc:
        elapsed_ms = (time.perf_counter() - started) * 1000
        print(f"FAIL | GROQ | {model} | {name} | {elapsed_ms:.0f} ms | {type(exc).__name__}: {exc}")
        return False


def run_hf(model: str, name: str, image_url: str, client: InferenceClient) -> bool:
    started = time.perf_counter()
    try:
        out = client.chat.completions.create(
            model=model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }],
            max_tokens=80,
            temperature=0,
        )
        elapsed_ms = (time.perf_counter() - started) * 1000
        answer = out.choices[0].message.content
        print(f"PASS | HF | {model} | {name} | {elapsed_ms:.0f} ms | {answer!r}")
        return True
    except Exception as exc:
        elapsed_ms = (time.perf_counter() - started) * 1000
        print(f"FAIL | HF | {model} | {name} | {elapsed_ms:.0f} ms | {type(exc).__name__}: {exc}")
        return False


def main() -> None:
    groq_key = os.getenv("Groq_API")
    hf_token = os.getenv("HF_TOKEN")

    if not groq_key and not hf_token:
        raise SystemExit("Neither Groq_API nor HF_TOKEN is configured")

    successes = 0
    total = 0

    if groq_key:
        groq_client = Groq(api_key=groq_key)
        print("\n=== GROQ VISION TESTS ===")
        for model in GROQ_MODELS:
            for name, image_url in IMAGES.items():
                total += 1
                successes += int(run_groq(model, name, image_url, groq_client))
    else:
        print("SKIP | GROQ | Groq_API secret not configured")

    if hf_token:
        hf_client = InferenceClient(api_key=hf_token, provider="auto")
        print("\n=== HUGGING FACE VISION TESTS ===")
        for model in HF_MODELS:
            for name, image_url in IMAGES.items():
                total += 1
                successes += int(run_hf(model, name, image_url, hf_client))
    else:
        print("SKIP | HF | HF_TOKEN secret not configured")

    print("\n=== SUMMARY ===")
    print(f"Successful calls: {successes}/{total}")
    if successes == 0:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
