type HeaderProps = {
  title: string;
  description?: string;
};

export default function Header({
  title,
  description,
}: HeaderProps) {
  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 md:px-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
        CS
      </div>
    </header>
  );
}