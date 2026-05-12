import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Job Seekers Hub",
  description: "How Job Seekers Hub collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Legal
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Effective date: April 23, 2026</p>
      </header>

      <article className="ui-surface-card space-y-5 p-5 text-sm leading-6 text-slate-700 dark:text-slate-300 sm:p-6">
        <p>
          This page explains what data we collect, why we collect it, and what choices you have.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">1. Information We Collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Your basic account info from sign-in (name, email, profile photo)</li>
            <li>The data you add in the app (applications, companies, resumes, review records)</li>
            <li>Google sign-in and Gmail sync tokens needed for features you turn on</li>
            <li>Basic technical logs to keep the app secure and working</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">2. How We Use Data</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Run your account and keep your data available</li>
            <li>Power the app features you use</li>
            <li>Import Gmail messages only when you request a sync</li>
            <li>Find bugs, fix issues, and improve reliability</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">3. Google API Data</h2>
          <p>
            We only use Gmail data to run your review workflow. We do not sell Google data and we do not use it for
            ads. We follow Google API Services User Data Policy, including Limited Use rules.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">4. Sharing and Retention</h2>
          <p>
            We do not sell your personal data. We may share data with trusted service providers that help us run the
            app, or when required by law. We keep data as long as needed to provide the service and meet legal or
            security needs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">5. Your Rights</h2>
          <p>
            Depending on where you live, you may have rights to access, correct, delete, limit, or export your data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">6. Contact</h2>
          <p>
            Privacy inquiries: privacy@jobseekershub.com
            <br />
            Company: Job Seekers Hub
          </p>
        </section>
      </article>
    </div>
  );
}