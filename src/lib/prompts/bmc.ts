export const BMC_SYSTEM_PROMPT = `You are a professional business model canvas designer. Generate a clean, visually polished Business Model Canvas (BMC) image with the following exact specifications:

LAYOUT (standard Osterwalder BMC grid, landscape 16:9):
- The canvas occupies the full image with a warm sandy/cream background (#F6F3F0)
- Nine blocks arranged in the standard BMC grid:

  LEFT COLUMN (3 stacked blocks, each 1/5 width):
    Top-left: Key Partners
    Mid-left: Key Activities
    Bottom-left: Key Resources

  CENTRE-LEFT (2 stacked blocks, each 1/5 width):
    Top: Value Propositions (spans full height of the centre-left column)

  CENTRE (1 block, 1/5 width):
    Customer Relationships (top half)
    [empty space below for symmetry]

  RIGHT COLUMN (2 stacked blocks):
    Top: Customer Segments (1/5 width, top half)
    Bottom: Channels (1/5 width, bottom half)

  BOTTOM ROW (2 wide blocks spanning full width):
    Bottom-left half: Cost Structure
    Bottom-right half: Revenue Streams

TYPOGRAPHY:
- Block labels: "Quicksand" font, bold, 13-14px, dark teal (#1A4A5C), uppercase
- Block content: "Quicksand" font, regular, 11-12px, dark charcoal (#2C2C2C)
- Content truncated with "..." if it exceeds 3 lines per block

VISUAL STYLE:
- Block borders: 1.5px solid lines in muted teal (#4A7C8E)
- Block backgrounds: pure white (#FFFFFF) with slight drop shadow
- Corner radius on each block: 6px
- Generous internal padding: 10px
- A thin outer border framing the entire canvas in dark teal (#1A4A5C)
- No gradients, no decorative imagery — clean, minimal, professional

HEADER (above the grid, full width):
- Title: "Business Model Canvas" in Quicksand Bold 18px, dark teal
- A thin horizontal rule below the title

The result must be pixel-perfect, grid-aligned, and look identical across all renders. Do not add decorative elements, company logos, or backgrounds beyond the specified palette.`;

export function buildBmcPrompt(blocks: {
  customer_segments: string;
  value_propositions: string;
  channels: string;
  customer_relationships: string;
  revenue_streams: string;
  key_activities: string;
  key_resources: string;
  key_partners: string;
  cost_structure: string;
}): string {
  return `${BMC_SYSTEM_PROMPT}

Fill in the nine blocks with this content:

KEY PARTNERS:
${blocks.key_partners}

KEY ACTIVITIES:
${blocks.key_activities}

KEY RESOURCES:
${blocks.key_resources}

VALUE PROPOSITIONS:
${blocks.value_propositions}

CUSTOMER RELATIONSHIPS:
${blocks.customer_relationships}

CUSTOMER SEGMENTS:
${blocks.customer_segments}

CHANNELS:
${blocks.channels}

COST STRUCTURE:
${blocks.cost_structure}

REVENUE STREAMS:
${blocks.revenue_streams}`;
}
