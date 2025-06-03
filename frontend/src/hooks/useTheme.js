import {useState, useEffect, useLayoutEffect} from 'react';
import {useCookies} from 'react-cookie';
import {api} from "../api/api.js";
import {toast} from "react-toastify";
import { setNavigate } from '../api/api.js';
import {useNavigate} from "react-router-dom";

export default function useTheme () {
    // Название ключа для accessToken
    const accessTokenKeyName = 'accessToken';

    // Глобальная загрузка
    const [loading, setLoading] = useState(true); // Состояние для отображения индикатора загрузки.  Начальное значение - true (загрузка идет)

    // State для пользователя
    const [user, setUser] = useState(null);

    const [userGetting, setUserGetting] = useState(false);

    // Текущая тема
    const [currentTheme, setCurrentTheme] = useState('light');

    // Подвязываемся к куки гостевой и пользовательской темы
    const [cookies, setCookie] = useCookies(['tdark']);

    // Гостевая тема, берётся из куки
    const [tdark, setTdark] = useState(cookies.tdark);

    // Глобальное состояние загрузки
    const [globalLoading, setGlobalLoading] = useState(false);

    const navigate = useNavigate();

    // Прокидываем nаvigate-функцию axios, чтобы он мог направлять пользователя
    useEffect(() => {
        setNavigate(navigate);
    }, [navigate]);

    // useEffect при изменении пользователя и тем (в сыром виде)
    useLayoutEffect(() => {
        // Установка темы
        const theme = tdark ? 'dark' : 'light';
        console.log('Setting guest theme:', theme);
        setCurrentTheme(theme);
        
        }, [tdark, user]);

    // Если тема поменялась, то устанавливаем/удаляем класс dark на корневом элементе
    useEffect(() => {
        if (currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [currentTheme]);

    // При изменении в куки устанавливаем пользовательскую/гостевую тему
    useEffect(() => {
        setTdark(cookies.tdark);
    }, [cookies]);

    // Функция для вызова функции изменения темы
    const toggleTheme = async () => {
        setTheme(currentTheme === 'light' ? true : false);
    };


    // При инициализации хука запрашиваем информацию о пользователе и теме
    useEffect(() => {
        setTimeout(() => {
            // Код, который выполнится после задержки
                getInfoBase(true);
                setGlobalLoading(true);

        }, 500);
    }, []);

    // Функция запрос-ответа для запроса информации о пользователе и теме
    const getInfoBase = async (loadingNeed) => {
        // Функция для обработки ответа пользователя на вопрос.
        try {
            setLoading(loadingNeed ?? false);
            if (!tdark){
                setTheme(false);
            }
            const response = await api.getCurrentUser(); // Отправляем ответ на сервер.

            if (response?.data?.user) {
                console.log('User запрос ' + response?.data?.user);
                const normalizedData = Object.keys(response?.data?.user).length === 0
                    ?  null
                    : response?.data?.user;
                console.log('NormalizedData:', normalizedData);
                setUser(normalizedData);
                console.log('Ветка 1' + normalizedData);
            } else{
                console.log('Ветка 2');
                setUser(null);
            }
            //toast.success(response?.status + ' getBaeInfo');
        } catch (error) {
            // Обработка ошибок при отправке ответа
            
            setUser(null);
            toast.error((error?.message || '[тест]Ошибка при получении данных с сервера') + ` Код: ${error?.status}`); // Отображаем сообщение об ошибке
        } finally {
            setLoading(false); // Устанавливаем состояние загрузки в false в любом случае (успех или ошибка)
            setUserGetting(true);
        }
    };

    // Функция запрос-ответа для смены темы
    const setTheme = async (theme) => {
        // Функция для обработки ответа пользователя на вопрос.
        try {
            const date = new Date();
            date.setTime(date.getTime() + (60 * 60 * 24 * 30 * 1000 * 12 * 10000));
            const expires = "expires=" + date.toUTCString();
            document.cookie = `tdark=${theme}; ${expires}; path=/`;
        } catch (error) {
            // Обработка ошибок при отправке ответа
            toast.error((error?.message || 'Ошибка установки темы')); // Отображаем сообщение об ошибке
        }
    };


    return {
        currentTheme,
        setCurrentTheme,
        tdark,
        setTdark,
        setCookie,
        //csrfToken,
        user,
        loading,
        setLoading,
        toggleTheme,
        getInfoBase,
        globalLoading,
        accessTokenKeyName,
        userGetting
    };
};
