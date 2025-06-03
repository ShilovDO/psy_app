import React from 'react';
import Avatar from "../Components/Avatar.jsx";

export default function StatCard({ title, value, description, email='' }) {


    return (
        <div className='bg-purple-50 p-6 rounded-lg dark:bg-gray-700'>
            <h2 className='text-lg font-semibold text-purple-800 mb-2 dark:text-gray-200'>{title}</h2>
            <div className="flex">
            {email && (
                <Avatar email={email} size="md" className="me-3"/>
            )}
            <p className={'text-3xl font-bold text-purple-600 dark:text-gray-200'}>{value}</p>
            </div>
            {description && (
                <p className='text-sm  mt-2 dark:text-gray-400'>{description}</p>
            )}
        </div>
    );
}
