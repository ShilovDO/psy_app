import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import NotFound from './pages/NotFound';
import AuthenticatedLayout from "./Layouts/AuthenticatedLayout.jsx";
import AdminLayout from "./Layouts/AdminLayout.jsx";
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
import GuestLayout from './Layouts/GuestLayout';
import Configs from './pages/configs/Configs.jsx'
import Results from './pages/results/Results.jsx'
import OrientationLayout from './Layouts/OrientationLayout.jsx'

function App() {
    return (
        <CookiesProvider>
            <ToastContainer position="top-center" autoClose={1500} />
            <Router>
                <Routes>
                    <Route element={<GeneralLayout/>}>
                    <Route element={<OrientationLayout/>}>
                        {/* Общие публичные маршруты (если есть) */}
                        
                        {/* Аутентифицированные маршруты */}
                        <Route element={<AuthenticatedLayout/>}>
                            <Route path='' element={<AppRoutes/>}/>
                            <Route path='routes' element={<AppRoutes/>}/>
                            <Route path="services" element={<Services/>}/>
                            <Route path="routes/create-route" element={<CreateRoute/>}/>
                            <Route path="routes/create-route/:routeId" element={<CreateRoute/>}/>
                            <Route path="routes/play/:routeId" element={<RoutePlayer/>}/>
                            <Route path="profile" element={<Edit/>}/>
                            <Route path='configs' element={<Configs/>}/>
                            <Route path='results' element={<Results/>}/>
                            {/* Админские маршруты с собственным layout */}
                            <Route element={<AdminLayout/>}>
                                <Route path="admin/users" element={<Users/>}/>
                                <Route path="admin/services" element={<Services/>}/>
                            </Route>
                        </Route>
                        <Route element={<GuestLayout/>}>
                            <Route path="login" element={<Login/>}/>
                        </Route>
                        <Route path="*" element={<NotFound/>}/>
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </CookiesProvider>
    );
}

export default App;