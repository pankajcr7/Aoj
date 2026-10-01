import { requireRole } from "@/lib/auth";
import { ChangePasswordForm } from "../forms";
import { Detail, PageHeader } from "../ui";

const ROLE = { admin: "Admin", operations: "Operation Team", member: "Member" } as const;

export default async function AccountPage() {
  const me = await requireRole(["admin", "operations", "member"]);
  return (
    <>
      <PageHeader title="Account" desc="Your login details and password." />
      <div className="grid max-w-3xl gap-6 md:grid-cols-[1fr_1.2fr] md:items-start">
        <div className="card p-6">
          <dl className="grid gap-4">
            <Detail label="Login ID" value={<span className="font-mono">{me.loginId}</span>} />
            <Detail label="Role" value={ROLE[me.role]} />
          </dl>
        </div>
        <div className="card p-6">
          <h2 className="mb-4 font-semibold">Change password</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}
