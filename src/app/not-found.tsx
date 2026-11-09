import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">That page isn&apos;t here.</h1>
      <p className="mt-2 text-sm text-mute">The link may be old or mistyped.</p>
      <Link href="/" className="btn-dark mt-6">
        Back to overview
      </Link>
    </div>
  );
}
