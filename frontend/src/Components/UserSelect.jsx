import { useState, useRef, useEffect } from 'react';
import Avatar from './Avatar';

const UserSelect = ({ 
    users = [], 
    value, 
    onChange, 
    placeholder = 'Выберите пользователя', 
    className = '',
    clearable = true,
    searchable = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    const selectedUser = users.find(u => u.id === value);

    const filteredUsers = users.filter(u => {
        if (u.id === 0) return false;
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            u.username?.toLowerCase().includes(searchLower)
        );
    });

    // Закрытие по клику вне компонента
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Закрытие по Escape
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Фокус на поиск при открытии
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleClear = (e) => {
        e.stopPropagation();
        onChange(0);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                onClick={() => {
                    setIsOpen(!isOpen);
                    setSearch('');
                }}
                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center gap-3 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
                {selectedUser && selectedUser.id !== 0 ? (
                    <>
                        <Avatar 
                            email={selectedUser.mail} 
                            avatarUrl={selectedUser.photo} 
                            size="sm"
                        />
                        <span className="flex-1 text-left truncate text-gray-900 dark:text-white">
                            {selectedUser.username}
                        </span>
                    </>
                ) : (
                    <span className="flex-1 text-left text-gray-500 dark:text-gray-400">
                        {placeholder}
                    </span>
                )}

                {clearable && selectedUser && selectedUser.id !== 0 && (
                    <button
                        onClick={handleClear}
                        className="flex-shrink-0 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="Сбросить"
                    >
                        <svg className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <svg className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 flex flex-col">
                    {searchable && (
                        <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                            <div className="relative">
                                <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Поиск..."
                                    className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-400"
                                />
                                {search && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearch('');
                                            searchInputRef.current?.focus();
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="overflow-y-auto overflow-x-hidden flex-1">
                        {clearable && !search && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(0);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                className="p-2.5 flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Сбросить</span>
                            </div>
                        )}
                        
                        {filteredUsers.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                                Ничего не найдено
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(user.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`p-2.5 flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                                        user.id === value ? 'bg-gray-100 dark:bg-gray-600' : ''
                                    }`}
                                >
                                    <Avatar 
                                        email={user.mail} 
                                        avatarUrl={user.photo} 
                                        size="sm"
                                    />
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="font-medium text-gray-900 dark:text-white break-words">
                                            {user.username}
                                        </div>
                                        {/* {user.mail && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
                                                {user.mail}
                                            </div>
                                        )} */}
                                    </div>
                                    {user.id === value && (
                                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserSelect;