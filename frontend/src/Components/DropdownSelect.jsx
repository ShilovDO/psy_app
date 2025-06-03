import { forwardRef } from 'react';

export default forwardRef(function DropdownSelect({ options=[], className = '', isFocused = false, ...props }, ref) {
    return (
    <select
        {...props}
        className={'p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-indigo-600 dark:focus:ring-indigo-600 ' +
            className}
        defaultValue=''
        ref={ref}
    >
        {options.map((option) => (
            <option
                key={option.value}
                value={option.value}
                disabled={option.value === ''}  // Disable the placeholder option
                // selected={option.value === ''}
            >
                {option.label}
            </option>
        ))}
    </select>
    );
})
