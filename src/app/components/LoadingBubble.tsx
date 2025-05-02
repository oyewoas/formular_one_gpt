const LoadingBubble = ({
  color = "bg-red-600",
  size = "w-3 h-3",
  count = 3,
  gap = "space-x-2",
}: {
  color?: string;
  size?: string;
  count?: number;
  gap?: string;
}) => {
  return (
    <div 
      className={`flex m-2 ${gap}`}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${size} ${color} rounded-full animate-bubble`}
          style={{
            animationDelay: `${i * 0.2}s`,
          }}
        ></div>
      ))}
    </div>
  );
};

export default LoadingBubble;