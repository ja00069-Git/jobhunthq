type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  location?: string;
  createdAt: string;
};

export default function ApplicationList({
  applications,
}: {
  applications: Application[];
}) {
  return (
    <div className="w-full max-w-3xl space-y-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className="border p-4 rounded-lg shadow-sm"
        >
          <h3 className="text-lg font-semibold">
            {app.role}
          </h3>
          <p className="text-gray-600">{app.company}</p>

          <div className="flex justify-between mt-2 text-sm">
            <span className="px-2 py-1 bg-gray-200 rounded">
              {app.status}
            </span>
            <span>{app.location || "N/A"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}