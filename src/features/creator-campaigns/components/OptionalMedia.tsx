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
  if (src?.trim()) {
    return <img src={src} alt={alt} className={className} />;
  }
  return (
    <div className={placeholderClassName} aria-hidden>
      -
    </div>
  );
}
