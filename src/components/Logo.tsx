interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-xl",
};

export default function Logo({ size = "md" }: LogoProps) {
  return (
    <div
      className={`${sizes[size]} bg-st-gold text-st-dark font-serif font-bold rounded-lg flex items-center justify-center`}
    >
      ST
    </div>
  );
}
