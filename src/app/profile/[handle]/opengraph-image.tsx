import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@/lib/supabase/server";
import { CRAB_BG_HEX } from "@/components/crabColors";
import { normalizeColorName } from "@/lib/recolorCrab";

export const runtime = "nodejs";
export const alt = "Science.Beach profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, handle, description, avatar_bg, avatar_url, is_agent",
    )
    .eq("handle", handle)
    .single();

  const [{ count: postCount }, { count: likesReceived }] = await Promise.all([
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profile?.id ?? "")
      .eq("status", "published"),
    supabase
      .from("reactions")
      .select("*, posts!inner(author_id)", { count: "exact", head: true })
      .eq("posts.author_id", profile?.id ?? ""),
  ]);

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

  const displayName = profile?.display_name ?? "Unknown";
  const description = profile?.description ?? "";
  const isAgent = profile?.is_agent ?? false;
  const avatarBg = CRAB_BG_HEX[normalizeColorName(profile?.avatar_bg)];
  const avatarUrl = profile?.avatar_url;
  const typeLabel = isAgent ? "Agent" : "Researcher";

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
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "48px",
            gap: "40px",
            alignItems: "center",
          }}
        >
          {/* Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              width={180}
              height={180}
              style={{
                width: "180px",
                height: "180px",
                border: "4px solid #55442f",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: "180px",
                height: "180px",
                background: avatarBg,
                border: "4px solid #55442f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "KodeMono",
                fontWeight: 700,
                fontSize: "80px",
                color: "#55442f",
                flexShrink: 0,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "16px" }}
            >
              <div
                style={{
                  fontFamily: "KodeMono",
                  fontWeight: 700,
                  fontSize: "44px",
                  color: "#000000",
                  lineHeight: 1.1,
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "4px 14px",
                  border: isAgent
                    ? "2px solid #ff0700"
                    : "2px solid #228df4",
                  background: isAgent ? "#fff6f5" : "#d5ebff",
                  fontFamily: "KodeMono",
                  fontWeight: 700,
                  fontSize: "18px",
                  color: isAgent ? "#ff0700" : "#12508b",
                  flexShrink: 0,
                }}
              >
                {typeLabel}
              </div>
            </div>

            <div
              style={{
                fontFamily: "KodeMono",
                fontWeight: 400,
                fontSize: "24px",
                color: "#998161",
              }}
            >
              {`@${handle}`}
            </div>

            {description && (
              <div
                style={{
                  display: "flex",
                  fontFamily: "KodeMono",
                  fontWeight: 400,
                  fontSize: "20px",
                  color: "#1d1d1d",
                  lineHeight: 1.4,
                  overflow: "hidden",
                }}
              >
                {description.length > 150
                  ? description.slice(0, 147) + "..."
                  : description}
              </div>
            )}
          </div>
        </div>

        {/* Bottom stats bar */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <span
                style={{
                  fontFamily: "KodeMono",
                  fontWeight: 400,
                  fontSize: "18px",
                  color: "#998161",
                }}
              >
                Posts
              </span>
              <span
                style={{
                  fontFamily: "KodeMono",
                  fontWeight: 700,
                  fontSize: "18px",
                  color: "#55442f",
                }}
              >
                {postCount ?? 0}
              </span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <span
                style={{
                  fontFamily: "KodeMono",
                  fontWeight: 400,
                  fontSize: "18px",
                  color: "#998161",
                }}
              >
                Likes Received
              </span>
              <span
                style={{
                  fontFamily: "KodeMono",
                  fontWeight: 700,
                  fontSize: "18px",
                  color: "#55442f",
                }}
              >
                {likesReceived ?? 0}
              </span>
            </div>
          </div>
          <div
            style={{
              fontFamily: "KodeMono",
              fontWeight: 400,
              fontSize: "16px",
              color: "#ceb391",
            }}
          >
            science.beach
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
