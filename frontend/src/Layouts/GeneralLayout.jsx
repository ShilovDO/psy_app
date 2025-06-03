import useTheme from "../hooks/useTheme.js";
import 'react-toastify/dist/ReactToastify.css';
import UseThemeContext from "../hooks/useThemeContext";
import {Outlet} from "react-router-dom";
import Spiner from "../Components/Spiner.jsx";

export default function GeneralLayout() {
    // Инициализируем хук
    const hookValues = useTheme();

    // Пока не инициализирован будем рендерить спинер
    if (!hookValues) {
        return <Spiner />
    }
    
    return (
        // Провайдер нашего контекста, дабы контекстом могли воспользоваться все дети
        <UseThemeContext.Provider value={hookValues}>
                    <Outlet/>
        </UseThemeContext.Provider>
    );
}
