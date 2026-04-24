// ProfileInformation.jsx (исправленный)
import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Avatar from '../../../Components/Avatar.jsx';
import { api } from "../../../api/api"
import { toast } from "react-toastify";

export default function ProfileInformation({
    className = '',
    user = null,
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

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error("Пожалуйста, выберите изображение");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Файл не должен превышать 5 МБ");
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

        if (img.complete) {
            onImageLoad();
        } else {
            img.addEventListener('load', onImageLoad);
            return () => img.removeEventListener('load', onImageLoad);
        }
    }, [imgSrc]);

    // Универсальная обрезка с поддержкой % и px
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

        ctx.drawImage(
            image,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
        });
    };

    const handleSaveCrop = async () => {
        const blob = await getCroppedBlob();
        if (!blob) {
            toast.error("Невозможно сохранить без выделения области");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', blob, 'avatar.jpg');

        try {
            const response = await api.addImage(formData);
            if (response.status === 200) {
                if (getInfoBase) getInfoBase();
                if (onAvatarUpdate) onAvatarUpdate(user?.photo);
                setShowCropModal(false);
                setImgSrc(null);
                setCompletedCrop(null);
            } else {
                toast.error("Ошибка загрузки");
                throw new Error('Ошибка загрузки');
            }
        } catch (err) {
            toast.error("Ошибка загрузки");
            console.error('Ошибка:', err);
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