import DangerButton from '../../../Components/DangerButton';
import InputError from '../../../Components/InputError';
import InputLabel from '../../../Components/InputLabel';
import Modal from '../../../Components/Modal';
import SecondaryButton from '../../../Components/SecondaryButton';
import TextInput from '../../../Components/TextInput';
import {useContext, useRef, useState} from 'react';
import UseThemeContext from "../../../hooks/useThemeContext.js";
import {Navigate, useNavigate} from "react-router-dom";
import {useForm} from "react-hook-form";
import {api} from "../../../api/api.js";
import {toast} from "react-toastify";
import Spiner from "../../../Components/Spiner.jsx";

export default function DeleteUserForm({ className = '',  }) {
    // State для отображения модального окна
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);

    // State для загрузки
    const [loading, setLoading] = useState(false);

    // Функция для возведения State у модального окна
    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    // submit-обработчик
    const deleteUser = () => {
        postRemoveUser(id) // Вызываем функцию запроса-ответа
    };

    // Функция для закрытия модального окна и сброса всех полей
    const closeModal = () => {
        setConfirmingUserDeletion(false);
        reset();
    };


    const postRemoveUser = async (id) => {
        // Функция для обработки ответа пользователя на вопрос.
        try {
            setLoading(true); // Устанавливаем состояние загрузки в true.
            const response = await api.postRemoveUser(id); // Отправляем ответ на сервер.

            if (response.status === 200) {
                closeModal();
                toast.success(`Пользователь ${user?.username} успешно удалён`);
            }

        } catch (error) {
            // Обработка ошибок при отправке ответа
            toast.error((error?.message || 'Ошибка при получении данных с сервера') + ` Код: ${error?.status}`); // Отображаем сообщение об ошибке
        } finally {
            setLoading(false); // Устанавливаем состояние загрузки в false в любом случае (успех или ошибка)
        }
    };
    return (
        <section className={`space-y-6 ${className}`}>
            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                {loading ? <div className="flex w-full justify-center p-16"> <Spiner /> </div>:
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Are you sure you want to delete account?
                    </h2>

                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Once your account is deleted, all of its resources and
                        data will be permanently deleted. Please enter your
                        password to confirm you would like to permanently delete
                        your account.
                    </p>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            Cancel
                        </SecondaryButton>

                        <DangerButton className="ms-3" onClick={deleteUser} disabled={!isValid}>
                            Delete Account
                        </DangerButton>
                    </div>
                </form>
                }
            </Modal>
        </section>
    );
}
