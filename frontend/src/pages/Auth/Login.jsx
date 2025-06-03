import Checkbox from '../../Components/Checkbox';
import InputError from '../../Components/InputError';
import InputLabel from '../../Components/InputLabel';
import PrimaryButton from '../../Components/PrimaryButton';
import TextInput from '../../Components/TextInput';
import { useForm } from "react-hook-form";
import {Link, useNavigate} from "react-router-dom";
import GuestLayout from "../../Layouts/GuestLayout.jsx";
import {api} from "../../api/api.js";
import {toast} from "react-toastify";
import {useContext, useEffect, useState} from "react";
import UseThemeContext from "../../hooks/useThemeContext.js";
import { useRef } from 'react';
import Spiner from "../../Components/Spiner.jsx";
import { Helmet } from 'react-helmet';
export default function Login() {
    const context = useContext(UseThemeContext);
    const { currentTheme } = context;
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // Хук для навигации


    // useForm для входа
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        resetField,
        reset,
        setValue
    } = useForm({
        mode: "onTouched",
        defaultValues: {
            mail: '',
            password: '',
            remember: false
        }
    });


    // submit-обработчик
    const submit = (e) => {
        //alert(JSON.stringify(e, token));
        postLogin(e.mail, e.password, e.remember);

    };

    // Функция запрос-ответа для входа
    const postLogin = async (mail, password, remember) => {
        // Функция для обработки ответа пользователя на вопрос.
        try {
            setLoading(true); // Устанавливаем состояние загрузки в true.
            const response = await api.postLogin(mail, password, remember); // Отправляем ответ на сервер.
            if (response.status === 200) {
                if (response?.data?.access_token) {
                    localStorage.setItem('accessToken', response?.data?.access_token);
                }
                else{
                    throw new Error('Произошла проблема при получении ответа')
                }
                setLoading(false);
                //toast.success(response?.status + ' login');
                reset();
                navigate('/task-one');
            }
            else{
                throw new Error('Ответ сервера некорректен');
            }

        } catch (error) {
            // Обработка ошибок при отправке ответа
            toast.error((error?.message || 'Ошибка при получении данных с сервера') + ` Код: ${error?.status}`); // Отображаем сообщение об ошибке
        } finally {
            setLoading(false); // Устанавливаем состояние загрузки в false в любом случае (успех или ошибка)
            resetField('password');
        }
    };


    return (
<>
<GuestLayout>
    <Helmet>
        <title>Log in</title>
    </Helmet>
    {loading ? <Spiner /> :

            <form onSubmit={handleSubmit(submit)} autoComplete="off">
                <div className="mt-4">
                    <InputLabel htmlFor="mail" value="Email"/>
                    <input
                        {...register('mail', {
                            required: "Поле обязательно к заполнению",
                        })}
                        id="name"
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        // autoComplete="name"
                        isFocused={true}
                    />
                    {errors?.mail && (
                        <InputError message={errors?.mail?.message} className="mt-2"/>
                    )}
                    {/*<InputError message={inertiaErrors.name} className="mt-2"/>*/}
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Пароль" className="mb-2"/>
                    <TextInput
                        id="password"
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        // autoComplete="new-password"
                        {...register('password', {
                            required: "Поле обязательно к заполнению",
                        })}
                    />
                    {errors?.password && (
                        <InputError message={errors?.password?.message} className="mt-2"/>
                    )}
                    {/*<InputError message={inertiaErrors.password} className="mt-2"/>*/}
                </div>


                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="remember"
                            className="block"
                            // autoComplete="rules"
                            {...register('remember', {
                                required: false
                            })}
                        />
                        <InputLabel htmlFor="remember" value="Запомнить меня"/>
                    </div>
                    {errors?.rules && (
                        <InputError message={errors?.remember?.message} className="mt-2"/>
                    )}
                    {/*<InputError*/}
                    {/*    message={inertiaErrors.rules}*/}
                    {/*    className="mt-2"*/}
                    {/*/>*/}
                </div>

                <div className="mt-4">

                    <div className="flex justify-center mt-4">
                        <PrimaryButton type='submit' disabled={!isValid}>
                            Log in
                        </PrimaryButton>

                    </div>
                    <div className="flex justify-center mt-2">

                    </div>
                </div>
            </form>
    }
</GuestLayout>
</>
    );
}
