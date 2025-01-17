export const extractReplyAndScript = (message) => {
  // Match Title using non-bolded tags
  const titleMatch = message.match(/<TITLE>\s*([\s\S]*?)<\/TITLE>/);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Match Explanation using non-bolded tags
  const explanationMatch = message.match(
    /<EXPLANATION>\s*([\s\S]*?)<\/EXPLANATION>/
  );
  const explanation = explanationMatch ? explanationMatch[1].trim() : null;

  // Match Pine Script Code using <PINESCRIPT> tags
  const scriptMatch = message.match(/<PINESCRIPT>\s*([\s\S]*?)<\/PINESCRIPT>/);
  const script = scriptMatch ? scriptMatch[1].trim() : null;

  // Match Tags using non-bolded tags
  const tagsMatch = message.match(/<TAGS>\s*([\s\S]*?)<\/TAGS>/);
  const tags = tagsMatch
    ? tagsMatch[1].split(",").map((tag) => tag.trim())
    : [];

  return { title, explanation, script, tags };
};

export const generateStructuredPrompt = (message) => {
  return `
    Generate a Pine Script strategy with the following structured format:

    <TITLE>
    Provide a title for the strategy (1 sentence, max 4 words).
    </TITLE>

    <EXPLANATION>
    Explain the strategy briefly. If the user's request is unrelated to Pine Script, respond with: "I specialize in generating Pine Script code for TradingView strategies only."
    </EXPLANATION>

    <PINESCRIPT>
    Provide the full Pine Script code. Ensure the script is complete, well-commented, and uses version 6.
    </PINESCRIPT>

    <TAGS>
    Provide a comma-separated list of tags relevant to the strategy. 
    Examples: Trading, Indicators, Risk Management, Trend Following, Breakout.
    </TAGS>

    **User's Request:**
    "${message}"
    `;
};
