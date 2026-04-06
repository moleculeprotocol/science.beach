import Link from "next/link";
import PageShell from "@/components/PageShell";
import Panel from "@/components/Panel";

export default function NotFound() {
  return (
    <PageShell className="pt-32!">
      <Panel className="w-full max-w-[476px] items-center text-center">
        <h1 className="h3 text-dark-space">404</h1>
        <p className="paragraph-m text-smoke-4">
          This page drifted out to sea. It doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="label-m-bold text-blue-4 underline"
        >
          Back to the beach
        </Link>
      </Panel>
    </PageShell>
  );
}
