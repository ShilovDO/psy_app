import { forwardRef } from 'react';

export default forwardRef(function RadioGroup({ options = [], className = '', isFocused = false, ...props }, ref) {
    return (
        <div className={`space-y-2 ${className}`}>
            {options.map((option) => (
                <div key={option.value} className="flex items-center">
                    <input
                        {...props}
                        type="radio"
                        id={option.value}
                        value={option.value}
                        ref={ref}
                        disabled={option.value === ''} // Disable placeholder if needed
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-500 dark:focus:ring-indigo-600"
                    />
                    <label
                        htmlFor={option.value}
                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                        {option.label}
                    </label>
                </div>
            ))}
        </div>
    );
});
