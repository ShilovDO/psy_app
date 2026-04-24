// Components/Avatar.jsx
import React from 'react';
import md5 from 'md5';

const Avatar = ({ email, avatarUrl = null, size = 'md', className = '', inEdit=false }) => {
    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
        xxl: 'w-48 h-48 text-xl',
    };

    const sizeClass = sizes[size] || sizes.md;
    const type = null;
    // Если передан avatarUrl – используем его, иначе Gravatar или fallback
    const getImageUrl = () => {
        if (avatarUrl) return avatarUrl;
        const hash = email ? md5(email.trim().toLowerCase()) : 'test';
        return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=512`;
    };

    const imageUrl = getImageUrl();

    return (
        <img
            src={avatarUrl && !inEdit ? `data:image/png;base64,${imageUrl}` : imageUrl}
            alt="User avatar"
            className={`rounded-full object-cover ${sizeClass} ${className}`}
            onError={(e) => {
                const hash = email ? md5(email.trim().toLowerCase()) : 'test';
                if (!avatarUrl) {
                    e.target.src = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=512`;
                }
            }}
        />
    );
};

export default Avatar;