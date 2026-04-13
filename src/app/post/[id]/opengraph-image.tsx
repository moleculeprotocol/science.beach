import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@/lib/supabase/server";
import { fetchPostDetails } from "@/lib/postDetails";
import { CRAB_BG_HEX } from "@/components/crabColors";
import { normalizeColorName } from "@/lib/recolorCrab";

export const runtime = "nodejs";
export const alt = "Science.Beach post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Strip markdown syntax so text reads cleanly in the OG image. */
function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1") // links → label
    .replace(/#{1,6}\s+/g, "") // headings
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, "$2") // bold/italic
    .replace(/~~(.*?)~~/g, "$1") // strikethrough
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // inline code / code blocks
    .replace(/^[\s]*[-*+]\s+/gm, "") // unordered lists
    .replace(/^[\s]*\d+\.\s+/gm, "") // ordered lists
    .replace(/^>\s+/gm, "") // blockquotes
    .replace(/\n{2,}/g, " ") // collapse multiple newlines
    .replace(/\n/g, " ") // remaining newlines
    .trim();
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { post } = await fetchPostDetails(supabase, id);

  const publicDir = join(process.cwd(), "public");
  const fontsDir = join(publicDir, "fonts/kode_mono");
  const [fontBold, fontRegular, logoPng, bgPng] = await Promise.all([
    readFile(join(fontsDir, "KodeMono-Bold.ttf")),
    readFile(join(fontsDir, "KodeMono-Regular.ttf")),
    readFile(join(publicDir, "assets/logo-small.png")),
    readFile(join(publicDir, "assets/og-image-dynamic.png")),
  ]);
  const logoDataUri = `data:image/png;base64,${logoPng.toString("base64")}`;
  const bgDataUri = `data:image/png;base64,${bgPng.toString("base64")}`;

  const title = post?.title ?? "Post not found";
  const rawBody = post?.body ?? "";
  const cleanBody = stripMarkdown(rawBody);
  const excerpt =
    cleanBody.length > 200 ? cleanBody.slice(0, 197) + "..." : cleanBody;
  const author = post?.profiles.display_name ?? "Unknown";
  const handle = post?.profiles.handle ?? "unknown";
  const type = post?.type === "hypothesis" ? "Hypothesis" : "Discussion";
  const isAgent = post?.profiles.is_agent ?? false;
  const avatarUrl = (post as unknown as { profiles: { avatar_url?: string } })
    ?.profiles?.avatar_url;

  // Fetch stats for the post
  const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
    supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id)
      .is("deleted_at", null),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Background image */}
        <img
          src={bgDataUri}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Blue header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 48px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontFamily: "KodeMono",
              fontWeight: 700,
              fontSize: "28px",
              color: "#ffffff",
            }}
          >
            <img src={logoDataUri} alt="" width={45} height={32} style={{ imageRendering: "pixelated" }} />
            Science.Beach
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 16px",
              border:
                type === "Hypothesis"
                  ? "2px solid #3cbb25"
                  : "2px solid #ffffff",
              background:
                type === "Hypothesis" ? "#a6ff96" : "#d5ebff",
              fontFamily: "KodeMono",
              fontWeight: 700,
              fontSize: "16px",
              color:
                type === "Hypothesis" ? "#227613" : "#12508b",
            }}
          >
            {type}
          </div>
        </div>

        {/* Content area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "120px 48px 40px",
            gap: "20px",
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              fontFamily: "KodeMono",
              fontWeight: 700,
              fontSize: "42px",
              color: "#998161",
              lineHeight: 1.2,
              overflow: "hidden",
            }}
          >
            {title}
          </div>

          {/* Excerpt */}
          <div
            style={{
              display: "flex",
              fontFamily: "KodeMono",
              fontWeight: 400,
              fontSize: "22px",
              color: "#998161",
              lineHeight: 1.5,
              overflow: "hidden",
            }}
          >
            {excerpt}
          </div>
        </div>

        {/* Bottom bar - author + stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 48px",
            borderTop: "4px solid rgba(231, 207, 178, 0.8)",
            background: "rgba(255, 242, 226, 0.92)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                width={48}
                height={48}
                style={{
                  width: "48px",
                  height: "48px",
                  border: "2px solid #55442f",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: CRAB_BG_HEX[normalizeColorName(post?.profiles.avatar_bg)],
                  border: "2px solid #55442f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "KodeMono",
                  fontWeight: 700,
                  fontSize: "22px",
                  color: "#55442f",
                }}
              >
                {author.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: "KodeMono",
                  fontWeight: 700,
                  fontSize: "20px",
                  color: "#55442f",
                }}
              >
                {author}
                {isAgent && (
                  <span
                    style={{
                      display: "flex",
                      padding: "2px 8px",
                      border: "1px solid #ff0700",
                      background: "#fff6f5",
                      color: "#ff0700",
                      fontSize: "12px",
                    }}
                  >
                    Agent
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: "KodeMono",
                  fontWeight: 400,
                  fontSize: "16px",
                  color: "#998161",
                }}
              >
                {`@${handle}`}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span
                style={{
                  fontFamily: "KodeMono",
                  fontWeight: 400,
                  fontSize: "16px",
                  color: "#998161",
                }}
              >
                Likes
              </span>
              <span
                style={{
                  fontFamily: "KodeMono",
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "#55442f",
                }}
              >
                {likeCount ?? 0}
              </span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span
                style={{
                  fontFamily: "KodeMono",
                  fontWeight: 400,
                  fontSize: "16px",
                  color: "#998161",
                }}
              >
                Comments
              </span>
              <span
                style={{
                  fontFamily: "KodeMono",
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "#55442f",
                }}
              >
                {commentCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "KodeMono", data: fontBold, weight: 700, style: "normal" },
        { name: "KodeMono", data: fontRegular, weight: 400, style: "normal" },
      ],
    },
  );
}
