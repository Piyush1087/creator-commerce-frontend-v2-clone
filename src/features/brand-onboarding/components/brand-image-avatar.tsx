import { useEffect, useState } from "react";

type BrandImageAvatarProps = {
  src?: string | null;
  label: string;
  alt?: string;
  className?: string;
  size?: number;
};

function firstLetter(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    return "?";
  }
  return trimmed[0]!.toUpperCase();
}

export function BrandImageAvatar({
  src,
  label,
  alt,
  className,
  size = 72,
}: BrandImageAvatarProps) {
  const [failed, setFailed] = useState(false);
  const trimmedSrc = src?.trim() ?? "";

  useEffect(() => {
    setFailed(false);
  }, [trimmedSrc]);

  const showImage = trimmedSrc.length > 0 && !failed;
  const letter = firstLetter(label);

  const rootClass = [
    "bob-image-avatar",
    !showImage ? "bob-image-avatar--fallback" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      style={{ width: size, height: size }}
      aria-label={alt ?? `${label} image`}
    >
      {showImage ? (
        <img
          src={trimmedSrc}
          alt={alt ?? `${label} logo`}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="bob-image-avatar__letter" aria-hidden>
          {letter}
        </span>
      )}
    </div>
  );
}
