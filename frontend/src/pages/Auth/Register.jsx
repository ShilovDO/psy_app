import InputError from '../../Components/InputError';
import InputLabel from '../../Components/InputLabel';
import PrimaryButton from '../../Components/PrimaryButton';
import TextInput from '../../Components/TextInput';
import GuestLayout from '../../Layouts/GuestLayout';
import {useForm} from "react-hook-form";
import {Link, useNavigate, /* useNavigate */} from 'react-router-dom';
import {api} from '../../api/api';
import Checkbox from "../../Components/Checkbox.jsx";
import DropdownSelect from "../../Components/DropdownSelect.jsx";
import RadioGroup from "../../Components/RadioGroup.jsx";
import {useContext, useEffect, useRef, useState} from "react";
import UseThemeContext from "../../hooks/useThemeContext.js";
import {toast} from "react-toastify";
import Spiner from "../../Components/Spiner.jsx";
import {Helmet} from "react-helmet";
export default function Register() {
    // Обращаемся к контексту
    const context = useContext(UseThemeContext);

    // Берём из контекста текущую тему
    const {currentTheme} = context;
    // State для загрузки
    const [loading, setLoading] = useState(false);

    // nvigate для перенаправления на другую страницу
    const navigate = useNavigate();

    // submit-обработчик
    const onSubmit = (e) => {
        //alert(JSON.stringify(e));
        postRegister({username: e.username, mail: e.email, password: e.password, admin: e.admin});
    };

    // Функция запроса-ответа для регистрации
    const postRegister = async (data) => {
        try {
            setLoading(true); // Устанавливаем состояние загрузки в true.
            const response = await api.postRegister(data); // Отправляем ответ на сервер.
            if (response.status === 201) {
                if (!response?.data?.access_token) {
                    throw new Error('Произошла проблема при получении ответа')
                }
                setLoading(false);
                //toast.success(response?.status + ' register');
                reset();
            } else {
                throw new Error('Ответ сервера некорректен');
            }

        } catch (error) {
            // Обработка ошибок при отправке ответа
            if (error?.status != 401)
                toast.error((error?.message || 'Ошибка при получении данных с сервера') + ` Код: ${error?.status}`, {toastId: "unique-message-19"}); // Отображаем сообщение об ошибке
        } finally {
            setLoading(false); // Устанавливаем состояние загрузки в false в любом случае (успех или ошибка)
            resetField('password');
            resetField('password_confirmation');
        }
    };

    // useForm для регистрации
    const {
        register,
        handleSubmit,
        watch,
        formState: {errors, isValid},
        resetField,
        reset,
        setValue
    } = useForm({
        mode: "onTouched",
        defaultValues: {
            username: '',
            email: '',
            password: '',
            password_confirmation: '',
            admin: false
        },
    });

    return (
        <div className="mt-5 max-w-3xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="p-6 text-gray-900">
                <h1 className="text-2xl font-bold mb-6 dark:text-gray-200">List of users (last names)</h1>
            {/* Установка названия вкладки */}
            <Helmet>
                <title>Register</title>
            </Helmet>
            {loading ? <Spiner/> :
                <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">

                    <div className="mt-4">
                        <InputLabel htmlFor="username" value="Имя пользователя"/>
                        <TextInput
                            {...register('username', {
                                required: "Поле обязательно к заполнению",
                                minLength: {
                                    value: 6,
                                    message: "Логин должен содержать не менее 6 символов"
                                },
                            })}
                            id="name"
                            className="mt-1 block w-full"
                            isFocused={true}
                        />
                        {errors?.username && (
                            <InputError message={errors?.username?.message} className="mt-2"/>
                        )}
                        {/*<InputError message={inertiaErrors.name} className="mt-2"/>*/}
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="email" value="Email"/>
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            {...register('email', {
                                required: "Поле обязательно к заполнению",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9-]+.+.[A-Z]{2,4}$/i,
                                    message: "Указанный адрес не соответствует требованиям"
                                }
                            })}
                        />
                        {errors?.email && (
                            <InputError message={errors?.email?.message} className="mt-2"/>
                        )}
                        {/*{inertiaErrors?.email && (*/}
                        {/*    <InputError message={inertiaErrors.email} className="mt-2"/>*/}
                        {/*)*/}
                        {/*}*/}
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Пароль"/>
                        <TextInput
                            id="password"
                            type="password"
                            className="mt-1 block w-full"
                            {...register('password', {
                                required: "Поле обязательно к заполнению",
                                pattern: {
                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/,
                                    message: "Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и спецсимволы"
                                }
                            })}
                        />
                        {errors?.password && (
                            <InputError message={errors?.password?.message} className="mt-2"/>
                        )}
                        {/*<InputError message={inertiaErrors.password} className="mt-2"/>*/}
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password_confirmation" value="Подтверждение пароля"/>
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            className="mt-1 block w-full"
                            {...register('password_confirmation', {
                                required: "Поле обязательно к заполнению",
                                validate: (value) =>
                                    value === watch('password') || 'Пароли не совпадают',
                            })}
                        />
                        {errors?.password_confirmation && (
                            <InputError message={errors?.password_confirmation?.message} className="mt-2"/>
                        )}
                        {/*<InputError*/}
                        {/*    message={inertiaErrors.password_confirmation}*/}
                        {/*    className="mt-2"*/}
                        {/*/>*/}
                    </div>

                    <div className="mt-2">
                        <div className="flex items-center gap-2">
                            <RadioGroup
                            id="remember"
                            className="block"
                            {...register('admin', {
                                required: false
                            })}>
                                <RadioButton>
                                Диагностируемый
                                </RadioButton>
                                    
                                <RadioButton>
                                   Психолог 
                                </RadioButton>
                                    
                                <RadioButton>
                                    Админ
                                </RadioButton>                       
                            </RadioGroup>
                            <InputLabel htmlFor="admin" value="Будет являться администратором?"/>
                        </div>
                        {errors?.rules && (
                            <InputError message={errors?.remember?.message} className="mt-2"/>
                        )}
                        {/*<InputError*/}
                        {/*    message={inertiaErrors.rules}*/}
                        {/*    className="mt-2"*/}
                        {/*/>*/}
                    </div>

                    <div className="mt-4 flex items-center justify-end">
                        <Link
                            to='/login'
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                        >
                            Already registered?
                        </Link>

                        <PrimaryButton type="submit" className="ms-4" disabled={!isValid}>
                            Register
                        </PrimaryButton>

                    </div>
                </form>
            }
                            </div>
            </div>
        </div>
    );
}
