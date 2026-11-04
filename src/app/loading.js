import TravelLoader from "@/components/TravelLoader";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-5">
      <TravelLoader label="Preparing your next adventure" />
    </main>
  );
}
