import Avatar from "../../Components/Avatar.jsx";
import { useEffect, useState, useRef } from "react";
import { api } from "../../api/api.js";
import { toast } from "react-toastify";
import Spiner from "../../Components/Spiner.jsx";
import TextInput from "../../Components/TextInput.jsx";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import Pagination from "../../Components/Pagination.jsx";
import Dropdown from "../../Components/Dropdown.jsx";
import { useSearchParams } from "react-router-dom";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function Users() {
    const PER_PAGE_OPTIONS = [
        { value: 5, label: "5 записей" },
        { value: 10, label: "10 записей" },
        { value: 20, label: "20 записей" },
        { value: 50, label: "50 записей" }
    ];

    const SORT_OPTIONS = [
        { value: "name_desc", label: "По убыванию имени пользователя" },
        { value: "name_asc", label: "По возрастанию имени пользователя" },
        { value: "email_desc", label: "По убыванию email" },
        { value: "email_asc", label: "По возрастанию email" },
        { value: "id_desc", label: "Сначала новые" },
        { value: "id_asc", label: "Сначала старые" },
    ];

    const [usersData, setUsersData] = useState({
        items: [],
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 1
    });

    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [mailFree, setMailFree] = useState(true);

    // Состояния для аватарки
    const [avatarPreviewBase64, setAvatarPreviewBase64] = useState(null);
    const [avatarBlob, setAvatarBlob] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [imgSrc, setImgSrc] = useState(null);
    const [crop, setCrop] = useState({ unit: '%', width: 50, height: 50, aspect: 1 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);
    const [emailForAvatar, setEmailForAvatar] = useState('');
    const [emailForCheck, setEmailForCheck] = useState('');
    const [focusLeave, setFocusLeave] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get("page")) || 1;

    const [sortParam, setSortParam] = useState(localStorage.getItem('user_sort') || 'name_asc');
    const [perPage, setPerPage] = useState(parseInt(localStorage.getItem('users_per_page_user') || 10));

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
        clearErrors
    } = useForm({
        mode: "onTouched",
        defaultValues: {
            name: '',
            email: '',
            password: '',
            admin: false
        },
    });

    const fetchUsers = async (page, per_page, sort) => {
        try {
            setLoading(true);
            const [field, direction] = sort.split("_");
            const response = await api.getUsers(page, per_page, field, direction);
            if (response?.data) {
                setUsersData(response.data);
            } else {
                setUsersData(prev => ({ ...prev, items: [] }));
                //toast.error("Не удалось получить список пользователей");
                throw new Error("Не удалось получить список пользователей");
            }
        } catch (error) {
            if (error?.status != 401)
                toast.error((error?.message || "Ошибка при получении данных") + ` Код ошибки: ${error?.status}`, {toastId: "unique-message-8"});
        } finally {
            setLoading(false);
        }
    };

    const handlePerPageChange = (e) => {
        const newPerPage = parseInt(e.target.value);
        setPerPage(newPerPage);
        localStorage.setItem('users_per_page_user', newPerPage.toString());
        setSearchParams({ page: 1 });
    };

    const handleFocusLeaveEmail = (e) => {
        setFocusLeave(true);
        setEmailForAvatar(e.target.value)
        handleMailOne(e);
        
    };

    const handleSortChange = (e) => {
        setSortParam(e.target.value);
        localStorage.setItem('user_sort', e.target.value);
        setSearchParams({ page: 1 });
    };

    const handleCreateClick = () => {
        setIsCreating(true);
        setCurrentUserId(null);
        reset({
            name: '',
            email: '',
            password: '',
            admin: false
        });
        setAvatarPreviewBase64(null);
        setAvatarBlob(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (user) => {
        setIsCreating(false);
        setCurrentUserId(user.id);

        setValue('name', user.username);
        setValue('email', user.mail);
        setValue('admin', user.admin === null ? "null" : String(user.admin));
        setEmailForAvatar(user.mail);
        setEmailForCheck(user.mail);

        setAvatarPreviewBase64(user.photo || null);
        setAvatarBlob(null);

        setIsModalOpen(true);
    };

    const handleDelete = async (userId) => {

            try {
                const response = await api.deleteUser(userId);
                if (response?.data?.active)
                    toast.success("Пользователь успешно разблокирован");
                else
                    toast.success("Пользователь успешно заблокирован");
                fetchUsers(currentPage, perPage, sortParam);
            } catch (error) {
                if (error?.status != 401)
                    toast.error(error.response?.data?.detail || "Ошибка при удалении", {toastId: "unique-message-9"});
            }
        
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error("Пожалуйста, выберите изображение", {toastId: "unique-message-10"});
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Файл не должен превышать 5 МБ", {toastId: "unique-message-11"});
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImgSrc(reader.result);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Автоматический максимальный квадратный кроп (в процентах)
    useEffect(() => {
        if (!imgSrc || !imageRef.current) return;
        const img = imageRef.current;
        const onImageLoad = () => {
            const { naturalWidth, naturalHeight } = img;
            if (!naturalWidth || !naturalHeight) return;
            const size = Math.min(naturalWidth, naturalHeight);
            const widthPercent = (size / naturalWidth) * 100;
            const heightPercent = (size / naturalHeight) * 100;
            const xPercent = ((naturalWidth - size) / 2 / naturalWidth) * 100;
            const yPercent = ((naturalHeight - size) / 2 / naturalHeight) * 100;

            const newCrop = {
                unit: '%',
                x: xPercent,
                y: yPercent,
                width: widthPercent,
                height: heightPercent,
                aspect: 1,
            };
            setCrop(newCrop);
            setCompletedCrop(newCrop);
        };
        if (img.complete && img.naturalWidth > 0) {
            onImageLoad();
        } else {
            img.addEventListener('load', onImageLoad);
            return () => img.removeEventListener('load', onImageLoad);
        }
    }, [imgSrc]);

    // ✅ Универсальная обрезка с поддержкой % и px
    const getCroppedBlob = async () => {
        if (!completedCrop || !imageRef.current) return null;
        const image = imageRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;
        const displayedWidth = image.width;
        const displayedHeight = image.height;

        let cropX = completedCrop.x;
        let cropY = completedCrop.y;
        let cropWidth = completedCrop.width;
        let cropHeight = completedCrop.height;

        console.log('Исходный completedCrop:', completedCrop);
        console.log(`natural: ${naturalWidth}x${naturalHeight}, displayed: ${displayedWidth}x${displayedHeight}`);

        if (completedCrop.unit === '%') {
            // Преобразуем проценты в пиксели относительно натурального размера
            cropX = (cropX / 100) * naturalWidth;
            cropY = (cropY / 100) * naturalHeight;
            cropWidth = (cropWidth / 100) * naturalWidth;
            cropHeight = (cropHeight / 100) * naturalHeight;
        } else {
            // Если единица 'px' – координаты даны относительно отображаемого размера
            const scaleX = naturalWidth / displayedWidth;
            const scaleY = naturalHeight / displayedHeight;
            cropX = cropX * scaleX;
            cropY = cropY * scaleY;
            cropWidth = cropWidth * scaleX;
            cropHeight = cropHeight * scaleY;
        }

        // Округляем, чтобы избежать полупикселей
        cropX = Math.round(cropX);
        cropY = Math.round(cropY);
        cropWidth = Math.round(cropWidth);
        cropHeight = Math.round(cropHeight);

        console.log(`Обрезаемая область после пересчёта: x=${cropX}, y=${cropY}, w=${cropWidth}, h=${cropHeight}`);

        canvas.width = cropWidth;
        canvas.height = cropHeight;
        ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
        });
    };

    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleSaveCrop = async () => {
        const blob = await getCroppedBlob();
        if (!blob) {
            toast.error("Не удалось обрезать изображение", {toastId: "unique-message-12"});
            return;
        }
        setIsUploadingAvatar(true);
        try {
            const base64 = await blobToBase64(blob);
            setAvatarPreviewBase64(base64);
            setAvatarBlob(blob);
            setShowCropModal(false);
            setImgSrc(null);
            setCompletedCrop(null);
        } catch (err) {
            console.error(err);
            if (err?.status != 401)
                toast.error("Ошибка при обработке изображения", {toastId: "unique-message-13"});
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const closeCropModal = () => {
        setShowCropModal(false);
        setImgSrc(null);
        setCompletedCrop(null);
    };

    const onSubmit = async (data) => {
        const normalizedData = {
            username: data.name,
            mail: data.email,
            admin: data.admin == "null" ? null : (data.admin === "true"),
            password: data.password || undefined
        };
        const formData = new FormData();
        formData.append('id', currentUserId);
        formData.append('username', normalizedData.username);
        formData.append('mail', normalizedData.mail);
        formData.append('admin', normalizedData.admin === null ? 'null' : normalizedData.admin);
        if (normalizedData.password) {
            formData.append('password', normalizedData.password);
        }
        if (avatarBlob) {
            formData.append('image', avatarBlob, 'avatar.jpg');
        }
        console.info(formData)
        try {
            if (isCreating && mailFree) {
                await api.postRegister(formData);
                toast.success("Пользователь создан");
            } else if (!isCreating) {
                await api.updateUser(formData);
                toast.success("Пользователь обновлён");
            } else {
                toast.error("Почта уже занята", {toastId: "unique-message-15"});
                return;
            }

            setIsModalOpen(false);
            setAvatarPreviewBase64(null);
            setAvatarBlob(null);
            fetchUsers(currentPage, perPage, sortParam);
        } catch (error) {
            if (error?.status != 401)
                toast.error(error.response?.data?.detail || "Ошибка при сохранении", {toastId: "unique-message-14"});
        }
    };

    const handleMail = async (e) => {
        if (focusLeave) {
        const mail = e.target.value;
        setValue("email", mail, { shouldValidate: true });
        if (!mail) return;
        try {
            const res = await api.checkMail(mail);
            setMailFree(res.data);
        } catch (error) {
            if (error?.status != 401)
                toast.error("Ошибка проверки почты", {toastId: "unique-message-16"});
        }
    }
    };

    const handleMailOne = async (e) => {
        const mail = e.target.value;
        setValue("email", mail, { shouldValidate: true });
        if (!mail) return;
        try {
            const res = await api.checkMail(mail);
            setMailFree(res.data);
        } catch (error) {
            if (error?.status != 401)
                toast.error("Ошибка проверки почты", {toastId: "unique-message-17"});
        }
    };

    const handlePageChange = (page) => {
        setSearchParams({ page });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(currentPage, perPage, sortParam);
        }, 100);
        return () => clearTimeout(timer);
    }, [currentPage, sortParam, perPage]);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === "Escape") setIsModalOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    useEffect(() => {
        if (!isModalOpen) {

        
        reset({
            name: '',
            email: '',
            password: '',
            admin: false
        });
        clearErrors();
        setEmailForAvatar('');
        setFocusLeave(false);
        setMailFree(true);
    }
    }, [isModalOpen]);

    return (
        <div className="py-12">
            <Helmet>
                <title>Список пользователей</title>
            </Helmet>

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white shadow-sm sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="p-6 text-gray-900">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold dark:text-gray-200">Список пользователей</h1>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Всего: {usersData.total} пользователей
                                </span>
                                <br />
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    <select
                                        value={sortParam}
                                        onChange={handleSortChange}
                                        className="p-2 mt-2 rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        {SORT_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={perPage}
                                        onChange={handlePerPageChange}
                                        className="p-2 mt-2 rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        {PER_PAGE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 me-3">
                                <button
                                    title="Создать пользователя"
                                    onClick={handleCreateClick}
                                    className="flex items-center focus:outline-none text-white bg-green-400 hover:bg-green-500 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm py-2.5 px-2.5 me-2 mb-2 dark:bg-green-900 dark:hover:bg-green-800 dark:focus:ring-green-900 transition-all duration-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <Spiner />
                        ) : (
                            <>
                                {usersData.items && usersData.items.length > 0 ? (
                                    <div className="space-y-4">
                                        {usersData.items.map((user) => (
                                            <div key={user.id} className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700 transition-colors">
                                                <div className="flex-1 flex items-center gap-3">
                                                    <Avatar email={user.mail} avatarUrl={user?.photo} size="md" className="me-2" />
                                                    <div className="flex-1">
                                                        <p className="text-lg font-medium text-gray-900 truncate dark:text-gray-200">{user.username}</p>
                                                        <p className="text-sm text-gray-500 truncate dark:text-gray-400">{user.mail}</p>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {user.admin ? 'Администратор' : user.admin === false ? 'Психолог' : "Диагностируемый"}
                                                        </div>
                                                        {!user?.active && (
                                                        <span className={`w-fit p-2 py-1 text-xs rounded-full ${
                            user?.active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            {'Заблокирован'}
                        </span>)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Dropdown>
                                                        <Dropdown.Trigger>
                                                            <button type="button" className="inline-flex justify-center items-center h-11 w-11 bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm py-2.5 me-2 mb-2 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:focus:ring-gray-800 transition-colors duration-300">
                                                                <svg className="h-full w-auto text-center m-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                </svg>
                                                            </button>
                                                        </Dropdown.Trigger>
                                                        <Dropdown.Content>
                                                            <Dropdown.Link as="button" onClick={() => handleEditClick(user)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                Изменить
                                                            </Dropdown.Link>
                                                            <Dropdown.Link as="button" onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }} className={`flex items-center px-4 py-2 text-sm ${user?.active ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"} hover:bg-gray-100 dark:hover:bg-gray-600`}>
                                                                {user?.active ? (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                  </svg>
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
                                                                )}
                                                                {user?.active ? 'Заблокировать' : 'Разблокировать'}
                                                            </Dropdown.Link>
                                                        </Dropdown.Content>
                                                    </Dropdown>
                                                </div>
                                            </div>
                                        ))}
                                        <Pagination currentPage={usersData.page} totalPages={usersData.total_pages} onPageChange={handlePageChange} />
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">Нет пользователей для отображения</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Модальное окно создания/редактирования */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md dark:bg-gray-800">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4 dark:text-gray-200">
                                {isCreating ? 'Добавить нового пользователя' : 'Редактировать пользователя'}
                            </h2>
                            <div className="flex justify-center mb-6">
                                <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                                    <Avatar
                                        key={avatarPreviewBase64 || (isCreating ? 'new' : 'edit')}
                                        email={emailForAvatar || 'temp'}
                                        avatarUrl={avatarPreviewBase64}
                                        inEdit={avatarPreviewBase64?.startsWith("data")}
                                        size="xxl"
                                        className="rounded-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <span className="text-white text-sm font-medium">Изменить</span>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/jpeg,image/png,image/jpg"
                                    className="hidden"
                                />
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя пользователя</label>
                                    <input
                                        type="text"
                                        autocomplete="off"
                                        maxLength={30}
                                        {...register('name', { required: 'Обязательное поле' })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.name.message}</p>}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        autocomplete="off"
                                        {...register('email', {
                                            required: 'Обязательное поле',
                                            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Некорректный email" }
                                        })}
                                        onChange={handleMail}
                                        onBlur={handleFocusLeaveEmail}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.email.message}</p>}
                                    {(!mailFree && emailForCheck !== watch('email'))&& <p className="mt-1 text-sm text-red-600 dark:text-red-500">Эта почта занята!</p>}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isCreating ? 'Пароль' : 'Новый пароль (оставьте пустым, чтобы не менять)'}
                                    </label>
                                    {isCreating ? (
                                        <>
                                            <TextInput
                                                id="password"
                                                type="password"
                                                autocomplete="off"
                                                {...register('password', {
                                                    required: "Обязательное поле",
                                                    pattern: {
                                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/,
                                                        message: "Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и спецсимволы"
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                            {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.password.message}</p>}
                                        </>
                                    ) : (
                                        <>
                                            <TextInput
                                                id="password"
                                                type="password"
                                                autocomplete="off"
                                                {...register('password', {
                                                    pattern: {
                                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/,
                                                        message: "Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и спецсимволы"
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                            {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.password.message}</p>}
                                        </>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Роль пользователя</label>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <input type="radio" value="true" {...register("admin", {required: 'Роль обязательна для выбора'})} className="h-4 w-4" autocomplete="off" />
                                            <label className="ml-2">Администратор</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input type="radio" value="false" {...register("admin", {required: 'Роль обязательна для выбора'})} className="h-4 w-4" autocomplete="off" />
                                            <label className="ml-2">Психолог</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input type="radio" value="null" {...register("admin", {required: 'Роль обязательна для выбора'})} className="h-4 w-4" autocomplete="off" />
                                            <label className="ml-2">Диагностируемый</label>
                                        </div>
                                    </div>
                                    {errors.admin && <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.admin.message}</p>}
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={(isCreating && !mailFree) || isUploadingAvatar}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        {isCreating ? 'Зарегистрировать' : 'Сохранить'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно кропа */}
            {showCropModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full p-4">
                        <h3 className="text-lg font-semibold mb-4">Обрезать аватар</h3>
                        <div className="flex justify-center">
                            {imgSrc && (
                                <ReactCrop
                                    crop={crop}
                                    onChange={setCrop}
                                    onComplete={setCompletedCrop}
                                    aspect={1}
                                    circularCrop={true}
                                >
                                    <img ref={imageRef} src={imgSrc} alt="Crop preview" style={{ maxHeight: '60vh', maxWidth: '100%' }} />
                                </ReactCrop>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={closeCropModal} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" disabled={isUploadingAvatar}>Отмена</button>
                            <button onClick={handleSaveCrop} disabled={!completedCrop || isUploadingAvatar} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                                {isUploadingAvatar ? 'Обработка...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}