import re


def clean_text_content(text: str) -> str:
    """
    Normalizes raw extracted text from PDFs, slides, and transcripts.
    Removes artificial line-wraps between words while preserving paragraph breaks,
    numbered lists, bullet points, and section headers.
    """
    if not text:
        return ""

    # 1. Replace CRLF/CR with standard LF
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # 2. Trim spaces surrounding newlines
    text = re.sub(r"[ \t]*\n[ \t]*", "\n", text)

    # 3. Extract non-empty lines
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if not lines:
        return ""

    # 4. Merge isolated bullets/numbers like "1.", "-", "•", "a)" with the following word
    merged_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if i + 1 < len(lines) and re.match(r"^(\d+[\.\)]|[\-\•\*])$", line):
            merged_lines.append(line + " " + lines[i + 1])
            i += 2
        else:
            merged_lines.append(line)
            i += 1

    # 5. Group lines into coherent paragraphs
    cleaned_paragraphs = []
    current_para = []
    for line in merged_lines:
        if current_para:
            prev = current_para[-1]
            is_new_section = bool(re.match(r"^(\d+\.\s+[A-Z]|Chapter|Section|#|\|)", line))
            if prev.endswith(('.', ':', '!', '?', ';')) or is_new_section:
                cleaned_paragraphs.append(" ".join(current_para))
                current_para = [line]
            else:
                current_para.append(line)
        else:
            current_para.append(line)

    if current_para:
        cleaned_paragraphs.append(" ".join(current_para))

    return "\n\n".join(cleaned_paragraphs)
