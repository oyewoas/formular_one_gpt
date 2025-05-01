const LoadingBubble = ({
  color = "bg-red-300",
  size = "w-3 h-3",
  count = 3,
  gap = "space-x-2",
  animationDuration = "1.4s",
}: {
  color?: string;
  size?: string;
  count?: number;
  gap?: string;
  animationDuration?: string;
}) => {
  return (
    <div className={`flex m-2 ${gap}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${size} ${color} rounded-full`}
          style={{
            animation: `pulse ${animationDuration} infinite ease-in-out`,
            animationDelay: `${i * 0.2}s`,
          }}
        ></div>
      ))}
    </div>
  );
};

export default LoadingBubble;