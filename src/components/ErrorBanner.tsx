type ErrorBannerProps = {
  message: string;
};

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <p className="paragraph-s text-orange-1 border border-orange-1 bg-smoke-6 p-2">
      {message}
    </p>
  );
}
