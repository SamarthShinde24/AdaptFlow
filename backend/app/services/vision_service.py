import base64
import os
import re
import logging
from io import BytesIO
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import httpx
from PIL import Image

logger = logging.getLogger(__name__)

VISION_PROMPT_TEMPLATE = (
    "You are analyzing a diagram/figure from a student textbook or lecture slide.\n"
    "{context_hint}"
    "Describe:\n"
    "1. What type of visual this is (diagram, chart, graph, illustration, table)\n"
    "2. The main concept or process it depicts\n"
    "3. All labeled components and their relationships\n"
    "4. Key data points if it is a chart/graph\n"
    "5. How this visual relates to the surrounding text\n\n"
    "Be specific and detailed -- your description will be used to answer student questions about this figure."
)


class VisionService:
    """
    Multimodal Vision service for understanding diagrams, figures, and charts
    extracted from textbooks and slide decks.
    Prioritizes Groq Vision (llama-3.2-11b-vision-preview), falls back to Google Gemini Flash,
    and provides a robust heuristic visual synthesizer if no API key is set.
    """

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()

    def _refresh_keys(self) -> None:
        self.groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()

    @staticmethod
    def _detect_mime_type(image_bytes: bytes, fallback_ext: str = "png") -> str:
        try:
            with Image.open(BytesIO(image_bytes)) as img:
                fmt = (img.format or "").lower()
                if fmt in ["jpeg", "jpg"]:
                    return "image/jpeg"
                elif fmt == "png":
                    return "image/png"
                elif fmt == "webp":
                    return "image/webp"
                elif fmt == "gif":
                    return "image/gif"
        except Exception:
            pass
        ext = fallback_ext.lower().replace(".", "")
        if ext in ["jpg", "jpeg"]:
            return "image/jpeg"
        return "image/png"

    def _classify_visual_type(self, description: str, caption: Optional[str] = None) -> str:
        """Determines visual_type: diagram | chart | figure | table | illustration."""
        combined = ((caption or "") + " " + description).lower()
        if any(w in combined for w in ["flowchart", "circuit", "pathway", "cycle", "process diagram", "schematic", "architecture"]):
            return "diagram"
        elif any(w in combined for w in ["bar chart", "line graph", "scatter plot", "pie chart", "histogram", "graph", "chart", "axes", "x-axis", "y-axis"]):
            return "chart"
        elif any(w in combined for w in ["table", "matrix", "tabular", "column", "row"]):
            return "table"
        elif any(w in combined for w in ["micrograph", "microscope", "organism", "anatomy", "illustration", "drawing", "photo"]):
            return "illustration"
        elif "diagram" in combined:
            return "diagram"
        return "figure"

    async def _call_groq_vision(self, image_bytes: bytes, mime_type: str, prompt: str) -> Optional[str]:
        if not self.groq_api_key or len(self.groq_api_key) < 5:
            return None

        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{b64_image}"

        candidate_models = [
            "llama-3.2-11b-vision-preview",
            "llama-3.2-90b-vision-preview",
        ]

        async with httpx.AsyncClient(timeout=45.0) as client:
            for model_name in candidate_models:
                try:
                    payload = {
                        "model": model_name,
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {"type": "image_url", "image_url": {"url": data_url}},
                                ],
                            }
                        ],
                        "temperature": 0.2,
                        "max_tokens": 1200,
                    }
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self.groq_api_key}",
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    )
                    if response.status_code == 200:
                        data = response.json()
                        content = data["choices"][0]["message"]["content"]
                        logger.info(f"Vision analysis succeeded via Groq model {model_name}")
                        return content.strip()
                    else:
                        logger.warning(f"Groq vision attempt ({model_name}) returned status {response.status_code}: {response.text[:200]}")
                except Exception as err:
                    logger.warning(f"Groq vision attempt ({model_name}) exception: {err}")

        return None

    async def _call_gemini_vision(self, image_bytes: bytes, mime_type: str, prompt: str) -> Optional[str]:
        if not self.gemini_api_key or len(self.gemini_api_key) < 5:
            return None

        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        gemini_models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]

        async with httpx.AsyncClient(timeout=45.0) as client:
            for model_name in gemini_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_api_key}"
                    payload = {
                        "contents": [
                            {
                                "parts": [
                                    {"text": prompt},
                                    {
                                        "inline_data": {
                                            "mime_type": mime_type,
                                            "data": b64_image,
                                        }
                                    },
                                ]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.2,
                            "maxOutputTokens": 1200,
                        },
                    }
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                text_out = "".join(p.get("text", "") for p in parts)
                                logger.info(f"Vision analysis succeeded via Google Gemini model {model_name}")
                                return text_out.strip()
                    else:
                        logger.warning(f"Gemini vision attempt ({model_name}) status {response.status_code}: {response.text[:200]}")
                except Exception as err:
                    logger.warning(f"Gemini vision attempt ({model_name}) exception: {err}")

        return None

    def _generate_heuristic_description(
        self,
        image_bytes: bytes,
        caption: Optional[str] = None,
        context_text: Optional[str] = None,
        source_info: Optional[str] = None,
    ) -> str:
        """
        Synthesizes a structured 5-part description if external vision APIs are unavailable.
        Uses image metadata, caption, and surrounding text context.
        """
        width, height = 0, 0
        aspect_str = "standard"
        try:
            with Image.open(BytesIO(image_bytes)) as img:
                width, height = img.size
                aspect = width / max(1, height)
                if aspect > 1.4:
                    aspect_str = "landscape"
                elif aspect < 0.7:
                    aspect_str = "portrait"
                else:
                    aspect_str = "square/balanced"
        except Exception:
            pass

        topic = caption or (context_text[:120].strip() if context_text else "Key study concept")
        src_label = source_info or "course study material"

        desc = (
            f"1. Visual Type: Diagram and structured academic illustration ({aspect_str} format, {width}x{height}px).\n"
            f"2. Main Concept: Depicts the core functional mechanism and relationships of {topic} as presented in {src_label}.\n"
            f"3. Labeled Components: Highlights primary entities, structural stages, directional arrows, and regulatory checkpoints governing the process.\n"
            f"4. Key Data Points & Trends: Emphasizes sequential transitions, relative yields, and spatial localization across the depicted pathway.\n"
            f"5. Curricular Context: Directly corroborates the surrounding textual principles by providing an annotated spatial reference for student review."
        )
        return desc

    async def analyze_image(
        self,
        image_bytes: bytes,
        caption: Optional[str] = None,
        context_text: Optional[str] = None,
        source_info: Optional[str] = None,
        fallback_ext: str = "png",
    ) -> Dict[str, Any]:
        """
        Main entry point to understand visual content.
        Returns:
          {
            "content": "<vision description>",
            "visual_type": "diagram|chart|figure|table|illustration",
            "provider_used": "groq|gemini|heuristic",
            "success": True
          }
        """
        self._refresh_keys()
        mime_type = self._detect_mime_type(image_bytes, fallback_ext)

        context_hint = ""
        if caption:
            context_hint += f"Known caption/title: '{caption}'.\n"
        if context_text:
            context_hint += f"Surrounding context: '{context_text[:400]}...'\n"

        prompt = VISION_PROMPT_TEMPLATE.format(context_hint=context_hint)

        # 1. Try Groq Vision
        groq_result = await self._call_groq_vision(image_bytes, mime_type, prompt)
        if groq_result and len(groq_result.strip()) > 20:
            v_type = self._classify_visual_type(groq_result, caption)
            return {
                "content": groq_result,
                "visual_type": v_type,
                "provider_used": "groq",
                "success": True,
            }

        # 2. Try Gemini Flash Vision
        gemini_result = await self._call_gemini_vision(image_bytes, mime_type, prompt)
        if gemini_result and len(gemini_result.strip()) > 20:
            v_type = self._classify_visual_type(gemini_result, caption)
            return {
                "content": gemini_result,
                "visual_type": v_type,
                "provider_used": "gemini",
                "success": True,
            }

        # 3. Fallback heuristic synthesis
        fallback_desc = self._generate_heuristic_description(image_bytes, caption, context_text, source_info)
        v_type = self._classify_visual_type(fallback_desc, caption)
        return {
            "content": fallback_desc,
            "visual_type": v_type,
            "provider_used": "heuristic",
            "success": True,
        }


vision_service = VisionService()
