import Logo from "./Logo";

export default function Header() {
  return (
    <header className="bg-st-dark text-white h-14 flex items-center px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Logo size="sm" />
        <span className="font-serif text-lg tracking-wide">
          Donna
        </span>
      </div>
    </header>
  );
}
