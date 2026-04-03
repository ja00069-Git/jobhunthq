import ApplicationForm from "@/components/applicationForm";
import ApplicationList from "@/components/applicationList";

async function getApplications() {
  const res = await fetch("http://localhost:3000/api/applications", {
    cache: "no-store",
  });

  return res.json();
}

export default async function Home() {
  const applications = await getApplications();

  return (
    <main className="flex flex-col items-center min-h-screen gap-10 p-10">
      <h1 className="text-4xl font-bold">JobHuntHQ</h1>

      <ApplicationForm />

      <ApplicationList applications={applications} />
    </main>
  );
}