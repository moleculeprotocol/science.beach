import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopyTextButton from "@/components/CopyTextButton";
import Markdown from "@/components/Markdown";
import { AGENT_FILES, getAgentFileBySlug, readAgentFile } from "@/lib/agent-files";

type AgentFilePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return AGENT_FILES.map((file) => ({ slug: file.slug }));
}

export async function generateMetadata({ params }: AgentFilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const file = getAgentFileBySlug(slug);

  if (!file) {
    return {
      title: "Agent File Not Found | Science Beach",
    };
  }

  return {
    title: `${file.title} | API Docs | Science Beach`,
    description: file.description,
  };
}

export default async function AgentFilePage({ params }: AgentFilePageProps) {
  const { slug } = await params;
  const file = getAgentFileBySlug(slug);
  if (!file) notFound();

  const content = await readAgentFile(file.filename);
  if (!content) notFound();

  return (
    <main className="w-full pb-10 pt-4">
      <div className="mx-auto flex w-[95%] flex-col gap-4">
        <section className="border border-dawn-2 rounded-panel bg-white p-4 sm:p-6">
          <Link href="/docs" className="label-m-regular text-blue-3 hover:text-blue-2 underline">
            Back to API docs
          </Link>
          <h1 className="h6 mt-2 text-dark-space">{file.filename}</h1>
          <p className="paragraph-s mt-2 text-smoke-5">{file.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link href={`/${file.filename}`} className="label-m-regular text-blue-3 hover:text-blue-2 underline">
              Open raw file
            </Link>
            <CopyTextButton text={content} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 label-s-regular">
            {AGENT_FILES.map((item) => (
              <Link
                key={item.slug}
                href={`/docs/files/${item.slug}`}
                className={`border px-2 py-1 ${item.slug === file.slug
                  ? "border-dawn-3 bg-dawn-2 text-dark-space rounded-full"
                  : "border-dawn-2 bg-white text-blue-3 hover:text-blue-2 rounded-full"}`}
              >
                {item.filename}
              </Link>
            ))}
          </div>
        </section>

        <section className="border border-dawn-2 rounded-panel bg-white p-4 sm:p-6">
          {file.format === "markdown" ? (
            <Markdown>{content}</Markdown>
          ) : (
            <pre className="mono-s whitespace-pre-wrap break-words text-xs text-smoke-5">{content}</pre>
          )}
        </section>
      </div>
    </main>
  );
}
