export default function ApplicationLogo ({ width = 240, height = 80 }) {
  return (
    <div className="inline-block">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={width} 
        height={height}
        viewBox="0 0 240 80"
        className="block"
      >
        {/* Декоративные элементы */}
        <defs>
          {/* Градиент для светлой темы */}
          <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#F5D7A1" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          
          {/* Градиент для темной темы */}
          <linearGradient id="mainGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5D7A1" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>

        {/* Спираль пути */}
        <path
          d="M25 60C35 40 55 35 70 45S95 70 110 60S135 35 150 45S175 70 190 60"
          className="stroke-amber-600 dark:stroke-amber-300"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Основной текст */}
        <text
          x="120"
          y="45"
          fontFamily="'Playfair Display', serif"
          fontSize="28"
          fontWeight="700"
          letterSpacing="1.5px"
          className="fill-[url(#mainGradient)] dark:fill-[url(#mainGradientDark)]"
          textAnchor="middle"
        >
          Дорога
        </text>
        
        {/* Вторичный текст */}
        <text
          x="120"
          y="65"
          fontFamily="'Cormorant Garamond', serif"
          fontSize="18"
          fontStyle="italic"
          className="fill-gray-800 dark:fill-amber-50"
          textAnchor="middle"
          letterSpacing="1px"
        >
          психологии
        </text>
        
        {/* Декоративные акценты */}
        <line 
          x1="80" y1="50" x2="160" y2="50" 
          className="stroke-amber-600 dark:stroke-amber-300"
          strokeWidth="0.8" 
          strokeDasharray="1,3" 
        />
        <circle 
          cx="120" cy="50" r="3" 
          className="fill-amber-600 dark:fill-amber-300" 
        />
      </svg>
    </div>
  );
};