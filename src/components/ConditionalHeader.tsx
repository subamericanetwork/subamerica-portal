import { useAuth } from "@/contexts/AuthContext";
import { AnonymousHeader } from "./AnonymousHeader";
import { MemberHeader } from "./MemberHeader";

export function ConditionalHeader() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-[64px]" />; // Placeholder height
  }

  return user ? <MemberHeader /> : <AnonymousHeader />;
}
