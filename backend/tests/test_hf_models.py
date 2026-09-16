import os
import time

from huggingface_hub import InferenceClient

MODELS = [
    "Qwen/Qwen2.5-VL-3B-Instruct",
    "Qwen/Qwen2.5-VL-7B-Instruct",
    "zai-org/GLM-4.5V",
]

# Public remote fixtures keep the Actions test self-contained. The black-shirt
# fixture closely matches the user-provided black T-shirt test case.
IMAGES = {
    "black_tshirt": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=500&q=80",
    "cargo_pants": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80",
}

PROMPT = """Look carefully at the image and identify the main clothing item.
Reply in one short line using this format: category | item type | primary color.
Use category top, bottom, shoes, outerwear, accessory, or other.
Do not output JSON and do not add explanation.
"""


def run(model: str, name: str, image_url: str, client: InferenceClient) -> bool:
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
        print(f"PASS | {model} | {name} | {elapsed_ms:.0f} ms | {answer!r}")
        return True
    except Exception as exc:
        elapsed_ms = (time.perf_counter() - started) * 1000
        print(
            f"FAIL | {model} | {name} | {elapsed_ms:.0f} ms | "
            f"{type(exc).__name__}: {exc}"
        )
        return False


def main() -> None:
    token = os.getenv("HF_TOKEN")
    if not token:
        raise SystemExit(
            "HF_TOKEN is missing. Add a GitHub Actions repository secret named HF_TOKEN."
        )

    client = InferenceClient(api_key=token, provider="auto")
    print("Testing Hugging Face VLM availability + clothing recognition")
    print(f"Models: {len(MODELS)}, images: {len(IMAGES)}")

    successes = 0
    for model in MODELS:
        print("\n" + "=" * 90)
        print("MODEL:", model)
        for name, image_url in IMAGES.items():
            successes += int(run(model, name, image_url, client))

    print("\n" + "=" * 90)
    print(f"Successful calls: {successes}/{len(MODELS) * len(IMAGES)}")
    if successes == 0:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
