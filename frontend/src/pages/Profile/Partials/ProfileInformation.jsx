// ProfileInformation.jsx
import React, { useContext, useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Avatar from '../../../Components/Avatar.jsx';
import { api } from "../../../api/api.js";

export default function ProfileInformation({
    className = '',
    user=null,
    getInfoBase = null,
    onAvatarUpdate,
}) {
    const [showCropModal, setShowCropModal] = useState(false);
    const [imgSrc, setImgSrc] = useState(null);
    const [crop, setCrop] = useState({ unit: '%', width: 50, height: 50, aspect: 1 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);
    // Открываем проводник
    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    // Выбор файла
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите изображение');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Файл не должен превышать 5 МБ');
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

    // Автоматическая установка максимального квадратного кропа после загрузки изображения
    useEffect(() => {
        if (!imgSrc || !imageRef.current) return;

        const img = imageRef.current;
        const onImageLoad = () => {
            const { naturalWidth, naturalHeight } = img;
            const size = Math.min(naturalWidth, naturalHeight); // максимальный квадрат
            // Вычисляем отступы и размер в процентах
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
            setCompletedCrop(newCrop); // сразу завершаем кроп, чтобы кнопка стала активной
        };

        if (img.complete) {
            onImageLoad();
        } else {
            img.addEventListener('load', onImageLoad);
            return () => img.removeEventListener('load', onImageLoad);
        }
    }, [imgSrc]);

    // Обрезка в Blob
    const getCroppedBlob = async () => {
        if (!completedCrop || !imageRef.current) return null;

        const canvas = document.createElement('canvas');
        const image = imageRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const ctx = canvas.getContext('2d');

        const cropArea = {
            x: completedCrop.x * scaleX,
            y: completedCrop.y * scaleY,
            width: completedCrop.width * scaleX,
            height: completedCrop.height * scaleY,
        };

        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        ctx.drawImage(
            image,
            cropArea.x,
            cropArea.y,
            cropArea.width,
            cropArea.height,
            0,
            0,
            cropArea.width,
            cropArea.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
        });
    };

    // Отправка на бэкенд
    const handleSaveCrop = async () => {
        const blob = await getCroppedBlob();
        if (!blob) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', blob, 'avatar.jpg'); // исправлено имя поля

        try {
            const response = await api.addImage(formData);
            if (response.status == 200) getInfoBase();
            if (onAvatarUpdate) {
                onAvatarUpdate(user?.url);
            }
            setShowCropModal(false);
            setImgSrc(null);
            setCompletedCrop(null);
        } catch (err) {
            console.error('Ошибка:', err);
            alert('Не удалось загрузить аватар: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const closeModal = () => {
        setShowCropModal(false);
        setImgSrc(null);
        setCompletedCrop(null);
    };

    if (!user) return null;

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Информация о пользователе
                </h2>
            </header>

            <div className="general-information flex">
                <div className="relative me-10 mt-5 hidden sm:block">
                    <div
                        className="relative cursor-pointer group"
                        onClick={handleAvatarClick}
                    >
                        <Avatar
                            email={user.email}
                            avatarUrl={user.photo}
                            size="xxl"
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

                <div className="information">
                    <div className="mt-6 space-y-6">
                        <div>
                            <label htmlFor="name" className="block font-medium">Имя пользователя</label>
                            <h2 id="name" className="mt-1 block break-normal font-bold">{user.username}</h2>
                        </div>
                    </div>
                    <div className="mt-6 space-y-6">
                        <div>
                            <label htmlFor="email" className="block font-medium">Email</label>
                            <h2 id="email" className="mt-1 block break-normal font-bold">{user.email}</h2>
                        </div>
                    </div>
                    <div className="mt-6 space-y-6">
                        <div>
                            <label htmlFor="role" className="block font-medium">Роль</label>
                            <h2 id="role" className="mt-1 block break-normal font-bold">{user.admin ? 'Админ' : 'Психолог'}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальное окно */}
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
                                    circularCrop={true}   // визуальный круг
                                >
                                    <img
                                        ref={imageRef}
                                        src={imgSrc}
                                        alt="Crop preview"
                                        style={{ maxHeight: '60vh', maxWidth: '100%' }}
                                    />
                                </ReactCrop>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                disabled={isUploading}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleSaveCrop}
                                disabled={!completedCrop || isUploading}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isUploading ? 'Загрузка...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}