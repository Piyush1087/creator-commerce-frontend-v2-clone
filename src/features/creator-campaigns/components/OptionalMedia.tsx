import { useState } from "react";

type OptionalMediaProps = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
};

export function OptionalMedia({
  src,
  alt = "",
  className,
  placeholderClassName = "cc-media-placeholder",
}: OptionalMediaProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (src?.trim() && src !== failedSource) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => setFailedSource(src)}
      />
    );
  }
  return (
    <div className={placeholderClassName} aria-hidden>
      -
    </div>
  );
}
