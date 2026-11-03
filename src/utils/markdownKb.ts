export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  markdown: string;
  rules: string[];
}

export function parseKnowledgeBaseMarkdown(rawMarkdown: string): KnowledgeArticle[] {
  const articles: KnowledgeArticle[] = [];
  
  // Split on section dividers "---" or top-level headings "# "
  const rawSections = rawMarkdown.split(/\n(?=---\s*\n|\n# [^#])/);

  for (const rawSec of rawSections) {
    const trimmed = rawSec.replace(/^---\s*/m, "").trim();
    if (!trimmed) continue;

    // Match section title: # <Title>
    const titleMatch = trimmed.match(/^#\s+(.+)$/m);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();
    if (title.toLowerCase().includes("enterprise it knowledge base")) {
      // Header section, skip
      continue;
    }

    // Match ID
    const idMatch = trimmed.match(/\*\*ID:\*\*\s*([^\n\r]+)/i);
    const id = idMatch
      ? idMatch[1].trim()
      : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Match Category
    const catMatch = trimmed.match(/\*\*Category:\*\*\s*([^\n\r]+)/i);
    const category = catMatch ? catMatch[1].trim() : "general";

    // Match Keywords
    const kwMatch = trimmed.match(/\*\*Keywords:\*\*\s*([^\n\r]+)/i);
    const keywords = kwMatch
      ? kwMatch[1].split(",").map((k) => k.trim().toLowerCase()).filter(Boolean)
      : [];

    // Extract numbered rules/steps or bullet points under Resolution Steps / Rules / Levels
    const rules: string[] = [];
    const lines = trimmed.split("\n");
    let inRulesSection = false;

    for (const line of lines) {
      const l = line.trim();
      if (
        l.match(/^##\s+(Resolution Steps|Rules|Support Tiers|Escalation Steps|Outage Runbook|Steps)/i)
      ) {
        inRulesSection = true;
        continue;
      } else if (l.startsWith("## ")) {
        inRulesSection = false;
      }

      if (inRulesSection) {
        // match "1. ...", "- **L1**: ...", or "Level L1: ..."
        const stepMatch = l.match(/^(\d+\.\s*|- \*\*[^*]+\*\*:\s*|Level\s+[^:]+:\s*)(.+)$/);
        if (stepMatch) {
          rules.push(l.replace(/^\d+\.\s*/, "").trim());
        }
      }
    }

    // Fallback rules if none parsed under specific header
    if (rules.length === 0) {
      for (const line of lines) {
        const l = line.trim();
        if (l.match(/^\d+\.\s+/)) {
          rules.push(l.replace(/^\d+\.\s*/, "").trim());
        }
      }
    }

    articles.push({
      id,
      title,
      category,
      keywords,
      markdown: trimmed,
      rules: rules.length > 0 ? rules : [trimmed],
    });
  }

  return articles;
}
