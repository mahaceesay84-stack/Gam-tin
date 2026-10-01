import Guard from "@/components/Guard";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <Guard area="student">{children}</Guard>;
}
