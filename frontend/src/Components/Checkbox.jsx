import { forwardRef } from 'react';

export default forwardRef(function Checkbox({ type = 'text', className = '', isFocused = false, ...props }, ref) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:ring-indigo-600 dark:focus:ring-offset-gray-800 ' +
                className
            }
            ref={ref}
        />
    );
})



