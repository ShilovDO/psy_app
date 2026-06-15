// layouts/DesktopOnlyLayout.jsx
import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';

const DesktopOnlyLayout = () => {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      
      // Блокируем всё до 1024px (телефоны и планшеты)
      // Можно изменить на 1280 если нужен только десктоп
      setIsBlocked(width <= 1024);
    };

    checkDevice();

    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  if (isBlocked) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center p-8">
          <div className="mb-6">
            <svg 
              className="w-24 h-24 mx-auto text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Desktop Only
          </h2>
          <p className="text-gray-400 text-lg mb-2">
            Это приложение доступно только на компьютере
          </p>
          <p className="text-gray-500 text-sm">
            Пожалуйста, откройте сайт на устройстве с шириной экрана более 1024px
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default DesktopOnlyLayout;