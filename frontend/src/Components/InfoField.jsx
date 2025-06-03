import { forwardRef } from 'react';

export default forwardRef(function InfoField(
    { value = '', className = '', ...props },
    ref,
) {
    return (
        <div
            {...props}
            className={
                'font-bold italic dark:text-gray-300 ' +
                className
            }
            ref={ref}
        >
            {value}
        </div>
    );
});
