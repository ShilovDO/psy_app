import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import NotFound from './pages/NotFound';
import AuthenticatedLayout from "./Layouts/AuthenticatedLayout.jsx";
import AdminLayout from "./Layouts/AdminLayout.jsx";
import TaskOne from "./pages/TaskOne.jsx";
import TaskTwo from "./pages/TaskTwo.jsx";
import TaskThree from "./pages/TaskThree.jsx";
import Login from './pages/Auth/Login.jsx'
import Register from './pages/Auth/Register.jsx'
import Users from './pages/admin/Users.jsx'
import Services from './pages/admin/Services.jsx'
import AppRoutes from './pages/routes/Routes.jsx'
import {CookiesProvider} from "react-cookie";
import './index.css';
import {ToastContainer} from "react-toastify";
import GeneralLayout from "./Layouts/GeneralLayout.jsx";
import Edit from "./pages/Profile/Edit";
import CreateRoute from './pages/routes/CreateRoute';
import RoutePlayer from './pages/routes/RoutePlayer';

function App() {
    return (
        <CookiesProvider>
            <ToastContainer position="top-center"/>
            <Router>
                <Routes>
                    <Route element={<GeneralLayout/>}>
                        {/* Общие публичные маршруты (если есть) */}
                        
                        {/* Аутентифицированные маршруты */}
                        <Route element={<AuthenticatedLayout/>}>
                            <Route path='routes' element={<AppRoutes/>}/>
                            <Route path="services" element={<Services/>}/>
                            <Route path="create-route" element={<CreateRoute/>}/>
                            <Route path="create-route/:routeId" element={<CreateRoute/>}/>
                            <Route path="routes/play/:routeId" element={<RoutePlayer/>}/>
                            <Route path="task-three" element={<TaskThree/>}/>
                            <Route path="profile" element={<Edit/>}/>
                            
                            {/* Админские маршруты с собственным layout */}
                            <Route path="/admin" element={<AdminLayout/>}>
                                <Route path="users" element={<Users/>}/>
                                <Route path="services" element={<Services/>}/>
                            </Route>
                            <Route path="*" element={<NotFound/>}/>
                        </Route>
                        <Route path="login" element={<Login/>}/>
                        
                    </Route>
                </Routes>
            </Router>
        </CookiesProvider>
    );
}

export default App;