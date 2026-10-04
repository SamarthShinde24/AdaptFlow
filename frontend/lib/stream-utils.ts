/**
 * AdaptFlow Stream Assembly & Prose Normalization Utility
 *
 * Handles SSE streaming delta assembly and continuous prose paragraph formatting.
 * Eliminates unintended single-word-per-line wrapping caused by tokenization or
 * fragmented PDF extracts while preserving intentional markdown line breaks
 * (numbered lists, bullet points, headings, code blocks, and paragraph spacing).
 */

/**
 * Detects whether the upcoming text starts with an intentional line break
 * (e.g., numbered list, bullet list, markdown heading, blockquote, or code fence).
 */
export function isIntentionalBreak(upcomingText: string): boolean {
  const trimmed = upcomingText.trimStart();
  if (!trimmed) return false;

  // Numbered or lettered list markers: "1.", "1. ", "2)", "(1)", "a."
  if (/^(\d+[\.\)]|\([0-9a-zA-Z]+\)|[a-zA-Z][\.\)])(\s+|$)/.test(trimmed)) {
    return true;
  }

  // Bullet list markers: "- ", "* ", "+ ", "• ", "◦ ", "▪ ", "▫ "
  if (/^[-*+•◦▪▫](\s+|$)/.test(trimmed)) {
    return true;
  }

  // Markdown headings: "# ", "## ", "### ", etc.
  if (/^#{1,6}(\s+|$)/.test(trimmed)) {
    return true;
  }

  // Blockquote or code fence
  if (/^(>|```)/.test(trimmed)) {
    return true;
  }

  // Table row starting with pipe
  if (/^\|/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Stateful assembler for streaming SSE chunks.
 * Buffers and normalizes tokens on the fly so AI streaming appears
 * as continuous, smooth prose rather than jittery word-per-line jumps.
 */
export class StreamAssembler {
  private accumulated = "";
  private pendingNewlines = 0;
  private hasTrailingSpace = false;

  /**
   * Ingests an incoming raw delta token and returns the normalized text to emit.
   */
  public ingest(chunk: string): string {
    if (!chunk) return "";

    // Standardize carriage returns
    const cleanChunk = chunk.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    let emitted = "";
    let i = 0;

    while (i < cleanChunk.length) {
      const char = cleanChunk[i];

      if (char === "\n") {
        this.pendingNewlines++;
        i++;
        continue;
      }

      if (char === " " || char === "\t") {
        // Discard spaces immediately adjacent to newlines (e.g. "\n \n")
        if (this.pendingNewlines > 0) {
          i++;
          continue;
        }
        this.hasTrailingSpace = true;
        i++;
        continue;
      }

      // Reached non-whitespace character
      const remaining = cleanChunk.slice(i);

      if (this.pendingNewlines > 0) {
        const isIntentional = isIntentionalBreak(remaining);
        const prevText = this.accumulated.trimEnd();
        const lastWord = prevText.split(/\s+/).pop() || "";
        const isPrevOrphanMarker = /^(\d+[\.\)]|\([0-9a-zA-Z]+\)|[-*+•◦▪▫]|[a-zA-Z][\.\)])$/.test(lastWord);
        const prevEndsWithPunct = /[.:!?]$/.test(prevText) || /[.:!?]["']$/.test(prevText);
        const startsWithUpper = /^[A-Z]/.test(remaining.trimStart());
        const prevWordCount = prevText.split(/\s+/).filter(Boolean).length;

        if (isPrevOrphanMarker) {
          // If the last accumulated token was an orphan list marker like "1.",
          // connect with a space rather than a newline (e.g. "1. First")
          if (
            this.accumulated.length > 0 &&
            !this.accumulated.endsWith(" ") &&
            !this.accumulated.endsWith("\n")
          ) {
            emitted += " ";
            this.accumulated += " ";
          }
        } else if (isIntentional) {
          // Intentional list item or header
          const nl = this.pendingNewlines >= 2 ? "\n\n" : "\n";
          emitted += nl;
          this.accumulated += nl;
        } else if (this.pendingNewlines >= 2 && prevEndsWithPunct && startsWithUpper && prevWordCount >= 5) {
          // Legitimate paragraph break between full sentences
          emitted += "\n\n";
          this.accumulated += "\n\n";
        } else {
          // Unintended single-word wrapping or accidental newline
          if (
            this.accumulated.length > 0 &&
            !this.accumulated.endsWith(" ") &&
            !this.accumulated.endsWith("\n")
          ) {
            emitted += " ";
            this.accumulated += " ";
          }
        }

        this.pendingNewlines = 0;
        this.hasTrailingSpace = false;
      } else if (this.hasTrailingSpace) {
        if (
          this.accumulated.length > 0 &&
          !this.accumulated.endsWith(" ") &&
          !this.accumulated.endsWith("\n")
        ) {
          emitted += " ";
          this.accumulated += " ";
        }
        this.hasTrailingSpace = false;
      }

      // Consume contiguous non-whitespace characters
      let nextWs = cleanChunk.slice(i).search(/[\s\n]/);
      let textSegment = "";
      if (nextWs === -1) {
        textSegment = cleanChunk.slice(i);
        i = cleanChunk.length;
      } else {
        textSegment = cleanChunk.slice(i, i + nextWs);
        i += nextWs;
      }

      emitted += textSegment;
      this.accumulated += textSegment;
    }

    return emitted;
  }

  /**
   * Flushes any remaining whitespace when the stream completes.
   */
  public flush(): string {
    let finalEmission = "";
    if (this.pendingNewlines >= 2) {
      finalEmission = "\n\n";
    }
    this.pendingNewlines = 0;
    this.hasTrailingSpace = false;
    return finalEmission;
  }

  /**
   * Returns the complete accumulated text so far.
   */
  public getAccumulatedText(): string {
    return this.accumulated;
  }

  /**
   * Resets internal assembler state.
   */
  public reset(): void {
    this.accumulated = "";
    this.pendingNewlines = 0;
    this.hasTrailingSpace = false;
  }
}

/**
 * Normalizes chat message text so it renders as continuous prose paragraphs.
 * Heals single-word-per-line wrapping from PDF extractions or tokenizer artifacts
 * while preserving intentional lists (1., •, -), markdown headers (#), quotes (>),
 * code fences, and paragraph breaks.
 */
export function normalizeChatProse(text: string): string {
  if (!text) return "";

  // 1. Standardize line endings
  let normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Separate concatenated table rows: "||" -> "|\n|"
  normalized = normalized.replace(/\|\|/g, "|\n|");

  // 3. Collapse intra-line tabs and multiple spaces, keeping newlines
  normalized = normalized.replace(/[ \t]+/g, " ");

  // 4. Pre-pass: Re-attach orphan list markers (e.g. "1.\n" or "●\n") to the following line
  const lines = normalized.split("\n").map((l) => l.trim());
  const preMerged: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      preMerged.push("");
      continue;
    }

    // Check if line is just an orphan list number or bullet like "1.", "2)", "●", "-"
    if (/^(\d+[\.\)]|\([0-9a-zA-Z]+\)|[-*+•◦▪▫]|[a-zA-Z][\.\)])$/.test(line)) {
      let nextIdx = i + 1;
      while (nextIdx < lines.length && !lines[nextIdx]) {
        nextIdx++;
      }
      if (nextIdx < lines.length) {
        lines[nextIdx] = line + " " + lines[nextIdx];
        continue;
      }
    }

    preMerged.push(line);
  }

  // 5. Group lines into paragraphs and list blocks
  const resultBlocks: string[] = [];
  let currentBlock = "";
  let emptyLinesBefore = 0;

  for (let i = 0; i < preMerged.length; i++) {
    const line = preMerged[i];

    if (!line) {
      emptyLinesBefore++;
      continue;
    }

    if (!currentBlock) {
      currentBlock = line;
      emptyLinesBefore = 0;
      continue;
    }

    // Determine if next line is an intentional list item, heading, or table row
    const nextIsListMarker = /^(\d+[\.\)]|\([0-9a-zA-Z]+\)|[-*+•◦▪▫]|[a-zA-Z][\.\)])\s+/.test(line);
    const nextIsHeadingOrSpecial = /^(#{1,6}|>|```)\s*/.test(line);
    const nextIsTable = /^\|.*\|$/.test(line);

    // Current block properties
    const prevWords = currentBlock.split(/\s+/).filter(Boolean);
    const prevEndsWithPunct = /[.:!?]$/.test(currentBlock) || /[.:!?]["']$/.test(currentBlock);
    const prevIsListMarker = /^(\d+[\.\)]|\([0-9a-zA-Z]+\)|[-*+•◦▪▫]|[a-zA-Z][\.\)])\s+/.test(currentBlock);
    const prevIsTable = /^\|.*\|$/.test(currentBlock);
    const nextStartsWithLower = /^[a-z]/.test(line);

    if (nextIsListMarker || nextIsHeadingOrSpecial || (nextIsTable && !prevIsTable) || (prevIsTable && nextIsTable)) {
      // Intentional break: commit current block and start new
      resultBlocks.push(currentBlock);
      currentBlock = line;
      emptyLinesBefore = 0;
      continue;
    }

    // Check if this is a genuine paragraph break (blank line between sentences or after list)
    // vs continuous prose or unintended single-word line wrapping
    const isGenuineParagraphBreak =
      emptyLinesBefore >= 1 &&
      !nextStartsWithLower &&
      ((prevEndsWithPunct && prevWords.length >= 4) || prevIsListMarker);

    if (isGenuineParagraphBreak) {
      resultBlocks.push(currentBlock);
      currentBlock = line;
    } else {
      // Continuous prose: join with space (or no space if joining with punctuation)
      if (/^[.,!?;:]/.test(line)) {
        currentBlock += line;
      } else {
        currentBlock += " " + line;
      }
    }

    emptyLinesBefore = 0;
  }

  if (currentBlock) {
    resultBlocks.push(currentBlock);
  }

  // 6. Format blocks:
  // Consecutive list items get single newline "\n"
  // Paragraphs get double newline "\n\n"
  let output = "";
  for (let i = 0; i < resultBlocks.length; i++) {
    const block = resultBlocks[i];
    if (i === 0) {
      output += block;
      continue;
    }

    const prevBlock = resultBlocks[i - 1];
    const isPrevList = /^(\d+[\.\)]|\([0-9a-zA-Z]+\)|[-*+•◦▪▫]|[a-zA-Z][\.\)])\s+/.test(prevBlock);
    const isCurrList = /^(\d+[\.\)]|\([0-9a-zA-Z]+\)|[-*+•◦▪▫]|[a-zA-Z][\.\)])\s+/.test(block);

    if (isPrevList && isCurrList) {
      output += "\n" + block;
    } else {
      output += "\n\n" + block;
    }
  }

  return output;
}
