// layouts/OrientationLayout.jsx
import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';

const OrientationLayout = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (window.screen?.orientation) {
        setIsPortrait(window.screen.orientation.type.includes('portrait'));
      } else {
        setIsPortrait(window.innerHeight > window.innerWidth);
      }
    };

    checkOrientation();

    const handleChange = () => checkOrientation();
    
    window.addEventListener('orientationchange', handleChange);
    window.addEventListener('resize', handleChange);
    
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleChange);
    }

    return () => {
      window.removeEventListener('orientationchange', handleChange);
      window.removeEventListener('resize', handleChange);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleChange);
      }
    };
  }, []);

  if (isPortrait) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center p-8">
          <div className="mb-6 animate-bounce">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Пожалуйста, поверните устройство
          </h2>
          <p className="text-gray-400 text-lg">
            Для комфортного просмотра используйте горизонтальную ориентацию
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default OrientationLayout;