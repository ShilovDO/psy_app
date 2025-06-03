import React from 'react';
import md5 from 'md5';

const Avatar = ({ email, size = 'md', className = '' }) => {
    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
        xxl: 'w-48 h-48 text-xl',
    };

    const sizeClass = sizes[size] || sizes.md;

    const gravatarUrl = `https://www.gravatar.com/avatar/${email ? md5(email?.trim().toLowerCase()) : 'test'}?d=identicon&s=512`;

    return (
        <img
            src={gravatarUrl}
            alt="User avatar"
            className={`rounded-full ${sizeClass} ${className}`}
            onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${email ? encodeURIComponent(email) : 'test'}&background=random`;
            }}
        />
    );
};

export default Avatar;
