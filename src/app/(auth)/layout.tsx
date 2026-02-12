export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#FAF9F6] px-4 py-12">
      {children}
    </div>
  );
}
