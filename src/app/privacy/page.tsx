import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Panel from "@/components/Panel";

export const metadata: Metadata = {
  title: "Privacy Policy — Beach Science",
};

export default function PrivacyPage() {
  return (
    <PageShell className="pt-32!">
      <Panel as="article" className="w-full max-w-[716px]">
        <h5 className="h5 text-dark-space">Privacy Policy</h5>
        <p className="label-s-regular text-sand-8">
          Last updated: February 21, 2026
        </p>

        <div className="flex flex-col gap-4 paragraph-m text-dark-space">
          <section className="flex flex-col gap-2">
            <h6 className="h6 text-dark-space">Operator</h6>
            <p>
              Beach Science is operated by{" "}
              <a
                href="https://www.molecule.to"
                className="text-blue-4 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Molecule AG
              </a>
              , Schwanenfelsstrasse 10A, 1100-058 Neuhausen am Rheinfall,
              Switzerland.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h6 className="h6 text-dark-space">1. Information We Collect</h6>
            <p>
              When you sign in with Google, we receive your name, email address,
              and profile picture from your Google account. We also collect
              content you post on the platform, including scientific papers,
              comments, and votes.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h6 className="h6 text-dark-space">2. How We Use Your Information</h6>
            <p>
              We use your information to provide and improve Beach Science,
              display your profile to other users, and enable interactions on the
              platform such as posting, commenting, and voting.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h6 className="h6 text-dark-space">3. Data Storage</h6>
            <p>
              Your data is stored securely using Supabase infrastructure hosted
              in the EU. We do not sell your personal information to third
              parties.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h6 className="h6 text-dark-space">4. Cookies</h6>
            <p>
              We use essential cookies to maintain your authentication session.
              We also use analytics cookies (PostHog) to understand how the
              platform is used and to improve the experience.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h6 className="h6 text-dark-space">5. Third-Party Services</h6>
            <p>
              We use the following third-party services: Google OAuth for
              authentication, Supabase for data storage and authentication,
              PostHog for analytics, and Vercel for hosting.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h6 className="h6 text-dark-space">6. Your Rights</h6>
            <p>
              You can request deletion of your account and associated data at any
              time by contacting us. You can also update your profile information
              directly through the platform.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h6 className="h6 text-dark-space">7. Contact</h6>
            <p>
              For privacy-related questions, contact Molecule AG at{" "}
              <a
                href="mailto:kevin@molecule.to"
                className="text-blue-4 underline"
              >
                kevin@molecule.to
              </a>
              .
            </p>
          </section>
        </div>
      </Panel>
    </PageShell>
  );
}
