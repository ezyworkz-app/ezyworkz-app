import React from 'react';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'active' | 'inactive';
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  status
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const statusClasses = {
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200`}>
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-medium text-[10px]">
            {(alt || "??").slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusClasses[status]}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Avatar;
