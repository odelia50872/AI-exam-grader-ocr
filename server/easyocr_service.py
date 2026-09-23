import sys
import os
import json
import base64
import io
import re
from PIL import Image
import numpy as np
import easyocr
import torch

# Ensure UTF-8 output on Windows
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

print("[EasyOCR Service] Initializing EasyOCR Reader (languages=['en'])...", file=sys.stderr, flush=True)
use_gpu = torch.cuda.is_available()
reader = easyocr.Reader(['en'], gpu=use_gpu, verbose=False)
print(f"[EasyOCR Service] EasyOCR Reader ready (GPU={use_gpu}).", file=sys.stderr, flush=True)

def process_page(page):
    page_number = page.get("pageNumber", 1)
    image_b64 = page.get("imageBase64", "")
    existing_text = page.get("text", "")

    page_words = []
    lines_text = []

    if image_b64 and len(image_b64) > 200:
        # Strip data URL prefix if present
        clean_b64 = re.sub(r"^data:[a-zA-Z0-9/.-]+;base64,", "", image_b64)
        image_bytes = base64.b64decode(clean_b64)
        img = Image.open(io.BytesIO(image_bytes))
        img_width, img_height = img.size

        # Convert to RGB numpy array
        img_rgb = np.array(img.convert("RGB"))

        # Run EasyOCR with tuned word-level segmentation parameters
        detections = reader.readtext(
            img_rgb,
            paragraph=False,
            width_ths=0.1,       # Prevents merging words horizontally into single wide line boxes
            link_threshold=0.6,  # Higher threshold avoids linking across whitespace gaps
            mag_ratio=1.5,       # Magnification for sharper handwriting & character boundary detection
            detail=1
        )

        for bbox, text, prob in detections:
            clean_text = text.strip()
            if not clean_text:
                continue

            lines_text.append(clean_text)

            # bbox is [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
            xs = [pt[0] for pt in bbox]
            ys = [pt[1] for pt in bbox]
            min_x = max(0, min(xs))
            max_x = min(img_width, max(xs))
            min_y = max(0, min(ys))
            max_y = min(img_height, max(ys))

            matches = list(re.finditer(r'\S+', text))
            if len(matches) <= 1:
                ymin = max(0, min(1000, round((min_y / img_height) * 1000)))
                xmin = max(0, min(1000, round((min_x / img_width) * 1000)))
                ymax = max(ymin, min(1000, round((max_y / img_height) * 1000)))
                xmax = max(xmin, min(1000, round((max_x / img_width) * 1000)))

                page_words.append({
                    "word": clean_text,
                    "confidence": round(float(prob), 2),
                    "page_number": page_number,
                    "box_2d": [ymin, xmin, ymax, xmax],
                    "isFlaggedMistake": False,
                })
            else:
                total_len = max(1, len(text))
                full_width = max_x - min_x

                for m in matches:
                    w = m.group()
                    start_char = m.start()
                    end_char = m.end()

                    w_min_x = min_x + (full_width * (start_char / total_len))
                    w_max_x = min_x + (full_width * (end_char / total_len))

                    ymin = max(0, min(1000, round((min_y / img_height) * 1000)))
                    xmin = max(0, min(1000, round((w_min_x / img_width) * 1000)))
                    ymax = max(ymin, min(1000, round((max_y / img_height) * 1000)))
                    xmax = max(xmin, min(1000, round((w_max_x / img_width) * 1000)))

                    page_words.append({
                        "word": w,
                        "confidence": round(float(prob), 2),
                        "page_number": page_number,
                        "box_2d": [ymin, xmin, ymax, xmax],
                        "isFlaggedMistake": False,
                    })

    full_page_text = "\n".join(lines_text) if lines_text else existing_text

    # Synthetic fallback if image was not provided or OCR returned empty
    if len(page_words) == 0 and full_page_text:
        tokens = full_page_text.split()
        curr_x = 140
        curr_y = 180
        col_width = 720
        line_height = 44
        img_w = 1200
        img_h = 1550

        for token in tokens:
            w_w = max(30, len(token) * 14)
            if curr_x + w_w > 140 + col_width:
                curr_x = 140
                curr_y += line_height

            ymin = max(0, min(1000, round((curr_y / img_h) * 1000)))
            xmin = max(0, min(1000, round((curr_x / img_w) * 1000)))
            ymax = max(ymin, min(1000, round(((curr_y + 28) / img_h) * 1000)))
            xmax = max(xmin, min(1000, round(((curr_x + w_w) / img_w) * 1000)))

            page_words.append({
                "word": token,
                "confidence": 0.95,
                "page_number": page_number,
                "box_2d": [ymin, xmin, ymax, xmax],
                "isFlaggedMistake": False,
            })
            curr_x += w_w + 12

    return {
        "pageNumber": page_number,
        "text": full_page_text,
        "words": page_words
    }

def main():
    # Ready signal to parent process
    print(json.dumps({"status": "ready"}), flush=True)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            req = json.loads(line)
            req_id = req.get("id")
            pages = req.get("pages", [])

            all_words = []
            pages_transcriptions = []

            for page in pages:
                res = process_page(page)
                all_words.extend(res["words"])
                pages_transcriptions.append({
                    "pageNumber": res["pageNumber"],
                    "text": res["text"]
                })

            transcribed_full_text = "\n\n--- Page Break ---\n\n".join(
                pt["text"] for pt in pages_transcriptions
            )

            response = {
                "id": req_id,
                "success": True,
                "data": {
                    "words": all_words,
                    "transcribedFullText": transcribed_full_text,
                    "pagesTranscriptions": pages_transcriptions,
                }
            }
            print(json.dumps(response, ensure_ascii=False), flush=True)

        except Exception as e:
            print(json.dumps({
                "id": req.get("id") if 'req' in locals() else None,
                "success": False,
                "error": str(e)
            }, ensure_ascii=False), flush=True)

if __name__ == "__main__":
    main()
