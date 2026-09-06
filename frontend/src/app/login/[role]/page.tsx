import { notFound } from "next/navigation";
import { StaffLoginForm } from "@/components/auth/StaffLoginForm";
import { ROLE_LABEL, ROLE_SLUGS, roleFromSlug } from "@/lib/roles";

export function generateStaticParams(): Array<{ role: string }> {
  return Object.keys(ROLE_SLUGS).map((role) => ({ role }));
}

export default async function RoleLoginPage({ params }: { params: Promise<{ role: string }> }) {
  const { role: slug } = await params;
  const role = roleFromSlug(slug);
  if (!role) notFound();

  return (
    <StaffLoginForm
      expectedRole={role}
      title={`${ROLE_LABEL[role]} sign-in`}
      subtitle={`CarePlus ${ROLE_LABEL[role]} desk — use your hospital credentials`}
    />
  );
}
