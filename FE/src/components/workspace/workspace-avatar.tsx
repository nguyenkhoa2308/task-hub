export default function WorksapceAvatar({
  color,
  name,
  className,
}: {
  color: string;
  name: string;
  className?: string;
}) {
  return (
    <div
      className={`w-6 h-6 rounded flex items-center justify-center ${className}`}
      style={{ backgroundColor: color }}
    >
      <span className="text-xs font-medium !text-white">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
