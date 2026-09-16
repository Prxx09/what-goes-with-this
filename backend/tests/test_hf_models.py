import base64
import os
import time
from pathlib import Path

from huggingface_hub import InferenceClient

MODELS = [
    "Qwen/Qwen2.5-VL-3B-Instruct",
    "Qwen/Qwen2.5-VL-7B-Instruct",
    "zai-org/GLM-4.5V",
]

IMAGES = {
    "black_tshirt": Path(__file__).parent / "data" / "black_tshirt.b64",
    "beige_cargo_pants": Path(__file__).parent / "data" / "beige_cargo_pants.b64",
}

PROMPT = """Look carefully at the image and identify the main clothing item.
Reply in one short line using this format: category | item type | primary color.
Use category top, bottom, shoes, outerwear, accessory, or other.
Do not output JSON and do not add explanation.
"""


def run(model: str, name: str, b64_path: Path, client: InferenceClient) -> bool:
    b64 = b64_path.read_text().strip()
    data_url = f"data:image/jpeg;base64,{b64}"
    started = time.perf_counter()
    try:
        out = client.chat.completions.create(
            model=model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {"type": "image_url", "image_url": {"url": data_url}},
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
        for name, path in IMAGES.items():
            successes += int(run(model, name, path, client))

    print("\n" + "=" * 90)
    print(f"Successful calls: {successes}/{len(MODELS) * len(IMAGES)}")

    # Candidate models can legitimately be unavailable through the current
    # provider/account. Fail only if none of the model/image calls work.
    if successes == 0:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
