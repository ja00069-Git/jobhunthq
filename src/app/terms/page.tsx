import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Job Seekers Hub",
  description: "Terms that govern use of Job Seekers Hub.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Legal
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Terms of Service</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Effective date: April 23, 2026</p>
      </header>

      <article className="ui-surface-card space-y-5 p-5 text-sm leading-6 text-slate-700 dark:text-slate-300 sm:p-6">
        <p>
          These terms explain how you can use Job Seekers Hub. If you use the app, you agree to these terms.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">1. Use of Service</h2>
          <p>
            Use the app for legal job-search purposes. Do not misuse it, break it, or try to access accounts or data
            that are not yours.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">2. Accounts and Access</h2>
          <p>
            You are responsible for what happens on your account. Keep your sign-in secure and tell us if you think
            someone else got access.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">3. User Content</h2>
          <p>
            Your content stays yours (applications, company info, resumes, review records). You give us permission to
            store and process that content only to run the service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">4. Third-Party Services</h2>
          <p>
            The app relies on third-party services (like sign-in, hosting, and database providers). Their terms and
            uptime can affect how this app works.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">5. Disclaimer</h2>
          <p>
            The app is provided "as is". We cannot promise it will always be available or error-free.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">6. Limitation of Liability</h2>
          <p>
            To the extent allowed by law, Job Seekers Hub is not responsible for indirect or consequential losses,
            including lost data, profits, or business opportunities from using the app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">7. Changes to Terms</h2>
          <p>
            We may update these terms over time. If you keep using the app after changes are posted, you accept the
            new terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">8. Contact</h2>
          <p>
            Legal inquiries: legal@jobseekershub.com
            <br />
            Company: Job Seekers Hub
          </p>
        </section>
      </article>
    </div>
  );
}
