"use client";

import { useState } from "react";

const getTodayDate = () => new Date().toISOString().split("T")[0] ?? "";

export default function ApplicationForm() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Applied");
  const [location, setLocation] = useState("");
  const [dateApplied, setDateApplied] = useState(getTodayDate);
  const [salary, setSalary] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company,
          role,
          status,
          location,
          dateApplied,
          salary,
          notes,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error || "Could not save the application.");
      }

      setSuccessMessage("Application added successfully.");
      setCompany("");
      setRole("");
      setStatus("Applied");
      setLocation("");
      setDateApplied(getTodayDate());
      setSalary("");
      setNotes("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl space-y-4 rounded-xl border p-6 shadow-sm"
    >
      <h2 className="text-2xl font-bold">Add Job Application</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">Company</span>
          <input
            className="w-full rounded-md border p-2"
            placeholder="Stripe"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">Role</span>
          <input
            className="w-full rounded-md border p-2"
            placeholder="Backend Engineer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">Status</span>
          <select
            className="w-full rounded-md border p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Applied">Applied</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">Date Applied</span>
          <input
            type="date"
            className="w-full rounded-md border p-2"
            value={dateApplied}
            onChange={(e) => setDateApplied(e.target.value)}
            required
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Location</span>
          <input
            className="w-full rounded-md border p-2"
            placeholder="Remote"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">Salary</span>
          <input
            type="number"
            min="0"
            className="w-full rounded-md border p-2"
            placeholder="180000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            className="w-full rounded-md border p-2"
            rows={4}
            placeholder="Referral, recruiter notes, next steps..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : "Add Application"}
      </button>
    </form>
  );
}