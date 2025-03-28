interface AvatarProps {
  size?: number;
  className?: string;
}

export const Avatar = ({ size = 40, className = "" }: AvatarProps) => {
  return (
    <div 
      className={`rounded-lg overflow-hidden flex-shrink-0 ${className} bg-white`}
      style={{ width: size, height: size }}
    >
      <img 
        src="pepe-avatar.png"
        alt="Pepe Chat Avatar" 
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
}; 